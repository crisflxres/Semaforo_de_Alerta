from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
import secrets
import bcrypt
import mysql.connector

from conexion_db import obtener_conexion
from Modulo_recuperacion.utils_correo import enviar_correo_recuperacion

recuperacion_bp = Blueprint('recuperacion_bp', __name__)

MINUTOS_EXPIRACION = 30

@recuperacion_bp.route('/api/recuperar-password', methods=['POST'])
def solicitar_recuperacion():
    datos = request.get_json(silent=True) or {}
    email = str(datos.get('email', '')).strip()

    if not email:
        return jsonify({"success": False, "message": "Ingresa tu correo electrónico."}), 400

    conexion = None
    try:
        conexion = obtener_conexion()
        cursor = conexion.cursor(dictionary=True)

        cursor.execute(
            "SELECT Id_Usuario, reset_expiracion FROM usuarios WHERE Email = %s AND Activo = 1",
            (email,)
        )
        usuario = cursor.fetchone()

        # Respuesta genérica para evitar enumeración de usuarios
        if not usuario:
            return jsonify({
                "success": True,
                "message": "Si el correo existe en nuestro sistema, recibirás un enlace para restablecer tu contraseña."
            }), 200

        # Prevenir reenvíos spam si hay token vigente
        if usuario['reset_expiracion'] and datetime.now() < usuario['reset_expiracion']:
            return jsonify({
                "success": True,
                "message": "Ya se envió un enlace de recuperación. Revisa tu correo (incluyendo spam) antes de solicitar otro."
            }), 200

        token = secrets.token_urlsafe(32)
        expiracion = datetime.now() + timedelta(minutes=MINUTOS_EXPIRACION)

        cursor.execute(
            """
            UPDATE usuarios
            SET reset_token = %s, reset_expiracion = %s
            WHERE Id_Usuario = %s
            """,
            (token, expiracion, usuario['Id_Usuario'])
        )
        conexion.commit()

        # Envío de correo
        enviar_correo_recuperacion(email, token)

        return jsonify({
            "success": True,
            "message": "Si el correo existe en nuestro sistema, recibirás un enlace para restablecer tu contraseña."
        }), 200

    except mysql.connector.Error as err:
        return jsonify({"success": False, "message": f"Error de base de datos: {err}"}), 500
    finally:
        if conexion and conexion.is_connected():
            conexion.close()

@recuperacion_bp.route('/api/nueva-password', methods=['POST'])
def actualizar_password():
    datos = request.get_json(silent=True) or {}

    token = str(datos.get('token', '')).strip()
    nueva_password = str(datos.get('password', '')).strip()

    if not token or not nueva_password:
        return jsonify({"success": False, "message": "Faltan datos para actualizar la contraseña."}), 400

    if len(nueva_password) < 8:
        return jsonify({"success": False, "message": "La contraseña debe tener al menos 8 caracteres."}), 400

    conexion = None
    try:
        conexion = obtener_conexion()
        cursor = conexion.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT Id_Usuario, reset_expiracion
            FROM usuarios
            WHERE reset_token = %s
            LIMIT 1
            """,
            (token,)
        )
        usuario = cursor.fetchone()

        if not usuario:
            return jsonify({"success": False, "message": "El enlace no es válido."}), 404

        if usuario['reset_expiracion'] is None or datetime.now() > usuario['reset_expiracion']:
            return jsonify({"success": False, "message": "El enlace ha expirado. Solicita uno nuevo."}), 400

        password_encriptada = bcrypt.hashpw(
            nueva_password.encode('utf-8'),
            bcrypt.gensalt()
        ).decode('utf-8')

        cursor.execute(
            """
            UPDATE usuarios
            SET Password = %s, reset_token = NULL, reset_expiracion = NULL
            WHERE Id_Usuario = %s
            """,
            (password_encriptada, usuario['Id_Usuario'])
        )

        conexion.commit()

        return jsonify({"success": True, "message": "Tu contraseña se actualizó correctamente."}), 200

    except mysql.connector.Error as err:
        return jsonify({"success": False, "message": f"Error de base de datos: {err}"}), 500
    finally:
        if conexion and conexion.is_connected():
            conexion.close()