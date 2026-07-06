from flask import Blueprint, request, jsonify
from conexion_db import obtener_conexion

horarios_bp = Blueprint('horarios_bp', __name__)


@horarios_bp.route('/api/horarios', methods=['GET'])
def get_horarios():
    """
    Devuelve todas las clases registradas, con los nombres ya resueltos
    (docente, grupo, materia, aula) para poder pintarlas directo en el grid.
    """
    try:
        conexion = obtener_conexion()
        cursor = conexion.cursor(dictionary=True)
        cursor.execute("""
            SELECT h.Id_Horario, h.Id_Usuario, h.Id_Grupo, h.Id_Materia,
                   h.Dia_Semana, h.Hora_Inicio, h.Hora_Fin, h.Id_Aula,
                   CONCAT(u.Nombre, ' ', u.Apellidos) AS Docente,
                   g.Nombre AS Grupo,
                   m.Nombre AS Materia,
                   a.Nombre AS Aula
            FROM horarios h
            LEFT JOIN usuarios u ON h.Id_Usuario = u.Id_Usuario
            LEFT JOIN grupos g   ON h.Id_Grupo   = g.Id_Grupo
            LEFT JOIN materias m ON h.Id_Materia = m.Id_Materia
            LEFT JOIN aulas a    ON h.Id_Aula    = a.Id_Aula
        """)
        horarios = cursor.fetchall()
        cursor.close()
        conexion.close()

        # MySQL devuelve las columnas TIME como timedelta -> las pasamos a texto "HH:MM:SS"
        for h in horarios:
            for campo in ('Hora_Inicio', 'Hora_Fin'):
                if h.get(campo) is not None:
                    h[campo] = str(h[campo])

        return jsonify({"success": True, "data": horarios})
    except Exception as err:
        return jsonify({"success": False, "message": str(err)}), 500


@horarios_bp.route('/api/horarios', methods=['POST'])
def crear_horario():
    datos = request.get_json()
    try:
        id_usuario  = datos.get('Id_Usuario')
        id_grupo    = datos.get('Id_Grupo')
        id_materia  = datos.get('Id_Materia')
        dia_semana  = datos.get('Dia_Semana')
        hora_inicio = datos.get('Hora_Inicio')
        hora_fin    = datos.get('Hora_Fin')
        id_aula     = datos.get('Id_Aula')

        if not all([id_usuario, id_grupo, id_materia, dia_semana, hora_inicio, hora_fin, id_aula]):
            return jsonify({"success": False, "message": "Faltan campos obligatorios."}), 400

        conexion = obtener_conexion()
        cursor = conexion.cursor()
        cursor.execute("""
            INSERT INTO horarios
                (Id_Usuario, Id_Grupo, Id_Materia, Dia_Semana, Hora_Inicio, Hora_Fin, Id_Aula)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (id_usuario, id_grupo, id_materia, dia_semana, hora_inicio, hora_fin, id_aula))
        conexion.commit()
        nuevo_id = cursor.lastrowid
        cursor.close()
        conexion.close()

        return jsonify({
            "success": True,
            "message": "Clase registrada correctamente.",
            "Id_Horario": nuevo_id
        })
    except Exception as err:
        return jsonify({"success": False, "message": str(err)}), 500


@horarios_bp.route('/api/horarios/<int:id_horario>', methods=['PUT'])
def editar_horario(id_horario):
    datos = request.get_json()
    try:
        conexion = obtener_conexion()
        cursor = conexion.cursor()
        cursor.execute("""
            UPDATE horarios
            SET Id_Usuario=%s, Id_Grupo=%s, Id_Materia=%s, Dia_Semana=%s,
                Hora_Inicio=%s, Hora_Fin=%s, Id_Aula=%s
            WHERE Id_Horario=%s
        """, (
            datos.get('Id_Usuario'), datos.get('Id_Grupo'), datos.get('Id_Materia'),
            datos.get('Dia_Semana'), datos.get('Hora_Inicio'), datos.get('Hora_Fin'),
            datos.get('Id_Aula'), id_horario
        ))
        conexion.commit()
        cursor.close()
        conexion.close()
        return jsonify({"success": True, "message": "Clase actualizada correctamente."})
    except Exception as err:
        return jsonify({"success": False, "message": str(err)}), 500


@horarios_bp.route('/api/horarios/resumen-materia/<int:id_materia>', methods=['GET'])
def resumen_materia(id_materia):
    """
    Nota general de una materia: qué docentes la imparten, en qué grupos
    y en qué aulas, según lo que ya está registrado en 'horarios'.
    Se usa para la tarjetita que aparece al hacer doble clic en una clase.
    """
    try:
        conexion = obtener_conexion()
        cursor = conexion.cursor(dictionary=True)

        cursor.execute("SELECT Nombre FROM materias WHERE Id_Materia = %s", (id_materia,))
        fila_materia = cursor.fetchone()
        nombre_materia = fila_materia['Nombre'] if fila_materia else ''

        cursor.execute("""
            SELECT DISTINCT CONCAT(u.Nombre, ' ', u.Apellidos) AS nombre
            FROM horarios h
            JOIN usuarios u ON h.Id_Usuario = u.Id_Usuario
            WHERE h.Id_Materia = %s
            ORDER BY nombre
        """, (id_materia,))
        docentes = [f['nombre'] for f in cursor.fetchall()]

        cursor.execute("""
            SELECT DISTINCT g.Nombre AS nombre
            FROM horarios h
            JOIN grupos g ON h.Id_Grupo = g.Id_Grupo
            WHERE h.Id_Materia = %s
            ORDER BY nombre
        """, (id_materia,))
        grupos = [f['nombre'] for f in cursor.fetchall()]

        cursor.execute("""
            SELECT DISTINCT a.Nombre AS nombre
            FROM horarios h
            JOIN aulas a ON h.Id_Aula = a.Id_Aula
            WHERE h.Id_Materia = %s
            ORDER BY nombre
        """, (id_materia,))
        aulas = [f['nombre'] for f in cursor.fetchall()]

        cursor.close()
        conexion.close()

        return jsonify({
            "success": True,
            "data": {
                "materia": nombre_materia,
                "docentes": docentes,
                "grupos": grupos,
                "aulas": aulas
            }
        })
    except Exception as err:
        return jsonify({"success": False, "message": str(err)}), 500


@horarios_bp.route('/api/horarios/<int:id_horario>', methods=['DELETE'])
def eliminar_horario(id_horario):
    try:
        conexion = obtener_conexion()
        cursor = conexion.cursor()
        cursor.execute("DELETE FROM horarios WHERE Id_Horario=%s", (id_horario,))
        conexion.commit()
        cursor.close()
        conexion.close()
        return jsonify({"success": True, "message": "Clase eliminada correctamente."})
    except Exception as err:
        return jsonify({"success": False, "message": str(err)}), 500