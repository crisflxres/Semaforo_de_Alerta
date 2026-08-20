from flask import Blueprint, request, jsonify
import bcrypt
from conexion_db import obtener_conexion
from auth_utils import requiere_rol 

rutas_docentes = Blueprint('rutas_docentes', __name__)

# ── VER (Administrador, Docente, Tutor, Docente/Tutor) ──────────────────────

@rutas_docentes.route('/docentes', methods=['GET'])
@requiere_rol(1, 2, 3, 5)
def get_docentes():
    conexion = None
    try:
        conexion = obtener_conexion()
        cursor = conexion.cursor(dictionary=True)
        cursor.execute("""
            SELECT Id_Usuario, Nombre, Apellidos, Email, Telefono, Id_Rol
            FROM usuarios
            WHERE Id_Rol IN (2, 3, 5) AND Activo = 1
        """)
        docentes = cursor.fetchall()
        cursor.close()
        return jsonify({"success": True, "data": docentes})
    except Exception as err:
        return jsonify({"success": False, "message": str(err)}), 500
    finally:
        if conexion and conexion.is_connected():
            conexion.close()


@rutas_docentes.route('/docentes/<int:id_usuario>/resumen', methods=['GET'])
@requiere_rol(1, 2, 3, 5)
def get_resumen_docente(id_usuario):
    conexion = None
    try:
        conexion = obtener_conexion()
        cursor = conexion.cursor(dictionary=True)
        cursor.execute("""
            SELECT 
                COUNT(DISTINCT Id_Materia) AS total_materias,
                COUNT(DISTINCT Id_Grupo) AS total_grupos
            FROM horarios
            WHERE Id_Usuario = %s
        """, (id_usuario,))
        resumen = cursor.fetchone()
        cursor.close()
        return jsonify({"success": True, "data": resumen})
    except Exception as err:
        return jsonify({"success": False, "message": str(err)}), 500
    finally:
        if conexion and conexion.is_connected():
            conexion.close()


# ── CREAR / EDITAR / ELIMINAR (solo Administrador) ───────────────────────────

