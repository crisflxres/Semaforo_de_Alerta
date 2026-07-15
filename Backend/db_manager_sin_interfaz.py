from importador_TACA import leer_taca, importar_alumnos, importar_materias, importar_calificaciones
from importador_Contactos import importar_correos_electronicos
from importador_fotos import importar_fotos
from importador_Tutores import importar_tutores
from app import obtener_conexion
from importador_docentes import importar_docentes
import pandas as pd
import bcrypt
import os

def insertar_materia(cursor, materia, id_carrera, semestre, periodo):
    sql = "INSERT IGNORE INTO materias (Nombre, Semestre, Id_Carrera, Periodo, Tipo) VALUES (%s, %s, %s, %s, %s)"
    valores = (
        materia["nombre"], 
        semestre, 
        id_carrera, 
        periodo, 
        materia["tipo"]
    )
    cursor.execute(sql, valores)
    cursor.execute("SELECT Id_Materia FROM materias WHERE Nombre = %s AND Id_Carrera = %s AND Periodo = %s", (materia["nombre"], id_carrera, periodo))
    resultado = cursor.fetchone()
    return resultado[0]

def normalizar_matricula(matricula):
    """Quita el prefijo 'M' si existe, para que coincida con el formato
    guardado en alumnos.Matricula (sin la M)."""
    matricula = str(matricula).strip()
    if matricula.upper().startswith("M") and matricula[1:].isdigit():
        matricula = matricula[1:]
    return matricula

