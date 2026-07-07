from flask import Blueprint, jsonify
import mysql.connector

calificaciones_bp = Blueprint('calificaciones', __name__)

from conexion_db import obtener_conexion

# Traduce el nombre guardado en niveles_alerta (Verde/Amarillo/Rojo)
# a la etiqueta que se muestra al alumno.
ETIQUETAS_ESTADO = {
    "Verde": "Regular",
    "Amarillo": "En Riesgo",
    "Rojo": "Crítico"
}

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

        # Determina el nivel de alerta (Verde/Amarillo/Rojo) según las materias reprobadas
        cursor.execute("""
            SELECT Nombre, Color_Hex FROM niveles_alerta
            WHERE Min_Reprobadas <= %s
            AND (Max_Reprobados IS NULL OR Max_Reprobados >= %s)
            ORDER BY Min_Reprobadas DESC
            LIMIT 1
        """, (reprobadas, reprobadas))
        nivel = cursor.fetchone()
        estado = ETIQUETAS_ESTADO.get(nivel['Nombre'], '--') if nivel else '--'
        color_estado = nivel['Color_Hex'] if nivel else None

        cursor.close()
        conexion.close()
        return jsonify({
            "success": True,
            "pac": pac,
            "reprobadas": reprobadas,
            "estado": estado,
            "color_estado": color_estado,
            "calificaciones": calificaciones
        })
    except mysql.connector.Error as err:
        return jsonify({"success": False, "message": str(err)}), 500