@rutas_docentes.route('/docentes', methods=['POST'])
@requiere_rol(1)
def crear_docente():
    datos = request.get_json() or {}
    conexion = None
    try:
        nombre = datos.get('nombre', '')
        apellidos = datos.get('apellidos', '')
        email = datos.get('email', '')

        if not nombre or not apellidos or not email:
            return jsonify({"success": False, "message": "Faltan campos obligatorios."}), 400

        primer_apellido = apellidos.split()[0] if apellidos.split() else ''
        password_temp = f"{nombre}{primer_apellido}".replace(' ', '')
        password_hash = bcrypt.hashpw(password_temp.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        id_rol = datos.get('id_rol', 2)
        telefono = datos.get('telefono', None)

        conexion = obtener_conexion()
        cursor = conexion.cursor(dictionary=True)

        # Email es UNIQUE en `usuarios`. Si ya existe un registro con ese correo
        # (por ejemplo, de antes de que el borrado fuera físico, o alguien dado
        # de baja manualmente), lo reactivamos en vez de tronar por duplicado.
        cursor.execute("SELECT Id_Usuario, Activo FROM usuarios WHERE Email = %s", (email,))
        existente = cursor.fetchone()

        if existente:
            if existente['Activo'] == 1:
                cursor.close()
                return jsonify({
                    "success": False,
                    "message": "Ya existe un docente activo con ese correo."
                }), 409

            cursor.execute("""
                UPDATE usuarios
                SET Id_Rol=%s, Nombre=%s, Apellidos=%s, Password=%s, Telefono=%s, Activo=1
                WHERE Id_Usuario=%s
            """, (id_rol, nombre, apellidos, password_hash, telefono, existente['Id_Usuario']))
            conexion.commit()
            cursor.close()
            return jsonify({"success": True, "message": "Docente reactivado correctamente."})

        cursor.execute("""
            INSERT INTO usuarios (Id_Rol, Nombre, Apellidos, Email, Password, Telefono)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (id_rol, nombre, apellidos, email, password_hash, telefono))
        conexion.commit()
        cursor.close()
        return jsonify({"success": True, "message": "Docente registrado correctamente."})
    except Exception as err:
        if conexion and conexion.is_connected():
            conexion.rollback()
        return jsonify({"success": False, "message": str(err)}), 500
    finally:
        if conexion and conexion.is_connected():
            conexion.close()


@rutas_docentes.route('/docentes/<int:id_usuario>', methods=['PUT'])
@requiere_rol(1)
def editar_docente(id_usuario):
    datos = request.get_json() or {}
    conexion = None
    try:
        conexion = obtener_conexion()
        cursor = conexion.cursor()
        cursor.execute("""
            UPDATE usuarios SET Nombre=%s, Apellidos=%s, Email=%s, Telefono=%s, Id_Rol=%s
            WHERE Id_Usuario=%s
        """, (datos.get('nombre'), datos.get('apellidos'), datos.get('email'), datos.get('telefono', None), datos.get('id_rol'), id_usuario))
        conexion.commit()
        cursor.close()
        return jsonify({"success": True, "message": "Docente actualizado correctamente."})
    except Exception as err:
        if conexion and conexion.is_connected():
            conexion.rollback()
        return jsonify({"success": False, "message": str(err)}), 500
    finally:
        if conexion and conexion.is_connected():
            conexion.close()


@rutas_docentes.route('/docentes/<int:id_usuario>', methods=['DELETE'])
@requiere_rol(1)
def eliminar_docente(id_usuario):
    conexion = None
    try:
        conexion = obtener_conexion()
        cursor = conexion.cursor()

        # El docente debe existir y estar en un rol válido de docente
        cursor.execute("""
            SELECT Id_Usuario FROM usuarios
            WHERE Id_Usuario = %s AND Id_Rol IN (2, 3, 5)
        """, (id_usuario,))
        if not cursor.fetchone():
            cursor.close()
            return jsonify({"success": False, "message": "El docente no existe."}), 404

        # Bloquear si tiene horarios asignados (FK_Horario_Usuario es RESTRICT)
        cursor.execute("SELECT COUNT(*) FROM horarios WHERE Id_Usuario = %s", (id_usuario,))
        total_horarios = cursor.fetchone()[0]
        if total_horarios > 0:
            cursor.close()
            return jsonify({
                "success": False,
                "message": f"No se puede eliminar: el docente tiene {total_horarios} horario(s) asignado(s). "
                            "Reasigna o elimina esos horarios antes de borrarlo."
            }), 409

        # Bloquear si tiene observaciones registradas (FK_Observacion_Usuario también es RESTRICT)
        cursor.execute("SELECT COUNT(*) FROM observaciones WHERE Id_Usuario = %s", (id_usuario,))
        total_observaciones = cursor.fetchone()[0]
        if total_observaciones > 0:
            cursor.close()
            return jsonify({
                "success": False,
                "message": f"No se puede eliminar: el docente tiene {total_observaciones} observación(es) registrada(s). "
                            "Reasigna o elimina esos registros antes de borrarlo."
            }), 409

        cursor.execute("DELETE FROM usuarios WHERE Id_Usuario=%s", (id_usuario,))
        conexion.commit()
        cursor.close()
        return jsonify({"success": True, "message": "Docente eliminado correctamente."})
    except Exception as err:
        if conexion and conexion.is_connected():
            conexion.rollback()
        # Por si queda alguna otra relación (FK) que no revisamos explícitamente arriba
        mensaje = str(err)
        if "foreign key constraint" in mensaje.lower() or "1451" in mensaje:
            mensaje = "No se puede eliminar: el docente todavía tiene registros relacionados en el sistema."
        return jsonify({"success": False, "message": mensaje}), 500
    finally:
        if conexion and conexion.is_connected():
            conexion.close()