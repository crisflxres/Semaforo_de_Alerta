from flask import Blueprint, jsonify, request
from conexion_db import obtener_conexion
from auth_utils import requiere_rol

materias_bp = Blueprint("materias", __name__)

@materias_bp.route("/api/materias")
@requiere_rol(1, 2, 3)
def get_materias():
    conexion = obtener_conexion()
    query = "SELECT Id_Materia, Nombre, Semestre, Id_Carrera, Periodo, Tipo FROM materias"
    
    cursor = conexion.cursor()
    cursor.execute(query)
    filas = cursor.fetchall()
    
    materias:list = []
    
    for fila in filas:
        materias.append({
            "Id_Materia": fila[0],
            "Nombre": fila[1],
            "Semestre":fila[2],
            "Id_Carrera": fila [3],
            "Periodo": fila[4],
            "Tipo": fila[5]
        })
    cursor.close()
    conexion.close()
    return jsonify(materias)

@materias_bp.route("/api/materias", methods = ["POST"])
@requiere_rol(1, 3)
def crear_materia():
    datos =request.get_json()
    
    nombre = datos.get('Nombre', '').strip()
    semestre = datos.get('Semestre', '')
    clave_Carrera = datos.get('Clave_Carrera', '').strip()
    periodo = datos.get('Periodo', '')
    tipo_materia = datos.get('Tipo')
    
    if not nombre:
        return jsonify({"success": False, "message": "El nombre es obligatorio."}), 400
    conexion = obtener_conexion()
    cursor = conexion.cursor()
    
    sql = "INSERT IGNORE INTO materias (Nombre, Semestre, Id_Carrera, Periodo, Tipo) VALUES (%s, %s, %s, %s, %s)"
    valores = (
        nombre, 
        semestre, 
        clave_Carrera, 
        periodo, 
        tipo_materia
    )
    cursor.execute(sql, valores)
    conexion.commit()

    cursor.close()
    conexion.close()

    return jsonify({"success": True, "message": "Materia registrada correctamente..."})

@materias_bp.route("/api/materias", methods = ["PUT"] )
@requiere_rol(1, 3)
def editar_materia():
    datos = request.get_json()
    
    id_materia   = datos.get('Id_Materia')
    nombre       = datos.get('Nombre', '').strip()
    semestre     = datos.get('Semestre', '')
    clave_carrera = datos.get('Clave_Carrera', '')
    periodo      = datos.get('Periodo', '')
    tipo_materia = datos.get('Tipo', '')

    valores = (nombre, semestre, clave_carrera, periodo, tipo_materia, id_materia)
    
    conexion = obtener_conexion()
    cursor = conexion.cursor()
    
    sql = "UPDATE materias SET Nombre = %s, Semestre = %s, Id_Carrera = %s, Periodo = %s, Tipo = %s WHERE Id_Materia = %s"
    
    cursor.execute(sql, valores)
    conexion.commit()
    
    cursor.close()
    conexion.close()
    
    return jsonify({"success": True, "message": "Materia actualizada correctamente."})

@materias_bp.route("/api/materias", methods = ["DELETE"] )
@requiere_rol(1, 3)
def eliminar_materia():
    dato = request.get_json()
    
    id_materia   = dato.get('Id_Materia')
    
    valor = (id_materia,)
    
    conexion = obtener_conexion()
    cursor = conexion.cursor()
    
    sql = "DELETE FROM materias WHERE Id_Materia = %s"
    
    cursor.execute(sql, valor)
    conexion.commit()
    
    cursor.close()
    conexion.close()
    
    return jsonify({"success": True, "message": "Materia eliminada correctamente."})