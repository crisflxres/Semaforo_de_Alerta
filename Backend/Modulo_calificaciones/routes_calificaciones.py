from flask import Blueprint, jsonify
import mysql.connector
from auth_utils import requiere_rol
from conexion_db import obtener_conexion

calificaciones_bp = Blueprint('calificaciones', __name__)

# Traduce el nombre guardado en niveles_alerta (Verde/Amarillo/Rojo)
# a la etiqueta que se muestra al alumno.
ETIQUETAS_ESTADO = {
    "Verde": "Regular",
    "Amarillo": "En Riesgo",
    "Rojo": "Crítico"
}


# --- Ruta que usa seguimiento_alumno.js para pintar la tabla de calificaciones ---
# IMPORTANTE: esta ruta se elimino por error al "quitar redundancia" - el frontend
# la sigue llamando con la matricula (no con Id_Alumno), y espera Materia/P1/P2/P3/PR,
# asi que no es intercambiable con /api/alumnos/<id_alumno>/estatus-alerta de abajo.
@calificaciones_bp.route('/calificaciones/<matricula>', methods=['GET'])
def get_calificaciones(matricula):
    conexion = None
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

        # Determina el nivel de alerta (Verde/Amarillo/Rojo) segun las materias reprobadas
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
    finally:
        if conexion and conexion.is_connected():
            conexion.close()


@calificaciones_bp.route("/api/alumnos/<int:id_alumno>/estatus-alerta")
@requiere_rol(1, 2, 3, 5)
def obtener_estatus_alerta(id_alumno):
    conexion = None
    try:
        conexion = obtener_conexion()
        cursor = conexion.cursor(dictionary=True)

        # 1 sola consulta calcula conteos, porcentaje y nivel de alerta
        query = """
            SELECT 
                COUNT(*) AS total_materias,
                SUM(CASE WHEN Calificacion < 6.0 THEN 1 ELSE 0 END) AS reprobadas,
                ROUND((SUM(CASE WHEN Calificacion < 6.0 THEN 1 ELSE 0 END) / COUNT(*)) * 100, 2) AS pac,
                CASE 
                    WHEN SUM(CASE WHEN Calificacion < 6.0 THEN 1 ELSE 0 END) >= 3 THEN 'Rojo'
                    WHEN SUM(CASE WHEN Calificacion < 6.0 THEN 1 ELSE 0 END) BETWEEN 1 AND 2 THEN 'Amarillo'
                    ELSE 'Verde'
                END AS nivel_alerta
            FROM calificaciones
            WHERE Id_Alumno = %s
        """
        cursor.execute(query, (id_alumno,))
        resumen = cursor.fetchone()
        cursor.close()

        if not resumen or resumen["total_materias"] == 0:
            return jsonify({"message": "Sin calificaciones registradas"}), 404

        return jsonify(resumen)

    except mysql.connector.Error as err:
        return jsonify({"success": False, "message": str(err)}), 500
    finally:
        if conexion and conexion.is_connected():
            conexion.close()