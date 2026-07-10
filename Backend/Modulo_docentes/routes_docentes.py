from flask import Blueprint, request, jsonify
import bcrypt
from conexion_db import obtener_conexion
from auth_utils import requiere_rol 

rutas_docentes = Blueprint('rutas_docentes', __name__)

@rutas_docentes.route('/docentes', methods=['GET'])
@requiere_rol(1, 2, 4)
def get_docentes():
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
        conexion.close()
        return jsonify({"success": True, "data": docentes})
    except Exception as err:
        return jsonify({"success": False, "message": str(err)}), 500


@rutas_docentes.route('/docentes', methods=['POST'])
@requiere_rol(1, 4)
def crear_docente():
    datos = request.get_json()
    try:
        password_temp = f"{datos['nombre']}{datos['apellidos'].split()[0]}".replace(' ', '')
        password_hash = bcrypt.hashpw(password_temp.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        id_rol = datos.get('id_rol', 2)
        conexion = obtener_conexion()
        cursor = conexion.cursor()
        cursor.execute("""
            INSERT INTO usuarios (Id_Rol, Nombre, Apellidos, Email, Password, Telefono)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (id_rol, datos['nombre'], datos['apellidos'], datos['email'], password_hash, datos.get('telefono', None)))
        conexion.commit()
        cursor.close()
        conexion.close()
        return jsonify({"success": True, "message": "Docente registrado correctamente."})
    except Exception as err:
        return jsonify({"success": False, "message": str(err)}), 500


@rutas_docentes.route('/docentes/<int:id_usuario>', methods=['PUT'])
@requiere_rol(1, 4)
def editar_docente(id_usuario):
    datos = request.get_json()
    try:
        conexion = obtener_conexion()
        cursor = conexion.cursor()
        cursor.execute("""
            UPDATE usuarios SET Nombre=%s, Apellidos=%s, Email=%s, Telefono=%s, Id_Rol=%s
            WHERE Id_Usuario=%s
        """, (datos['nombre'], datos['apellidos'], datos['email'], datos.get('telefono', None), datos['id_rol'], id_usuario))
        conexion.commit()
        cursor.close()
        conexion.close()
        return jsonify({"success": True, "message": "Docente actualizado correctamente."})
    except Exception as err:
        return jsonify({"success": False, "message": str(err)}), 500


@rutas_docentes.route('/docentes/<int:id_usuario>', methods=['DELETE'])
@requiere_rol(1, 4)
def eliminar_docente(id_usuario):
    try:
        conexion = obtener_conexion()
        cursor = conexion.cursor()
        cursor.execute("UPDATE usuarios SET Activo=0 WHERE Id_Usuario=%s", (id_usuario,))
        conexion.commit()
        cursor.close()
        conexion.close()
        return jsonify({"success": True, "message": "Docente eliminado correctamente."})
    except Exception as err:
        return jsonify({"success": False, "message": str(err)}), 500