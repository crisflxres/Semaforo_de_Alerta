from flask import Blueprint, request, jsonify
import mysql.connector
from conexion_db import obtener_conexion
from auth_utils import requiere_rol

tutor_bp = Blueprint('tutor_bp', __name__)


@tutor_bp.route('/api/tutor/<matricula>', methods=['GET'])
@requiere_rol(1, 2, 3, 5)
def get_tutor(matricula):
    conexion = None
    try:
        conexion = obtener_conexion()
        if not conexion:
            return jsonify({"success": False, "message": "No se pudo conectar a la base de datos"}), 500

        cursor = conexion.cursor(dictionary=True)
        cursor.execute("""
            SELECT Nombre, Telefono, Email
            FROM padre_alumno
            WHERE Matricula = %s
        """, (matricula,))

        tutor = cursor.fetchone()

        if tutor:
            return jsonify({
                "success": True,
                "existe": True,
                "tutor": {
                    "Nombre": tutor.get('Nombre') or '',
                    "Telefono": tutor.get('Telefono') or '',
                    "Email": tutor.get('Email') or ''
                }
            }), 200
        else:
            return jsonify({"success": True, "existe": False}), 200

    except mysql.connector.Error as err:
        return jsonify({"success": False, "message": f"Error de base de datos: {str(err)}"}), 500
    finally:
        if conexion and conexion.is_connected():
            conexion.close()


@tutor_bp.route('/api/tutor/<matricula>', methods=['PUT'])
@requiere_rol(1, 3, 4)
def actualizar_tutor(matricula):
    datos = request.get_json(silent=True) or {}

    nombre_completo = str(datos.get('nombre', '')).strip()
    telefono = str(datos.get('telefono', '')).strip()
    email = str(datos.get('email', '')).strip()

    if not nombre_completo or not telefono or not email:
        return jsonify({"success": False, "message": "Faltan datos obligatorios del tutor (nombre, teléfono y email)."}), 400

    conexion = None
    try:
        conexion = obtener_conexion()
        if not conexion:
            return jsonify({"success": False, "message": "No se pudo conectar a la base de datos"}), 500

        cursor = conexion.cursor(dictionary=True)

        # Datos planos ligados directo a la matrícula del alumno -- el
        # tutor NO tiene cuenta ni login, solo sirve como destinatario
        # de alertas. No pasa por la tabla `usuarios` en ningún momento.
        cursor.execute(
            "SELECT Id_Padre_Alumno FROM padre_alumno WHERE Matricula = %s",
            (matricula,)
        )
        fila = cursor.fetchone()

        if fila:
            cursor.execute(
                "UPDATE padre_alumno SET Nombre = %s, Telefono = %s, Email = %s WHERE Matricula = %s",
                (nombre_completo, telefono, email, matricula)
            )
        else:
            cursor.execute(
                "INSERT INTO padre_alumno (Matricula, Nombre, Telefono, Email) VALUES (%s, %s, %s, %s)",
                (matricula, nombre_completo, telefono, email)
            )

        conexion.commit()
        return jsonify({"success": True, "message": "Datos del tutor guardados correctamente."}), 200

    except mysql.connector.Error as err:
        if conexion and conexion.is_connected():
            conexion.rollback()
        return jsonify({"success": False, "message": f"Error de base de datos: {str(err)}"}), 500
    finally:
        if conexion and conexion.is_connected():
            conexion.close()