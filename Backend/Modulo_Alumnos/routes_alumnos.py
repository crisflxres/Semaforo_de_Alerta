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
                a.Email,
                a.PAC,
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
                "email": fila.get('Email'),
                "grupo": fila.get('Grupo'),
                "turno": fila.get('Turno'),
                "semestre": fila.get('Semestre'),
                "carrera": fila.get('Carrera'),
                "pac": fila.get('PAC') if fila.get('PAC') is not None else '-',
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


#@alumnos_bp.route('/api/tutor/<matricula>', methods=['GET'])
def get_tutor(matricula):
    conexion = None
    try:
        conexion = obtener_conexion()
        if not conexion:
            return jsonify({"success": False, "message": "No se pudo conectar a la base de datos"}), 500

        cursor = conexion.cursor(dictionary=True)
        cursor.execute(
            "SELECT Nombre, Telefono, Email FROM padre_alumno WHERE Matricula = %s",
            (matricula,)
        )
        tutor = cursor.fetchone()
        cursor.close()

        if tutor:
            return jsonify({"success": True, "existe": True, "tutor": tutor})
        else:
            return jsonify({"success": True, "existe": False})

    except mysql.connector.Error as err:
        print(f"Error de SQL: {err}")
        return jsonify({"success": False, "message": f"Error de base de datos: {str(err)}"}), 500
    finally:
        if conexion and conexion.is_connected():
            conexion.close()


#@alumnos_bp.route('/api/tutor/<matricula>', methods=['PUT'])
def actualizar_tutor(matricula):
    conexion = None
    try:
        datos = request.get_json()
        nombre = datos.get('nombre')
        telefono = datos.get('telefono')
        email = datos.get('email')

        if not nombre or not telefono or not email:
            return jsonify({"success": False, "message": "Faltan datos del tutor"}), 400

        conexion = obtener_conexion()
        if not conexion:
            return jsonify({"success": False, "message": "No se pudo conectar a la base de datos"}), 500

        cursor = conexion.cursor(dictionary=True)

        # Verificamos si ya existe un registro para esta matricula
        cursor.execute("SELECT Matricula FROM padre_alumno WHERE Matricula = %s", (matricula,))
        existe = cursor.fetchone()

        if existe:
            cursor.execute(
                "UPDATE padre_alumno SET Nombre = %s, Telefono = %s, Email = %s WHERE Matricula = %s",
                (nombre, telefono, email, matricula)
            )
        else:
            cursor.execute(
                "INSERT INTO padre_alumno (Matricula, Nombre, Telefono, Email) VALUES (%s, %s, %s, %s)",
                (matricula, nombre, telefono, email)
            )

        conexion.commit()
        cursor.close()

        return jsonify({"success": True, "message": "Datos del tutor guardados correctamente"})

    except mysql.connector.Error as err:
        print(f"Error de SQL: {err}")
        return jsonify({"success": False, "message": f"Error de base de datos: {str(err)}"}), 500
    finally:
        if conexion and conexion.is_connected():
            conexion.close()

@alumnos_bp.route('/api/eliminar-alumnos-6to-semestre', methods=['DELETE'])
def delete_alumnos_6Semestre():
    conexion = None
    try:
        conexion = obtener_conexion()
        if not conexion:
            return jsonify({"success": False, "message": "No se pudo conectar a la base de datos"}), 500

        cursor = conexion.cursor(dictionary=True)

        # 1. Obtener matrículas Y sus Id_Usuario antes de borrar nada
        cursor.execute("""
            SELECT a.Matricula, a.Id_Usuario
            FROM alumnos a
            JOIN grupos g ON a.Id_Grupo = g.Id_Grupo
            WHERE g.Semestre = 'Sexto'
        """)
        filas = cursor.fetchall()
        matriculas = [fila['Matricula'] for fila in filas]
        ids_usuario = [fila['Id_Usuario'] for fila in filas]
        cursor.close()

        if not matriculas:
            return jsonify({"success": True, "message": "No hay alumnos de 6to semestre para eliminar.", "eliminados": 0})

        cursor2 = conexion.cursor()
        placeholders_mat = ','.join(['%s'] * len(matriculas))
        placeholders_usr = ','.join(['%s'] * len(ids_usuario))

        # 2. Limpiar todas las tablas relacionadas por Matricula
        cursor2.execute(f"DELETE FROM alertas WHERE Matricula IN ({placeholders_mat})", matriculas)
        cursor2.execute(f"DELETE FROM calificaciones WHERE Matricula IN ({placeholders_mat})", matriculas)
        cursor2.execute(f"DELETE FROM notificaciones WHERE Matricula IN ({placeholders_mat})", matriculas)
        cursor2.execute(f"DELETE FROM observaciones WHERE Matricula IN ({placeholders_mat})", matriculas)
        cursor2.execute(f"DELETE FROM padre_alumno WHERE Matricula IN ({placeholders_mat})", matriculas)

        # 3. Borrar de alumnos
        cursor2.execute(f"DELETE FROM alumnos WHERE Matricula IN ({placeholders_mat})", matriculas)
        eliminados = cursor2.rowcount

        # 4. Borrar sus cuentas de usuario (login) al final
        cursor2.execute(f"DELETE FROM usuarios WHERE Id_Usuario IN ({placeholders_usr})", ids_usuario)

        conexion.commit()
        cursor2.close()

        return jsonify({
            "success": True,
            "message": f"Se eliminaron {eliminados} alumno(s) de 6to semestre correctamente, incluyendo sus cuentas de usuario.",
            "eliminados": eliminados
        })

    except mysql.connector.Error as err:
        if conexion:
            conexion.rollback()
        print(f"Error de SQL: {err}")
        return jsonify({"success": False, "message": f"Error de base de datos: {str(err)}"}), 500
    finally:
        if conexion and conexion.is_connected():
            conexion.close()