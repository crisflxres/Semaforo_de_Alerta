from flask import Blueprint, jsonify
import mysql.connector
from auth_utils import requiere_rol

grupos_bp = Blueprint('grupos', __name__)

from conexion_db import obtener_conexion

@grupos_bp.route('/grupos', methods=['GET'])
@requiere_rol(1, 2, 3)
def get_grupos():
    try:
        conexion = obtener_conexion()
        cursor = conexion.cursor(dictionary=True)
        cursor.execute("""
            SELECT Id_Grupo, Nombre, Semestre, Turno
            FROM grupos
            ORDER BY Nombre
        """)
        grupos = cursor.fetchall()
        cursor.close()
        conexion.close()
        return jsonify({"success": True, "data": grupos})
    except mysql.connector.Error as err:
        return jsonify({"success": False, "message": str(err)}), 500