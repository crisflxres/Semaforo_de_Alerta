from importador import importar_alumnos, importar_materias, importar_calificaciones
from app import obtener_conexion
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
    if cursor.lastrowid == 0:
        cursor.execute ("SELECT Id_Materia FROM materias WHERE Nombre = %s AND Id_Carrera = %s AND Periodo = %s", (materia["nombre"], id_carrera, periodo))
        resultado = cursor.fetchone()
        return resultado[0]
    return cursor.lastrowid


def insertar_alumnos_usuarios(cursor, alumno):
    password = bcrypt.hashpw(alumno["matricula"].encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    sql = "INSERT IGNORE INTO usuarios (Id_Rol, Nombre, Apellidos, Email, Password) VALUES (%s, %s, %s, %s, %s)"
    apellidos = alumno["apellido.p"] + " " + alumno["apellido.m"]
    valores = (
        5,
        alumno["nombre(s)"],
        apellidos,
        alumno["matricula"],
        password
    )
    cursor.execute(sql, valores)
    if cursor.lastrowid == 0:
        cursor.execute ("SELECT Id_Usuario FROM usuarios WHERE Email = %s", (alumno["matricula"],))
        resultado = cursor.fetchone()
        return resultado[0]
    return cursor.lastrowid

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
    if cursor.lastrowid == 0:
        cursor.execute ("SELECT Matricula FROM alumnos WHERE Matricula = %s", (alumno["matricula"],))
        resultado = cursor.fetchone()
        return resultado[0]
    return cursor.lastrowid

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
    
TACA = pd.read_html(r"C:\Users\crisf\OneDrive\Documentos\UPT\SEXTO CUATRIMESTRE_SERVICIO_SOCIAL_(TSU)\Proyecto_Documentacion\TACA_03AL4I.xls")

hoja = TACA[0]

materias = importar_materias(hoja)
alumnos = importar_alumnos(hoja)
calificaciones = importar_calificaciones(hoja, materias)

conexion = obtener_conexion()
cursor = conexion.cursor()

mapa_materias = {}
for materia in materias:
    id_materia = insertar_materia(cursor, materia, 2, 6, "FEBRERO - JULIO 2026")
    mapa_materias[materia["nombre"]] = id_materia

for alumno in alumnos:
    id_usuario = insertar_alumnos_usuarios(cursor, alumno)
    insertar_alumnos(cursor, alumno, 40, id_usuario)

id_importacion = insertar_importacion (cursor, 40,"FEBRERO - JULIO 2026", os.path.basename(r"C:\Users\crisf\OneDrive\Documentos\UPT\SEXTO CUATRIMESTRE_SERVICIO_SOCIAL_(TSU)\Proyecto_Documentacion\TACA_03AL4I.xls"), None)

for calificacion in calificaciones:
    id_materia = mapa_materias [calificacion["materia"]]
    insertar_calificaciones(cursor, calificacion, id_materia, id_importacion, "FEBRERO - JULIO 2026", calificacion["aprobado"])

conexion.commit()
conexion.close()