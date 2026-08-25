import os
# Corriendo en local: no seteamos DATABASE_URL, así conexion_db.py
# usa automáticamente su rama de XAMPP (localhost, semaforo_alerta).

from importador_Tutores import importar_tutores
from importador_docentes import importar_docentes
from conexion_db import obtener_conexion
import pandas as pd
import bcrypt


import unicodedata

def quitar_acentos(texto):
    """Convierte 'María' -> 'Maria', 'Ángeles' -> 'Angeles', etc."""
    forma_nfkd = unicodedata.normalize('NFKD', texto)
    return "".join(c for c in forma_nfkd if not unicodedata.combining(c))


def normalizar_nombre(*partes):
    """Junta todas las palabras de nombre+apellidos, sin importar el orden
    en que vengan ni los acentos, para poder comparar aunque un archivo
    tenga el nombre antes de los apellidos y el otro al revés, o con/sin tildes."""
    palabras = " ".join(partes).split()
    return " ".join(sorted(quitar_acentos(p.upper().strip()) for p in palabras if p.strip()))


def buscar_usuario_existente(cursor, nombre_completo):
    """Busca en usuarios comparando el conjunto de palabras del nombre,
    sin importar el orden. Devuelve (Id_Usuario, Id_Rol) o (None, None)."""
    objetivo = normalizar_nombre(nombre_completo)
    cursor.execute("SELECT Id_Usuario, Nombre, Apellidos, Id_Rol FROM usuarios")
    for id_usuario, nombre, apellidos, id_rol in cursor.fetchall():
        if normalizar_nombre(nombre, apellidos) == objetivo:
            return id_usuario, id_rol
    return None, None


def insertar_tutores_usuarios(cursor, tutor):
    id_usuario, id_rol_actual = buscar_usuario_existente(cursor, tutor["tutor"])

    if id_usuario is None:
        print(f"[AVISO] El tutor '{tutor['tutor']}' no coincide con ningún docente ya "
            f"insertado. No se creó usuario para él (rol 3 no se usa). Revisa el nombre "
            f"en 'Datos Programa.xlsx' vs 'correos docentes.xlsx'.")
        return None

    # Ya existe como docente (rol 2): lo ascendemos a "Docente/Tutor" (rol 5).
    # Si ya era rol 5 (de un grupo anterior) lo dejamos igual.
    if id_rol_actual == 2:
        cursor.execute("UPDATE usuarios SET Id_Rol = 5 WHERE Id_Usuario = %s", (id_usuario,))

    return id_usuario


def obtener_mapa_grupos(cursor):
    cursor.execute("SELECT Id_Grupo, Nombre FROM grupos")
    return {nombre: id_grupo for (id_grupo, nombre) in cursor.fetchall()}


def insertar_tutor_grupo(cursor, id_usuario, id_grupo):
    sql = "INSERT IGNORE INTO tutor_grupo (Id_Usuario, Id_Grupo) VALUES (%s, %s)"
    cursor.execute(sql, (id_usuario, id_grupo))
    return cursor.lastrowid


def insertar_docentes(cursor, docente):
    partes = docente["nombre_docente"].split(" ")
    nombre_docente = " ".join(partes[2:])
    apellidos_docente = " ".join(partes[:2])

    cursor.execute("SELECT Id_Usuario FROM usuarios WHERE Nombre = %s AND Apellidos = %s LIMIT 1", (nombre_docente, apellidos_docente))
    resultado = cursor.fetchone()
    if resultado:
        return resultado[0]

    password = bcrypt.hashpw(docente["correo"].encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    sql = "INSERT INTO usuarios (Id_Rol, Nombre, Apellidos, Email, Password) VALUES (%s, %s, %s, %s, %s)"
    valores = (docente["rol"], nombre_docente, apellidos_docente, docente["correo"], password)
    cursor.execute(sql, valores)
    return cursor.lastrowid


# ---- Rutas de los archivos locales ----
hoja3 = pd.read_excel(r"C:\Users\crisf\OneDrive\Documentos\UPT\SEXTO CUATRIMESTRE_SERVICIO_SOCIAL_(TSU)\Proyecto_Documentacion\Datos Programa.xlsx", skiprows=7)
hoja_docentes = pd.read_excel(r"C:\Users\crisf\OneDrive\Documentos\UPT\SEXTO CUATRIMESTRE_SERVICIO_SOCIAL_(TSU)\Proyecto_Documentacion\archivos de prueba\correos docentes.xlsx")

tutores = importar_tutores(hoja3)
docentes = importar_docentes(hoja_docentes)

conexion = obtener_conexion()
cursor = conexion.cursor()

# Docentes primero (algunos tutores pueden ya existir como docentes con rol 5)
for docente in docentes:
    insertar_docentes(cursor, docente)

mapa_grupos = obtener_mapa_grupos(cursor)

for tutor in tutores:
    id_usuario = insertar_tutores_usuarios(cursor, tutor)
    if id_usuario is None:
        continue  # ya se imprimió el aviso dentro de la función
    id_grupo = mapa_grupos.get(tutor["grupo"])
    if id_grupo is None:
        print(f"Aviso: el grupo '{tutor['grupo']}' del tutor {tutor['tutor']} no existe en la tabla grupos. Se omite.")
        continue
    insertar_tutor_grupo(cursor, id_usuario, id_grupo)

conexion.commit()
cursor.close()
conexion.close()

print(f"Listo: {len(docentes)} docentes y {len(tutores)} tutores procesados.")