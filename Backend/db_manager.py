from importador_TACA import importar_alumnos, importar_materias, importar_calificaciones
from importador_Contactos import importar_correos_electronicos
from importador_fotos import importar_fotos
from importador_Tutores import importar_tutores
from conexion_db import obtener_conexion
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

def insertar_alumnos_usuarios(cursor, alumno):
    # Si el usuario ya existe (misma matrícula como Email), no lo volvemos a crear
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
    cursor.execute("SELECT Id_Usuario FROM usuarios WHERE Email = %s", (alumno["matricula"],))
    resultado = cursor.fetchone()
    return resultado[0]

def insertar_alumnos(cursor, alumno, id_grupo, id_usuario):
    sql = "INSERT IGNORE INTO alumnos (Matricula, Nombre, Apellidos, Id_Grupo, Foto, Email, id_usuario) VALUES(%s, %s, %s, %s, %s, %s, %s)"
    apellidos = alumno["apellido.p"] + " " + alumno["apellido.m"]
    valores = (
        alumno["matricula"],
        alumno["nombre(s)"],
        apellidos,
        id_grupo,
        None,
        None,
        id_usuario,
    )
    cursor.execute(sql,valores)
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
    sql = "INSERT INTO calificaciones (Matricula, Id_Materia, Id_Importacion, Periodo, P1, P2, P3, PR, Aprobado) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s) ON DUPLICATE KEY UPDATE P1 = VALUES(P1), P2 = VALUES(P2), P3 = VALUES(P3), PR = VALUES(PR), Aprobado = VALUES(Aprobado)"
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
             ON DUPLICATE KEY UPDATE Id_Nivel = VALUES(Id_Nivel), Materias_Reprobadas = VALUES(Materias_Reprobadas),
                                     PAC = VALUES(PAC), Fecha_Calculo = NOW()"""
    valores = (matricula, periodo, id_nivel, materias_reprobadas, pac)
    cursor.execute(sql, valores)
    return cursor.lastrowid

def actualizar_correo(cursor, contacto):
    sql = "UPDATE alumnos SET Email = %s WHERE Matricula = %s"
    valores = (
        contacto["correo"], 
        contacto["matricula"]
    )
    cursor.execute(sql,valores)
    return cursor.rowcount

def actualizar_fotos(cursor, matricula, ruta):
    sql = "UPDATE alumnos SET Foto= %s WHERE Matricula = %s"
    valores = (
        ruta,
        matricula
    )
    cursor.execute(sql,valores)
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


def importar_taca_completo(ruta_archivo, nombre_archivo, id_grupo, id_carrera,
                            semestre, periodo, importado_por=None):
    """
    Recibe la ruta de un archivo TACA ya guardado en disco (temporal),
    lo procesa completo e inserta materias, alumnos y calificaciones.
    Devuelve un resumen para mostrar en el Historial de Importaciones.
    """
    tablas = pd.read_html(ruta_archivo)
    hoja = tablas[0]

    materias = importar_materias(hoja)
    alumnos = importar_alumnos(hoja)
    calificaciones = importar_calificaciones(hoja, materias)

    conexion = obtener_conexion()
    cursor = conexion.cursor()

    try:
        mapa_materias = {}
        for materia in materias:
            id_materia = insertar_materia(cursor, materia, id_carrera, semestre, periodo)
            mapa_materias[materia["nombre"]] = id_materia

        for alumno in alumnos:
            id_usuario = insertar_alumnos_usuarios(cursor, alumno)
            insertar_alumnos(cursor, alumno, id_grupo, id_usuario)

        id_importacion = insertar_importacion(cursor, id_grupo, periodo, nombre_archivo, importado_por)

        for calificacion in calificaciones:
            id_materia = mapa_materias[calificacion["materia"]]
            insertar_calificaciones(cursor, calificacion, id_materia, id_importacion, periodo, calificacion["aprobado"])

        # Calculamos materias reprobadas por alumno y guardamos su alerta (PAC + nivel)
        reprobadas_por_alumno = {}
        for calificacion in calificaciones:
            if calificacion["aprobado"] == 0:
                matricula = calificacion["matricula"]
                reprobadas_por_alumno[matricula] = reprobadas_por_alumno.get(matricula, 0) + 1

        for alumno in alumnos:
            matricula = alumno["matricula"]
            reprobadas = reprobadas_por_alumno.get(matricula, 0)
            insertar_alerta(cursor, matricula, periodo, reprobadas, alumno["PAC"])

        conexion.commit()
        return {
            "id_importacion": id_importacion,
            "alumnos": len(alumnos),
            "materias": len(materias),
            "calificaciones": len(calificaciones),
        }
    except Exception:
        conexion.rollback()
        raise
    finally:
        cursor.close()
        conexion.close()