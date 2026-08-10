from flask import Blueprint, request, jsonify
import bcrypt
from conexion_db import obtener_conexion
from auth_utils import requiere_rol 

rutas_docentes = Blueprint('rutas_docentes', __name__)

@rutas_docentes.route('/docentes', methods=['GET'])
@requiere_rol(1, 2, 4)
def get_docentes():
    conexion = None
    try:
        conexion = obtener_conexion()
        cursor = conexion.cursor(dictionary=True)
        cursor.execute("""
            SELECT Id_Usuario, Nombre, Apellidos, Email, Telefono, Id_Rol
            FROM usuarios
            WHERE Id_Rol IN (2, 3) AND Activo = 1
        """)
        docentes = cursor.fetchall()
        cursor.close()
        return jsonify({"success": True, "data": docentes})
    except Exception as err:
        return jsonify({"success": False, "message": str(err)}), 500
    finally:
        if conexion and conexion.is_connected():
            conexion.close()


@rutas_docentes.route('/docentes/<int:id_usuario>/resumen', methods=['GET'])
@requiere_rol(1, 2, 4)
def get_resumen_docente(id_usuario):
    conexion = None
    try:
        conexion = obtener_conexion()
        cursor = conexion.cursor(dictionary=True)
        cursor.execute("""
            SELECT 
                COUNT(DISTINCT Id_Materia) AS total_materias,
                COUNT(DISTINCT Id_Grupo) AS total_grupos
            FROM horarios
            WHERE Id_Usuario = %s
        """, (id_usuario,))
        resumen = cursor.fetchone()
        cursor.close()
        return jsonify({"success": True, "data": resumen})
    except Exception as err:
        return jsonify({"success": False, "message": str(err)}), 500
    finally:
        if conexion and conexion.is_connected():
            conexion.close()


@rutas_docentes.route('/docentes', methods=['POST'])
@requiere_rol(1, 4)
def crear_docente():
    datos = request.get_json() or {}
    conexion = None
    try:
        nombre = datos.get('nombre', '')
        apellidos = datos.get('apellidos', '')
        email = datos.get('email', '')

        if not nombre or not apellidos or not email:
            return jsonify({"success": False, "message": "Faltan campos obligatorios."}), 400

        primer_apellido = apellidos.split()[0] if apellidos.split() else ''
        password_temp = f"{nombre}{primer_apellido}".replace(' ', '')
        password_hash = bcrypt.hashpw(password_temp.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        id_rol = datos.get('id_rol', 2)

        conexion = obtener_conexion()
        cursor = conexion.cursor()
        cursor.execute("""
            INSERT INTO usuarios (Id_Rol, Nombre, Apellidos, Email, Password, Telefono)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (id_rol, nombre, apellidos, email, password_hash, datos.get('telefono', None)))
        conexion.commit()
        cursor.close()
        return jsonify({"success": True, "message": "Docente registrado correctamente."})
    except Exception as err:
        if conexion and conexion.is_connected():
            conexion.rollback()
        return jsonify({"success": False, "message": str(err)}), 500
    finally:
        if conexion and conexion.is_connected():
            conexion.close()


@rutas_docentes.route('/docentes/<int:id_usuario>', methods=['PUT'])
@requiere_rol(1, 4)
def editar_docente(id_usuario):
    datos = request.get_json() or {}
    conexion = None
    try:
        conexion = obtener_conexion()
        cursor = conexion.cursor()
        cursor.execute("""
            UPDATE usuarios SET Nombre=%s, Apellidos=%s, Email=%s, Telefono=%s, Id_Rol=%s
            WHERE Id_Usuario=%s
        """, (datos.get('nombre'), datos.get('apellidos'), datos.get('email'), datos.get('telefono', None), datos.get('id_rol'), id_usuario))
        conexion.commit()
        cursor.close()
        return jsonify({"success": True, "message": "Docente actualizado correctamente."})
    except Exception as err:
        if conexion and conexion.is_connected():
            conexion.rollback()
        return jsonify({"success": False, "message": str(err)}), 500
    finally:
        if conexion and conexion.is_connected():
            conexion.close()


@rutas_docentes.route('/docentes/<int:id_usuario>', methods=['DELETE'])
@requiere_rol(1, 4)
def eliminar_docente(id_usuario):
    conexion = None
    try:
        conexion = obtener_conexion()
        cursor = conexion.cursor()
        cursor.execute("UPDATE usuarios SET Activo=0 WHERE Id_Usuario=%s", (id_usuario,))
        conexion.commit()
        cursor.close()
        return jsonify({"success": True, "message": "Docente eliminado correctamente."})
    except Exception as err:
        if conexion and conexion.is_connected():
            conexion.rollback()
        return jsonify({"success": False, "message": str(err)}), 500
    finally:
        if conexion and conexion.is_connected():
            conexion.close()