from flask import Blueprint, request, jsonify
import mysql.connector
import secrets
from werkzeug.security import generate_password_hash
from conexion_db import obtener_conexion

tutor_bp = Blueprint('tutor_bp', __name__)

ID_ROL_TUTOR = 3  # según tu tabla roles: 3 - Tutor - Tutor Académico


@tutor_bp.route('/api/tutor/<matricula>', methods=['GET'])
def get_tutor(matricula):
    conexion = None
    try:
        conexion = obtener_conexion()
        if not conexion:
            return jsonify({"success": False, "message": "No se pudo conectar a la base de datos"}), 500

        cursor = conexion.cursor(dictionary=True)
        # Especificamos explícitamente u.Nombre desde la tabla usuarios
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
        cursor.close()

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
            })
        else:
            return jsonify({"success": True, "existe": False})

    except mysql.connector.Error as err:
        print(f"Error de SQL en GET: {err}")
        return jsonify({"success": False, "message": f"Error de base de datos: {str(err)}"}), 500
    finally:
        if conexion and conexion.is_connected():
            conexion.close()

@tutor_bp.route('/api/tutor/<matricula>', methods=['PUT'])
def actualizar_tutor(matricula):
    print("--- ENTRANDO A ACTUALIZAR TUTOR ---")
    conexion = None
    try:
        datos = request.get_json()
        nombre_completo = (datos.get('nombre') or '').strip()
        telefono = (datos.get('telefono') or '').strip()
        email = (datos.get('email') or '').strip()

        if not nombre_completo or not telefono or not email:
            return jsonify({"success": False, "message": "Faltan datos del tutor"}), 400

        partes = nombre_completo.split(' ', 1)
        nombre = partes[0]
        apellidos = partes[1] if len(partes) > 1 else ''

        conexion = obtener_conexion()
        if not conexion:
            return jsonify({"success": False, "message": "No se pudo conectar a la base de datos"}), 500

        cursor = conexion.cursor(dictionary=True)

        # ¿Ya hay un tutor ligado a esta matrícula?
        cursor.execute(
            "SELECT Id_Usuario FROM padre_alumno WHERE Matricula = %s",
            (matricula,)
        )
        fila = cursor.fetchone()

        # ¿Ese correo ya lo usa alguien en el sistema?
        cursor.execute("SELECT Id_Usuario FROM usuarios WHERE Email = %s", (email,))
        usuario_con_ese_email = cursor.fetchone()

        if fila:
            id_usuario = fila['Id_Usuario']

            # Si el correo pertenece a OTRO usuario distinto al tutor actual -> error
            if usuario_con_ese_email and usuario_con_ese_email['Id_Usuario'] != id_usuario:
                cursor.close()
                return jsonify({"success": False, "message": "Ese correo ya está registrado con otro usuario"}), 409

            cursor.execute(
                "UPDATE usuarios SET Nombre = %s, Apellidos = %s, Telefono = %s, Email = %s WHERE Id_Usuario = %s",
                (nombre, apellidos, telefono, email, id_usuario)
            )

        else:
            if usuario_con_ese_email:
                # Ya existe un usuario con ese correo (ej. tutor de un hermano) -> lo reutilizamos
                id_usuario = usuario_con_ese_email['Id_Usuario']
                cursor.execute(
                    "UPDATE usuarios SET Nombre = %s, Apellidos = %s, Telefono = %s WHERE Id_Usuario = %s",
                    (nombre, apellidos, telefono, id_usuario)
                )
            else:
                password_temporal = generate_password_hash(secrets.token_hex(8))
                cursor.execute(
                    """INSERT INTO usuarios (Id_Rol, Nombre, Apellidos, Email, Password, Activo, Telefono)
                       VALUES (%s, %s, %s, %s, %s, %s, %s)""",
                    (ID_ROL_TUTOR, nombre, apellidos, email, password_temporal, 1, telefono)
                )
                id_usuario = cursor.lastrowid

            cursor.execute(
                "INSERT INTO padre_alumno (Matricula, Id_Usuario) VALUES (%s, %s)",
                (matricula, id_usuario)
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