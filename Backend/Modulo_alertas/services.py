from .queries import consultar_alumnos_por_alerta, consultar_grupos, consultar_resumen_destinatarios, consultar_alertas_por_alumno
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

def obtener_alertas_alumno(matricula, nivel=None, fecha_inicio=None, fecha_fin=None):
    conexion = obtener_conexion()
    cursor = conexion.cursor(dictionary=True)

    filtro_nivel = ""
    filtro_fecha = ""
    params = [matricula]

    if nivel and nivel.lower() != "todas":
        filtro_nivel = "AND na.Nombre = %s"
        params.append(nivel)

    if fecha_inicio:
        filtro_fecha += "AND al.Fecha_Calculo >= %s "
        params.append(fecha_inicio)
    if fecha_fin:
        filtro_fecha += "AND al.Fecha_Calculo <= %s "
        params.append(fecha_fin)

    query = consultar_alertas_por_alumno().format(filtro_nivel=filtro_nivel, filtro_fecha=filtro_fecha)
    cursor.execute(query, params)
    alertas = cursor.fetchall()

    cursor.close()
    conexion.close()

    for a in alertas:
        if a.get("Fecha_Calculo"):
            a["Fecha_Calculo"] = a["Fecha_Calculo"].strftime("%d/%m/%Y %H:%M")

    return alertas