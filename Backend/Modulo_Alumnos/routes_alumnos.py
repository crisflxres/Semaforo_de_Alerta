from flask import Blueprint, request, jsonify
import mysql.connector
from conexion_db import obtener_conexion

alumnos_bp = Blueprint('alumnos_bp', __name__)

@alumnos_bp.route('/api/alumnos', methods=['GET'])
def get_alumnos():
    conexion = None
    try:
        conexion = obtener_conexion()
        if not conexion:
            return jsonify({"success": False, "message": "No se pudo conectar a la base de datos"}), 500
        
        cursor = conexion.cursor(dictionary=True)

        query = """
            SELECT
                a.Matricula,
                a.Nombre,
                a.Apellidos,
                g.Nombre AS Grupo,
                g.Turno,
                g.Semestre,
                c.Nombre AS Carrera,
                COALESCE(rep.materias_reprobadas, 0) AS materias_reprobadas,
                na.Nombre AS nivel_color,
                na.Descripcion AS estado_alerta
            FROM alumnos a
            JOIN grupos g ON a.Id_Grupo = g.Id_Grupo
            JOIN carreras c ON g.Id_Carrera = c.Id_Carrera
            LEFT JOIN (
                SELECT Matricula, COUNT(*) AS materias_reprobadas
                FROM calificaciones
                WHERE Aprobado = 0
                GROUP BY Matricula
            ) rep ON a.Matricula = rep.Matricula
            LEFT JOIN niveles_alerta na
                ON COALESCE(rep.materias_reprobadas, 0) >= na.Min_Reprobadas
                AND (na.Max_Reprobados IS NULL OR COALESCE(rep.materias_reprobadas, 0) <= na.Max_Reprobados)
            WHERE a.Activo = 1
            ORDER BY a.Apellidos, a.Nombre
        """
        cursor.execute(query)
        filas = cursor.fetchall()

        lista = []
        contadores = {"regulares": 0, "riesgo": 0, "criticos": 0}

        for fila in filas:
            color = fila.get('nivel_color') or 'Verde'
            
            if color == 'Rojo':
                estado = 'Critico'
                contadores["criticos"] += 1
            elif color == 'Amarillo':
                estado = 'Riesgo'
                contadores["riesgo"] += 1
            else:
                estado = 'Regular'
                contadores["regulares"] += 1

            lista.append({
                "matricula": fila.get('Matricula'),
                "nombre": fila.get('Nombre'),
                "apellidos": fila.get('Apellidos'),
                "grupo": fila.get('Grupo'),
                "turno": fila.get('Turno'),
                "semestre": fila.get('Semestre'),
                "carrera": fila.get('Carrera'),
                "pac": "",
                "estado_alerta": estado,
                "materias_reprobadas": fila.get('materias_reprobadas', 0)
            })

        cursor.close()
        return jsonify({
            "total": len(lista),
            "regulares": contadores["regulares"],
            "riesgo": contadores["riesgo"],
            "criticos": contadores["criticos"],
            "lista": lista
        })

    except mysql.connector.Error as err:
        print(f"Error de SQL: {err}")
        return jsonify({"success": False, "message": f"Error de base de datos: {str(err)}"}), 500
    finally:
        if conexion and conexion.is_connected():
            conexion.close()


@alumnos_bp.route('/api/dashboard-stats', methods=['GET'])
def get_dashboard_stats():
    try:
        conexion = obtener_conexion()
        cursor = conexion.cursor(dictionary=True)
        cursor.execute("""
            SELECT
                COUNT(*) as total,
                SUM(CASE WHEN COALESCE(rep.materias_reprobadas, 0) = 0 THEN 1 ELSE 0 END) as regulares,
                SUM(CASE WHEN na.Nombre = 'Amarillo' THEN 1 ELSE 0 END) as riesgo,
                SUM(CASE WHEN na.Nombre = 'Rojo' THEN 1 ELSE 0 END) as criticos
            FROM alumnos a
            LEFT JOIN (
                SELECT Matricula, COUNT(*) AS materias_reprobadas
                FROM calificaciones WHERE Aprobado = 0
                GROUP BY Matricula
            ) rep ON a.Matricula = rep.Matricula
            LEFT JOIN niveles_alerta na
                ON COALESCE(rep.materias_reprobadas, 0) >= na.Min_Reprobadas
                AND (na.Max_Reprobados IS NULL OR COALESCE(rep.materias_reprobadas, 0) <= na.Max_Reprobados)
            WHERE a.Activo = 1
        """)
        stats = cursor.fetchone()
        cursor.close()
        conexion.close()
        return jsonify({
            "success": True,
            "total": stats['total'],
            "regulares": stats['regulares'],
            "riesgo": stats['riesgo'],
            "criticos": stats['criticos']
        })
    except mysql.connector.Error as err:
        return jsonify({"success": False, "message": str(err)}), 500