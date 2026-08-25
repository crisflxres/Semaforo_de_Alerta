from flask import Blueprint, jsonify, request
from auth_utils import requiere_rol
from conexion_db import obtener_conexion

grupos_bp = Blueprint('grupos', __name__)


@grupos_bp.route('/grupos', methods=['GET'])
@requiere_rol(1, 2, 3, 5)
def get_grupos():
    conexion = None
    try:
        conexion = obtener_conexion()
        cursor = conexion.cursor(dictionary=True)
        cursor.execute("""
            SELECT 
                g.Id_Grupo, 
                g.Nombre, 
                g.Semestre, 
                g.Turno,
                g.Id_Carrera,
                COUNT(a.Matricula) AS Alumnos
            FROM grupos g
            LEFT JOIN alumnos a ON a.Id_Grupo = g.Id_Grupo AND a.Activo = 1
            GROUP BY g.Id_Grupo, g.Nombre, g.Semestre, g.Turno, g.Id_Carrera
            ORDER BY g.Nombre
        """)
        grupos = cursor.fetchall()
        cursor.close()
        return jsonify({"success": True, "data": grupos})
    except Exception as err:
        return jsonify({"success": False, "message": str(err)}), 500
    finally:
        if conexion and conexion.is_connected():
            conexion.close()


@grupos_bp.route('/grupos', methods=['POST'])
@requiere_rol(1, 2, 3, 5)
def crear_grupo():
    datos = request.get_json()

    nombre = (datos.get('Nombre') or '').strip()
    turno = (datos.get('Turno') or '').strip()
    semestre = datos.get('Semestre')
    id_carrera = datos.get('Id_Carrera')

    if not nombre or not turno:
        return jsonify({
            "success": False,
            "message": "Nombre y Turno son obligatorios."
        }), 400

    if semestre is None or semestre == '':
        return jsonify({
            "success": False,
            "message": "El semestre es obligatorio."
        }), 400

    if not id_carrera:
        return jsonify({
            "success": False,
            "message": "La carrera es obligatoria."
        }), 400

    conexion = None
    try:
        conexion = obtener_conexion()
        cursor = conexion.cursor()

        query = """
            INSERT INTO grupos (Nombre, Semestre, Turno, Id_Carrera)
            VALUES (%s, %s, %s, %s)
        """
        cursor.execute(query, (nombre, semestre, turno, id_carrera))
        conexion.commit()

        id_grupo_nuevo = cursor.lastrowid
        cursor.close()

        return jsonify({
            "success": True,
            "message": "Grupo creado correctamente.",
            "id_grupo": id_grupo_nuevo
        })

    except Exception as err:
        return jsonify({"success": False, "message": str(err)}), 500
    finally:
        if conexion and conexion.is_connected():
            conexion.close()


@grupos_bp.route('/grupos/<int:id_grupo>', methods=['PUT'])
@requiere_rol(1, 2, 3, 5)
def editar_grupo(id_grupo):
    datos = request.get_json()

    nombre = (datos.get('Nombre') or '').strip()
    turno = (datos.get('Turno') or '').strip()
    semestre = datos.get('Semestre')
    id_carrera = datos.get('Id_Carrera')

    if not nombre or not turno:
        return jsonify({
            "success": False,
            "message": "Nombre y Turno son obligatorios."
        }), 400

    conexion = None
    try:
        conexion = obtener_conexion()
        cursor = conexion.cursor()

        query = """
            UPDATE grupos
            SET Nombre = %s, Turno = %s, Semestre = %s, Id_Carrera = %s
            WHERE Id_Grupo = %s
        """
        cursor.execute(query, (nombre, turno, semestre, id_carrera, id_grupo))
        conexion.commit()
        cursor.close()

        return jsonify({"success": True, "message": "Grupo actualizado correctamente."})

    except Exception as err:
        return jsonify({"success": False, "message": str(err)}), 500
    finally:
        if conexion and conexion.is_connected():
            conexion.close()


@grupos_bp.route('/grupos/<int:id_grupo>', methods=['DELETE'])
@requiere_rol(1, 2, 3, 5)
def eliminar_grupo(id_grupo):
    conexion = None
    try:
        conexion = obtener_conexion()
        cursor = conexion.cursor()

        cursor.execute("DELETE FROM grupos WHERE Id_Grupo = %s", (id_grupo,))
        conexion.commit()
        cursor.close()

        return jsonify({"success": True, "message": "Grupo eliminado correctamente."})

    except Exception as err:
        return jsonify({"success": False, "message": str(err)}), 500
    finally:
        if conexion and conexion.is_connected():
            conexion.close()