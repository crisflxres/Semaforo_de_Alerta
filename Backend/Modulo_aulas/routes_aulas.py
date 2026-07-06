from flask import Blueprint, jsonify
from conexion_db import obtener_conexion

aulas_bp = Blueprint('aulas_bp', __name__)


@aulas_bp.route('/api/aulas', methods=['GET'])
def get_aulas():
    """
    Ajusta el nombre de las columnas (Id_Aula, Nombre) si en tu tabla
    'aulas' se llaman distinto.
    """
    try:
        conexion = obtener_conexion()
        cursor = conexion.cursor(dictionary=True)
        cursor.execute("SELECT Id_Aula, Nombre FROM aulas ORDER BY Nombre")
        aulas = cursor.fetchall()
        cursor.close()
        conexion.close()
        return jsonify({"success": True, "data": aulas})
    except Exception as err:
        return jsonify({"success": False, "message": str(err)}), 500