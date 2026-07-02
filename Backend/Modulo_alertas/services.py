from .queries import consultar_alumnos_por_alerta, consultar_grupos, consultar_resumen_destinatarios
from conexion_db import obtener_conexion

def obtener_alumnos_por_alerta(nivel):
    conexion = obtener_conexion()
    cursor = conexion.cursor(dictionary=True)
    cursor.execute(consultar_alumnos_por_alerta(), (nivel,))
    alumnos = cursor.fetchall()
    cursor.close()
    conexion.close()
    return alumnos

def obtener_grupos():
    conexion = obtener_conexion()
    cursor = conexion.cursor(dictionary=True)
    cursor.execute(consultar_grupos())
    grupos = cursor.fetchall()
    cursor.close()
    conexion.close()
    return grupos

def obtener_resumen_destinatarios():
    conexion = obtener_conexion()
    cursor = conexion.cursor(dictionary=True)
    cursor.execute(consultar_resumen_destinatarios())
    resumen = cursor.fetchall()
    cursor.close()
    conexion.close()
    return resumen