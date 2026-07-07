from flask import Blueprint, jsonify, request
from conexion_db import obtener_conexion

aulas_bp = Blueprint('aulas_bp', __name__)

@aulas_bp.route('/api/aulas', methods=['GET'])
def get_aulas():

    try:
        conexion = obtener_conexion()
        cursor = conexion.cursor(dictionary=True)

        cursor.execute("SELECT Id_Aula, Nombre FROM aulas ORDER BY Nombre")

        aulas = cursor.fetchall()

        cursor.close()
        conexion.close()

        return jsonify({
            "success": True,
            "data": aulas
        })

    except Exception as err:
        return jsonify({
            "success": False,
            "message": str(err)
        }), 500


@aulas_bp.route('/api/aulas/siguiente-id', methods=['GET'])
def siguiente_id_aula():

    try:
        conexion = obtener_conexion()
        cursor = conexion.cursor()

        cursor.execute("SELECT COALESCE(MAX(Id_Aula), 0) + 1 AS siguiente FROM aulas")
        siguiente = cursor.fetchone()[0]

        cursor.close()
        conexion.close()

        return jsonify({
            "success": True,
            "siguiente_id": siguiente
        })

    except Exception as err:
        return jsonify({
            "success": False,
            "message": str(err)
        }), 500


@aulas_bp.route('/api/aulas', methods=['POST'])
def agregar_aula():

    try:

        datos = request.get_json()
        nombre = datos.get("nombre", "").strip()

        if not nombre:
            return jsonify({
                "success": False,
                "message": "El nombre del aula es obligatorio."
            }), 400

        conexion = obtener_conexion()
        cursor = conexion.cursor()

        # El backend calcula el ID real, no confiamos en lo que mande el cliente
        cursor.execute("SELECT COALESCE(MAX(Id_Aula), 0) + 1 AS siguiente FROM aulas")
        siguiente_id = cursor.fetchone()[0]

        cursor.execute("""
            INSERT INTO aulas (Id_Aula, Nombre)
            VALUES (%s, %s)
        """, (siguiente_id, nombre))

        conexion.commit()

        cursor.close()
        conexion.close()

        return jsonify({
            "success": True,
            "message": "Aula registrada correctamente.",
            "id": siguiente_id
        })

    except Exception as err:
        return jsonify({
            "success": False,
            "message": str(err)
        }), 500


@aulas_bp.route('/api/aulas/<int:id_aula>', methods=['PUT'])
def editar_aula(id_aula):

    try:
        datos = request.get_json()

        nombre = datos.get("nombre", "").strip()

        if not nombre:
            return jsonify({
                "success": False,
                "message": "El nombre es obligatorio."
            }), 400

        conexion = obtener_conexion()
        cursor = conexion.cursor()

        cursor.execute("""
            UPDATE aulas
            SET Nombre = %s
            WHERE Id_Aula = %s
        """, (nombre, id_aula))

        conexion.commit()

        cursor.close()
        conexion.close()

        return jsonify({
            "success": True,
            "message": "Aula actualizada correctamente."
        })

    except Exception as err:
        return jsonify({
            "success": False,
            "message": str(err)
        }), 500


@aulas_bp.route('/api/aulas/<int:id_aula>', methods=['DELETE'])
def eliminar_aula(id_aula):

    try:

        conexion = obtener_conexion()
        cursor = conexion.cursor()

        cursor.execute("""
            DELETE FROM aulas
            WHERE Id_Aula = %s
        """, (id_aula,))

        conexion.commit()

        cursor.close()
        conexion.close()

        return jsonify({
            "success": True,
            "message": "Aula eliminada correctamente."
        })

    except Exception as err:
        return jsonify({
            "success": False,
            "message": str(err)
        }), 500