def insertar_alumnos_usuarios(cursor, alumno):
    cursor.execute("SELECT Id_Usuario FROM usuarios WHERE Email = %s", (alumno["matricula"],))
    existente = cursor.fetchone()
    if existente:
        return existente[0]

    password = bcrypt.hashpw(alumno["matricula"].encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    sql = "INSERT INTO usuarios (Id_Rol, Nombre, Apellidos, Email, Password) VALUES (%s, %s, %s, %s, %s)"
    apellidos = alumno["apellido.p"] + " " + alumno["apellido.m"]
    valores = (
        5,
        alumno["nombre(s)"],
        apellidos,
        alumno["matricula"],
        password
    )
    cursor.execute(sql, valores)
    return cursor.lastrowid

def insertar_alumnos(cursor, alumno, id_grupo, id_usuario):
    sql = """INSERT INTO alumnos (Matricula, Nombre, Apellidos, Id_Grupo, id_usuario, PAC)
            VALUES (%s, %s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE PAC = VALUES(PAC)"""
    apellidos = alumno["apellido.p"] + " " + alumno["apellido.m"]
    valores = (
        alumno["matricula"],
        alumno["nombre(s)"],
        apellidos,
        id_grupo,
        id_usuario,
        alumno["PAC"],
    )
    cursor.execute(sql, valores)
    cursor.execute("SELECT Matricula FROM alumnos WHERE Matricula = %s", (alumno["matricula"],))
    resultado = cursor.fetchone()
    return resultado[0]

def insertar_importacion(cursor, id_grupo, periodo, archivo,importador_por):
    sql = "INSERT INTO importaciones (Id_grupo, Periodo, archivo, importado_por) VALUES (%s, %s, %s, %s)"
    valores = (
        id_grupo,
        periodo,
        archivo,
        importador_por,
    )
    cursor.execute(sql, valores)
    return cursor.lastrowid

def insertar_calificaciones(cursor, calificacion, id_materia, id_importacion, periodo, aprobado):
    sql = "INSERT INTO calificaciones (Matricula, Id_Materia, Id_Importacion, Periodo, P1, P2, P3, PR, Aprobado) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)ON DUPLICATE KEY UPDATE P1= VALUES (P1), P2 = VALUES(P2), P3 = VALUES(P3), PR =  VALUES(PR)"
    valores = (
        calificacion["matricula"],
        id_materia,
        id_importacion,
        periodo,
        calificacion["P1"],
        calificacion["P2"],
        calificacion["P3"],
        calificacion["PR"],
        aprobado
    )
    cursor.execute(sql, valores)
    return cursor.lastrowid

def actualizar_correo(cursor, contacto):
    matricula = normalizar_matricula(contacto["matricula"])
    sql = "UPDATE alumnos SET Email = %s WHERE Matricula = %s"
    valores = (contacto["correo"], matricula)
    cursor.execute(sql, valores)
    if cursor.rowcount == 0:
        print(f"[AVISO] No se actualizó correo: matrícula '{matricula}' no encontrada en alumnos")
    return cursor.rowcount

def actualizar_fotos(cursor, matricula, ruta):
    matricula = normalizar_matricula(matricula)
    sql = "UPDATE alumnos SET Foto= %s WHERE Matricula = %s"
    valores = (ruta, matricula)
    cursor.execute(sql, valores)
    if cursor.rowcount == 0:
        print(f"[AVISO] No se actualizó foto: matrícula '{matricula}' no encontrada en alumnos")
    return cursor.rowcount

def insertar_tutores_usuarios(cursor, tutor):
    partes = tutor["tutor"].split(" ")
    nombre = " ".join(partes[:2])
    apellidos = " ".join(partes[2:])

    cursor.execute("SELECT Id_Usuario FROM usuarios WHERE Nombre = %s AND Apellidos = %s LIMIT 1", (nombre, apellidos))
    resultado = cursor.fetchone()
    if resultado:
        return resultado[0]
    password = bcrypt.hashpw(tutor["tutor"].encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    sql = "INSERT INTO usuarios (Id_Rol, Nombre, Apellidos, Password) VALUES (%s, %s, %s, %s)"
    valores = (
        3,
        nombre,
        apellidos,
        password
    )
    cursor.execute(sql, valores)
    return cursor.lastrowid

def obtener_mapa_grupos(cursor):
    cursor.execute("SELECT Id_Grupo, Nombre FROM grupos")
    return {nombre: id_grupo for (id_grupo, nombre) in cursor.fetchall()}

def insertar_tutor_grupo(cursor, id_usuario, id_grupo, periodo):
    sql = "INSERT IGNORE INTO tutor_grupo (Id_Usuario, Id_Grupo, Periodo) VALUES (%s, %s, %s)"
    valores = (
        id_usuario,
        id_grupo,
        periodo
    )
    cursor.execute(sql, valores)
    return cursor.lastrowid

def calcular_id_nivel(cursor, materias_reprobadas):
    cursor.execute("""
        SELECT Id_Nivel FROM niveles_alerta
        WHERE Min_Reprobadas <= %s
        AND (Max_Reprobados IS NULL OR Max_Reprobados >= %s)
        ORDER BY Min_Reprobadas DESC
        LIMIT 1
    """, (materias_reprobadas, materias_reprobadas))
    resultado = cursor.fetchone()
    return resultado[0] if resultado else None

def insertar_alerta(cursor, matricula, periodo, materias_reprobadas, pac):
    id_nivel = calcular_id_nivel(cursor, materias_reprobadas)
    sql = """INSERT INTO alertas (Matricula, Periodo, Id_Nivel, Materias_Reprobadas, PAC, Fecha_Calculo)
            VALUES (%s, %s, %s, %s, %s, NOW())
            ON DUPLICATE KEY UPDATE Id_Nivel = VALUES(Id_Nivel),
                                    Materias_Reprobadas = VALUES(Materias_Reprobadas),
                                    PAC = VALUES(PAC),
                                    Fecha_Calculo = NOW()"""
    valores = (matricula, periodo, id_nivel, materias_reprobadas, pac)
    cursor.execute(sql, valores)
    return cursor.lastrowid

def insertar_docentes(cursor, docente):
    partes = docente["nombre_docente"].split(" ")
    nombre_docente = " ".join(partes[2:])
    apellidos_docente = " ".join(partes[:2])
    
    cursor.execute("SELECT Id_Usuario FROM usuarios WHERE Nombre = %s AND Apellidos = %s LIMIT 1", (nombre_docente, apellidos_docente))
    resultado = cursor.fetchone()
    
    if resultado:
        return resultado[0]
    
    password = bcrypt.hashpw(docente["correo"]. encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    sql = "INSERT INTO usuarios (Id_Rol, Nombre, Apellidos, Email, Password) VALUES (%s, %s, %s, %s, %s)"
    valores = (
        docente["rol"],
        nombre_docente,
        apellidos_docente,
        docente["correo"],
        password
    )
    cursor.execute(sql, valores)
    return cursor.lastrowid

# Ahora una sola línea, sin importar si el archivo es HTML disfrazado o .xlsx real
hoja = leer_taca(r"C:\Users\crisf\OneDrive\Documentos\UPT\SEXTO CUATRIMESTRE_SERVICIO_SOCIAL_(TSU)\Proyecto_Documentacion\TACA_03AJ6L.xls")

Contactos = pd.read_excel(r"C:\Users\crisf\OneDrive\Documentos\UPT\SEXTO CUATRIMESTRE_SERVICIO_SOCIAL_(TSU)\Proyecto_Documentacion\proyecto 2026\Matricula_Actual(2).xls")

fotos = importar_fotos(r"C:\Users\crisf\OneDrive\Documentos\UPT\SEXTO CUATRIMESTRE_SERVICIO_SOCIAL_(TSU)\Proyecto_Documentacion\Matricula Total")

hoja3 = pd.read_excel(r"C:\Users\crisf\OneDrive\Documentos\UPT\SEXTO CUATRIMESTRE_SERVICIO_SOCIAL_(TSU)\Proyecto_Documentacion\Datos Programa.xlsx", skiprows= 8)

hoja_docentes = pd.read_excel(r"C:\Users\crisf\OneDrive\Documentos\UPT\SEXTO CUATRIMESTRE_SERVICIO_SOCIAL_(TSU)\Proyecto_Documentacion\archivos de prueba\correos docentes.xlsx")

hoja2 = Contactos

materias = importar_materias(hoja)
alumnos = importar_alumnos(hoja)
calificaciones = importar_calificaciones(hoja, materias)
contactos = importar_correos_electronicos(hoja2)
tutores = importar_tutores(hoja3)
docentes = importar_docentes(hoja_docentes)


conexion = obtener_conexion()
cursor = conexion.cursor()

mapa_materias = {}
for materia in materias:
    id_materia = insertar_materia(cursor, materia, 2, 6, "FEBRERO - JULIO 2026")
    mapa_materias[materia["nombre"]] = id_materia

for alumno in alumnos:
    id_usuario = insertar_alumnos_usuarios(cursor, alumno)
    insertar_alumnos(cursor, alumno, 40, id_usuario)

id_importacion = insertar_importacion (cursor, 40,"FEBRERO - JULIO 2026", os.path.basename(r"C:\Users\Victo\OneDrive\Documentos\Actividades\archivos de prueba\correos docentes.xlsx"), None)

for calificacion in calificaciones:
    id_materia = mapa_materias [calificacion["materia"]]
    insertar_calificaciones(cursor, calificacion, id_materia, id_importacion, "FEBRERO - JULIO 2026", calificacion["aprobado"])

for contacto in contactos:
    actualizar_correo(cursor, contacto)

for foto in fotos:
    actualizar_fotos(cursor, foto["matricula"], foto["ruta"])

mapa_grupos = obtener_mapa_grupos(cursor)

for tutor in tutores:
    id_usuario = insertar_tutores_usuarios(cursor, tutor)
    id_grupo = mapa_grupos.get(tutor["grupo"])
    if id_grupo is None:
        print(f"Aviso: el grupo '{tutor['grupo']}' del tutor {tutor['tutor']} no existe en la tabla grupos. Se omite.")
        continue
    insertar_tutor_grupo(cursor, id_usuario, id_grupo, "FEBRERO - JULIO 2026")

# Calcular e insertar alertas por alumno
reprobadas_por_alumno = {}
for calificacion in calificaciones:
    if calificacion["aprobado"] == 0:
        matricula = calificacion["matricula"]
        reprobadas_por_alumno[matricula] = reprobadas_por_alumno.get(matricula, 0) + 1

for alumno in alumnos:
    matricula = alumno["matricula"]
    reprobadas = reprobadas_por_alumno.get(matricula, 0)
    insertar_alerta(cursor, matricula, "FEBRERO - JULIO 2026", reprobadas, alumno["PAC"])

for docente in docentes:
    insertar_docentes(cursor, docente)

conexion.commit()
conexion.close()