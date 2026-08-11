from flask import Blueprint, request, jsonify
from conexion_db import obtener_conexion
from auth_utils import requiere_rol

horarios_bp = Blueprint('horarios_bp', __name__)


def verificar_conflictos(cursor, id_grupo, id_usuario, id_aula, dia_semana,
                         hora_inicio, hora_fin, id_horario_excluir=None):
    query = """
        SELECT h.Id_Horario, h.Id_Aula, h.Id_Usuario, h.Id_Grupo,
               a.Nombre AS Aula,
               CONCAT(u.Nombre, ' ', u.Apellidos) AS Docente,
               g.Nombre AS Grupo
        FROM horarios h
        LEFT JOIN aulas a    ON h.Id_Aula    = a.Id_Aula
        LEFT JOIN usuarios u ON h.Id_Usuario = u.Id_Usuario
        LEFT JOIN grupos g   ON h.Id_Grupo   = g.Id_Grupo
        WHERE h.Dia_Semana = %s
          AND h.Hora_Inicio < %s
          AND h.Hora_Fin > %s
          AND (h.Id_Aula = %s OR h.Id_Usuario = %s OR h.Id_Grupo = %s)
    """
    valores = [dia_semana, hora_fin, hora_inicio, id_aula, id_usuario, id_grupo]

    if id_horario_excluir is not None:
        query += " AND h.Id_Horario != %s"
        valores.append(id_horario_excluir)

    cursor.execute(query, tuple(valores))
    choques = cursor.fetchall()

    if not choques:
        return None

    motivos = []
    for c in choques:
        if c['Id_Aula'] == id_aula:
            motivos.append(f"el aula '{c['Aula']}' ya está ocupada por otra clase")
        if str(c['Id_Usuario']) == str(id_usuario):
            motivos.append(f"el docente '{c['Docente']}' ya tiene otra clase")
        if str(c['Id_Grupo']) == str(id_grupo):
            motivos.append(f"el grupo '{c['Grupo']}' ya tiene otra clase")

    motivos = list(dict.fromkeys(motivos))
    return "Conflicto de horario: " + "; ".join(motivos) + " en ese día y hora."


@horarios_bp.route('/api/horarios', methods=['GET'])
@requiere_rol(1, 2, 3)
def get_horarios():
    conexion = None
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

        for h in horarios:
            for campo in ('Hora_Inicio', 'Hora_Fin'):
                if h.get(campo) is not None:
                    h[campo] = str(h[campo])

        return jsonify({"success": True, "data": horarios})
    except Exception as err:
        return jsonify({"success": False, "message": str(err)}), 500
    finally:
        if conexion and conexion.is_connected():
            conexion.close()


@horarios_bp.route('/api/horarios', methods=['POST'])
@requiere_rol(1, 3) 
def crear_horario():
    datos = request.get_json() or {}
    conexion = None
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
        cursor = conexion.cursor(dictionary=True)

        conflicto = verificar_conflictos(
            cursor, id_grupo, id_usuario, id_aula, dia_semana, hora_inicio, hora_fin
        )
        if conflicto:
            cursor.close()
            return jsonify({"success": False, "message": conflicto}), 409

        cursor.execute("""
            INSERT INTO horarios
                (Id_Usuario, Id_Grupo, Id_Materia, Dia_Semana, Hora_Inicio, Hora_Fin, Id_Aula)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (id_usuario, id_grupo, id_materia, dia_semana, hora_inicio, hora_fin, id_aula))
        conexion.commit()
        nuevo_id = cursor.lastrowid
        cursor.close()

        return jsonify({
            "success": True,
            "message": "Clase registrada correctamente.",
            "Id_Horario": nuevo_id
        })
    except Exception as err:
        if conexion and conexion.is_connected():
            conexion.rollback()
        return jsonify({"success": False, "message": str(err)}), 500
    finally:
        if conexion and conexion.is_connected():
            conexion.close()


@horarios_bp.route('/api/horarios/<int:id_horario>', methods=['PUT'])
@requiere_rol(1, 3) 
def editar_horario(id_horario):
    datos = request.get_json() or {}
    conexion = None
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
        cursor = conexion.cursor(dictionary=True)

        conflicto = verificar_conflictos(
            cursor, id_grupo, id_usuario, id_aula, dia_semana, hora_inicio, hora_fin,
            id_horario_excluir=id_horario
        )
        if conflicto:
            cursor.close()
            return jsonify({"success": False, "message": conflicto}), 409

        cursor.execute("""
            UPDATE horarios
            SET Id_Usuario=%s, Id_Grupo=%s, Id_Materia=%s, Dia_Semana=%s,
                Hora_Inicio=%s, Hora_Fin=%s, Id_Aula=%s
            WHERE Id_Horario=%s
        """, (id_usuario, id_grupo, id_materia, dia_semana, hora_inicio, hora_fin, id_aula, id_horario))
        conexion.commit()
        cursor.close()
        return jsonify({"success": True, "message": "Clase actualizada correctamente."})
    except Exception as err:
        if conexion and conexion.is_connected():
            conexion.rollback()
        return jsonify({"success": False, "message": str(err)}), 500
    finally:
        if conexion and conexion.is_connected():
            conexion.close()


@horarios_bp.route('/api/horarios/resumen-materia/<int:id_materia>', methods=['GET'])
@requiere_rol(1, 2, 3) 
def resumen_materia(id_materia):
    conexion = None
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
    finally:
        if conexion and conexion.is_connected():
            conexion.close()


@horarios_bp.route('/api/horarios/<int:id_horario>', methods=['DELETE'])
@requiere_rol(1, 3)
def eliminar_horario(id_horario):
    conexion = None
    try:
        conexion = obtener_conexion()
        cursor = conexion.cursor()
        cursor.execute("DELETE FROM horarios WHERE Id_Horario=%s", (id_horario,))
        conexion.commit()
        cursor.close()
        return jsonify({"success": True, "message": "Clase eliminada correctamente."})
    except Exception as err:
        if conexion and conexion.is_connected():
            conexion.rollback()
        return jsonify({"success": False, "message": str(err)}), 500
    finally:
        if conexion and conexion.is_connected():
            conexion.close()