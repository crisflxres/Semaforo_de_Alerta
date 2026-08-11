from flask import Blueprint, jsonify
import mysql.connector
from auth_utils import requiere_rol
from conexion_db import obtener_conexion

calificaciones_bp = Blueprint('calificaciones', __name__)

# Traduce el nombre guardado en niveles_alerta (Verde/Amarillo/Rojo)
# a la etiqueta que se muestra al alumno.
ETIQUETAS_ESTADO = {
    "Verde": "Regular",
    "Amarillo": "Riesgo",
    "Rojo": "Critico"
}

@calificaciones_bp.route("/api/alumnos/<int:id_alumno>/estatus-alerta")
@requiere_rol(1, 2, 3)
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