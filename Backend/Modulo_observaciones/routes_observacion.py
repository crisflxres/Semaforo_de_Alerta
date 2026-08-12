from flask import Blueprint, request, jsonify
import mysql.connector
from conexion_db import obtener_conexion

observacion_bp = Blueprint('observacion', __name__)


@observacion_bp.route('/observaciones/<matricula>', methods=['GET'])
def get_observaciones(matricula):
    conexion = None
    try:
        conexion = obtener_conexion()
        if not conexion:
            return jsonify({"success": False, "message": "No se pudo conectar a la base de datos"}), 500

        cursor = conexion.cursor(dictionary=True)
        query = """
            SELECT o.Comentario, o.Fecha,
                   u.Nombre, u.Apellidos
            FROM observaciones o
            JOIN usuarios u ON u.Id_Usuario = o.Id_Usuario
            WHERE o.Matricula = %s
            ORDER BY o.Fecha DESC
        """
        cursor.execute(query, (matricula,))
        filas = cursor.fetchall()

        observaciones = []
        for fila in filas:
            fecha_str = fila["Fecha"].strftime("%Y-%m-%d %H:%M:%S") if fila["Fecha"] else None
            observaciones.append({
                "comentario": fila["Comentario"],
                "fecha": fecha_str,
                "autor": f"{fila['Nombre']} {fila['Apellidos']}".strip()
            })

        return jsonify({"success": True, "observaciones": observaciones}), 200

    except mysql.connector.Error as err:
        return jsonify({"success": False, "message": f"Error de base de datos: {err}"}), 500
    finally:
        if conexion and conexion.is_connected():
            conexion.close()


@observacion_bp.route('/observaciones', methods=['POST'])
def crear_observacion():
    datos = request.get_json(silent=True) or {}

    matricula = str(datos.get('matricula', '')).strip()
    id_usuario = datos.get('id_usuario')
    comentario = str(datos.get('comentario', '')).strip()

    if not matricula or not id_usuario or not comentario:
        return jsonify({"success": False, "message": "Faltan datos: matricula, id_usuario y comentario son obligatorios."}), 400

    conexion = None
    try:
        conexion = obtener_conexion()
        if not conexion:
            return jsonify({"success": False, "message": "No se pudo conectar a la base de datos"}), 500

        cursor = conexion.cursor()
        query = """
            INSERT INTO observaciones (Matricula, Id_Usuario, Comentario)
            VALUES (%s, %s, %s)
        """
        cursor.execute(query, (matricula, id_usuario, comentario))
        conexion.commit()

        return jsonify({"success": True, "message": "Observación guardada correctamente."}), 201

    except mysql.connector.Error as err:
        return jsonify({"success": False, "message": f"Error de base de datos: {err}"}), 500
    finally:
        if conexion and conexion.is_connected():
            conexion.close()