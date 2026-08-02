from flask import Blueprint, request, jsonify
import mysql.connector
from conexion_db import obtener_conexion

tutor_bp = Blueprint('tutor_bp', __name__)


@tutor_bp.route('/api/tutor/<matricula>', methods=['GET'])
def get_tutor(matricula):
    conexion = None
    try:
        conexion = obtener_conexion()
        if not conexion:
            return jsonify({"success": False, "message": "No se pudo conectar a la base de datos"}), 500

        cursor = conexion.cursor(dictionary=True)
        cursor.execute(
            "SELECT Nombre, Telefono, Email FROM padre_alumno WHERE Matricula = %s",
            (matricula,)
        )
        tutor = cursor.fetchone()
        cursor.close()

        if tutor:
            return jsonify({"success": True, "existe": True, "tutor": tutor})
        else:
            return jsonify({"success": True, "existe": False})

    except mysql.connector.Error as err:
        print(f"Error de SQL: {err}")
        return jsonify({"success": False, "message": f"Error de base de datos: {str(err)}"}), 500
    finally:
        if conexion and conexion.is_connected():
            conexion.close()


@tutor_bp.route('/api/tutor/<matricula>', methods=['PUT'])
def actualizar_tutor(matricula):
    conexion = None
    try:
        datos = request.get_json()
        nombre = datos.get('nombre')
        telefono = datos.get('telefono')
        email = datos.get('email')

        if not nombre or not telefono or not email:
            return jsonify({"success": False, "message": "Faltan datos del tutor"}), 400

        conexion = obtener_conexion()
        if not conexion:
            return jsonify({"success": False, "message": "No se pudo conectar a la base de datos"}), 500

        cursor = conexion.cursor(dictionary=True)

        # Verificamos si ya existe un registro para esta matricula
        cursor.execute("SELECT Matricula FROM padre_alumno WHERE Matricula = %s", (matricula,))
        existe = cursor.fetchone()

        if existe:
            cursor.execute(
                "UPDATE padre_alumno SET Nombre = %s, Telefono = %s, Email = %s WHERE Matricula = %s",
                (nombre, telefono, email, matricula)
            )
        else:
            cursor.execute(
                "INSERT INTO padre_alumno (Matricula, Nombre, Telefono, Email) VALUES (%s, %s, %s, %s)",
                (matricula, nombre, telefono, email)
            )

        conexion.commit()
        cursor.close()

        return jsonify({"success": True, "message": "Datos del tutor guardados correctamente"})

    except mysql.connector.Error as err:
        print(f"Error de SQL: {err}")
        return jsonify({"success": False, "message": f"Error de base de datos: {str(err)}"}), 500
    finally:
        if conexion and conexion.is_connected():
            conexion.close()