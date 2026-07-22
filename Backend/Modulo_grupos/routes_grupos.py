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
            SELECT 
                g.Id_Grupo, 
                g.Nombre, 
                g.Semestre, 
                g.Turno,
                COUNT(a.Matricula) AS Alumnos
            FROM grupos g
            LEFT JOIN alumnos a ON a.Id_Grupo = g.Id_Grupo AND a.Activo = 1
            GROUP BY g.Id_Grupo, g.Nombre, g.Semestre, g.Turno
            ORDER BY g.Nombre
        """)
        grupos = cursor.fetchall()
        cursor.close()
        conexion.close()
        return jsonify({"success": True, "data": grupos})
    except mysql.connector.Error as err:
        return jsonify({"success": False, "message": str(err)}), 500