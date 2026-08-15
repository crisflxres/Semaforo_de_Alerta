from flask import Blueprint, request, jsonify
import mysql.connector
import secrets
import bcrypt
from conexion_db import obtener_conexion
from auth_utils import requiere_rol

tutor_bp = Blueprint('tutor_bp', __name__)

ID_ROL_TUTOR = 3  # Rol 3: Tutor Académico / Padre de Familia


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
            SELECT 
                u.Id_Usuario, 
                u.Nombre, 
                u.Apellidos, 
                u.Telefono, 
                u.Email
            FROM padre_alumno pa
            JOIN usuarios u ON pa.Id_Usuario = u.Id_Usuario
            WHERE pa.Matricula = %s
        """, (matricula,))
        
        tutor = cursor.fetchone()

        if tutor:
            nombre_val = tutor.get('Nombre') or ''
            apellidos_val = tutor.get('Apellidos') or ''
            nombre_completo = f"{nombre_val} {apellidos_val}".strip()
            
            return jsonify({
                "success": True,
                "existe": True,
                "tutor": {
                    "Nombre": nombre_completo,
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
@requiere_rol(1, 3)
def actualizar_tutor(matricula):
    datos = request.get_json(silent=True) or {}
    
    nombre_completo = str(datos.get('nombre', '')).strip()
    telefono = str(datos.get('telefono', '')).strip()
    email = str(datos.get('email', '')).strip()

    if not nombre_completo or not telefono or not email:
        return jsonify({"success": False, "message": "Faltan datos obligatorios del tutor (nombre, teléfono y email)."}), 400

    partes = nombre_completo.split(' ', 1)
    nombre = partes[0]
    apellidos = partes[1] if len(partes) > 1 else ''

    conexion = None
    try:
        conexion = obtener_conexion()
        if not conexion:
            return jsonify({"success": False, "message": "No se pudo conectar a la base de datos"}), 500

        cursor = conexion.cursor(dictionary=True)

        # 1. Verificar si la matrícula ya tiene un tutor ligado
        cursor.execute(
            "SELECT Id_Usuario FROM padre_alumno WHERE Matricula = %s",
            (matricula,)
        )
        fila = cursor.fetchone()

        # 2. Verificar si el correo ya pertenece a algún usuario
        cursor.execute("SELECT Id_Usuario FROM usuarios WHERE Email = %s", (email,))
        usuario_con_ese_email = cursor.fetchone()

        if fila:
            id_usuario = fila['Id_Usuario']

            # Si el correo pertenece a OTRO usuario diferente al tutor actual
            if usuario_con_ese_email and usuario_con_ese_email['Id_Usuario'] != id_usuario:
                return jsonify({"success": False, "message": "Ese correo ya está registrado por otro usuario en el sistema."}), 409

            cursor.execute(
                "UPDATE usuarios SET Nombre = %s, Apellidos = %s, Telefono = %s, Email = %s WHERE Id_Usuario = %s",
                (nombre, apellidos, telefono, email, id_usuario)
            )

        else:
            if usuario_con_ese_email:
                # Reutilizar el usuario existente (ej. tutor de un hermano)
                id_usuario = usuario_con_ese_email['Id_Usuario']
                cursor.execute(
                    "UPDATE usuarios SET Nombre = %s, Apellidos = %s, Telefono = %s WHERE Id_Usuario = %s",
                    (nombre, apellidos, telefono, id_usuario)
                )
            else:
                # Generar contraseña temporal segura con bcrypt
                pass_temp_plain = secrets.token_hex(8)
                password_temporal = bcrypt.hashpw(
                    pass_temp_plain.encode('utf-8'), 
                    bcrypt.gensalt()
                ).decode('utf-8')

                cursor.execute(
                    """INSERT INTO usuarios (Id_Rol, Nombre, Apellidos, Email, Password, Activo, Telefono)
                       VALUES (%s, %s, %s, %s, %s, %s, %s)""",
                    (ID_ROL_TUTOR, nombre, apellidos, email, password_temporal, 1, telefono)
                )
                id_usuario = cursor.lastrowid

            # Crear la relación en la tabla intermedia
            cursor.execute(
                "INSERT INTO padre_alumno (Matricula, Id_Usuario) VALUES (%s, %s)",
                (matricula, id_usuario)
            )

        conexion.commit()
        return jsonify({"success": True, "message": "Datos del tutor guardados correctamente."}), 200

    except mysql.connector.Error as err:
        return jsonify({"success": False, "message": f"Error de base de datos: {str(err)}"}), 500
    finally:
        if conexion and conexion.is_connected():
            conexion.close()