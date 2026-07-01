from flask import Blueprint, jsonify
import mysql.connector

calificaciones_bp = Blueprint('calificaciones', __name__)

from conexion_db import obtener_conexion

@calificaciones_bp.route('/calificaciones/<matricula>', methods=['GET'])
def get_calificaciones(matricula):
    try:
        conexion = obtener_conexion()
        cursor = conexion.cursor(dictionary=True)
        cursor.execute("""
            SELECT m.Nombre AS Materia, c.P1, c.P2, c.P3, c.PR, c.Aprobado
            FROM calificaciones c
            JOIN materias m ON c.Id_Materia = m.Id_Materia
            WHERE c.Matricula = %s
        """, (matricula,))
        calificaciones = cursor.fetchall()

        reprobadas = sum(1 for c in calificaciones if c['Aprobado'] == 0)
        promedios = [c['PR'] for c in calificaciones if c['PR'] is not None]
        pac = round(sum(promedios) / len(promedios), 2) if promedios else 0

        cursor.close()
        conexion.close()
        return jsonify({"success": True, "pac": pac, "reprobadas": reprobadas, "calificaciones": calificaciones})
    except mysql.connector.Error as err:
        return jsonify({"success": False, "message": str(err)}), 500