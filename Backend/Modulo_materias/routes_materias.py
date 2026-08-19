from flask import Blueprint, jsonify, request
from conexion_db import obtener_conexion
from auth_utils import requiere_rol
import mysql.connector

materias_bp = Blueprint("materias", __name__)

@materias_bp.route("/api/materias", methods=["GET"])
@requiere_rol(1, 2, 3, 5)
def get_materias():
    conexion = None
    try:
        conexion = obtener_conexion()
        cursor = conexion.cursor(dictionary=True)
        query = "SELECT Id_Materia, Nombre, Semestre, Id_Carrera, Tipo FROM materias"
        cursor.execute(query)
        materias = cursor.fetchall()
        return jsonify(materias), 200
    except mysql.connector.Error as err:
        return jsonify({"success": False, "message": f"Error de base de datos: {err}"}), 500
    finally:
        if conexion and conexion.is_connected():
            conexion.close()

@materias_bp.route("/api/materias", methods=["POST"])
@requiere_rol(1, 3)
def crear_materia():
    datos = request.get_json(silent=True) or {}
    
    nombre = str(datos.get('Nombre', '')).strip()
    semestre = datos.get('Semestre')
    id_carrera = datos.get('Clave_Carrera') or datos.get('Id_Carrera')
    tipo_materia = datos.get('Tipo')
    
    if not nombre or not id_carrera:
        return jsonify({"success": False, "message": "El nombre y la carrera son obligatorios."}), 400

    conexion = None
    try:
        conexion = obtener_conexion()
        cursor = conexion.cursor()
        sql = "INSERT IGNORE INTO materias (Nombre, Semestre, Id_Carrera, Tipo) VALUES (%s, %s, %s, %s)"
        cursor.execute(sql, (nombre, semestre, id_carrera, tipo_materia))
        conexion.commit()
        return jsonify({"success": True, "message": "Materia registrada correctamente."}), 201
    except mysql.connector.Error as err:
        return jsonify({"success": False, "message": f"Error de base de datos: {err}"}), 500
    finally:
        if conexion and conexion.is_connected():
            conexion.close()

@materias_bp.route("/api/materias/<int:id_materia>", methods=["PUT"])
@requiere_rol(1, 3)
def editar_materia(id_materia):
    datos = request.get_json(silent=True) or {}
    
    nombre = str(datos.get('Nombre', '')).strip()
    semestre = datos.get('Semestre')
    id_carrera = datos.get('Clave_Carrera') or datos.get('Id_Carrera')
    tipo_materia = datos.get('Tipo')

    conexion = None
    try:
        conexion = obtener_conexion()
        cursor = conexion.cursor()
        sql = "UPDATE materias SET Nombre = %s, Semestre = %s, Id_Carrera = %s, Tipo = %s WHERE Id_Materia = %s"
        cursor.execute(sql, (nombre, semestre, id_carrera, tipo_materia, id_materia))
        conexion.commit()
        return jsonify({"success": True, "message": "Materia actualizada correctamente."}), 200
    except mysql.connector.Error as err:
        return jsonify({"success": False, "message": f"Error de base de datos: {err}"}), 500
    finally:
        if conexion and conexion.is_connected():
            conexion.close()

@materias_bp.route("/api/materias/<int:id_materia>", methods=["DELETE"])
@requiere_rol(1, 3)
def eliminar_materia(id_materia):
    conexion = None
    try:
        conexion = obtener_conexion()
        cursor = conexion.cursor()
        sql = "DELETE FROM materias WHERE Id_Materia = %s"
        cursor.execute(sql, (id_materia,))
        conexion.commit()
        return jsonify({"success": True, "message": "Materia eliminada correctamente."}), 200
    except mysql.connector.Error as err:
        return jsonify({"success": False, "message": f"Error de base de datos: {err}"}), 500
    finally:
        if conexion and conexion.is_connected():
            conexion.close()