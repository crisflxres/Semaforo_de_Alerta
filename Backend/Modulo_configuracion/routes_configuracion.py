import os
import tempfile
from werkzeug.utils import secure_filename
from flask import Blueprint, jsonify, request

from db_manager import importar_taca_completo
from Modulo_configuracion.conexion_bd import obtener_conexion

configuracion_bp = Blueprint(
    "configuracion",
    __name__,
    url_prefix="/configuracion"
)

EXTENSIONES_PERMITIDAS = {".xls", ".xlsx"}


@configuracion_bp.route("/prueba", methods=["GET"])
def prueba():
    return jsonify({
        "success": True,
        "mensaje": "Router Configuración funcionando"
    })


@configuracion_bp.route("/historial/<int:id_importacion>", methods=["DELETE"])
def borrar_importacion(id_importacion):
    try:
        conexion = obtener_conexion()
        cursor = conexion.cursor()
        cursor.execute("DELETE FROM calificaciones WHERE Id_Importacion = %s", (id_importacion,))
        cursor.execute("DELETE FROM importaciones WHERE id_importacion = %s", (id_importacion,))
        conexion.commit()
        cursor.close()
        conexion.close()
        return jsonify({"success": True, "mensaje": "Importación eliminada"})
    except Exception as e:
        return jsonify({"success": False, "mensaje": str(e)}), 500


@configuracion_bp.route("/historial", methods=["GET"])
def historial_importaciones():
    try:
        conexion = obtener_conexion()
        cursor = conexion.cursor(dictionary=True)
        cursor.execute("""
            SELECT i.id_importacion, i.archivo, i.fecha, i.periodo,
                   g.Nombre AS grupo,
                   (SELECT COUNT(*) FROM calificaciones c WHERE c.Id_Importacion = i.id_importacion) AS registros
            FROM importaciones i
            LEFT JOIN grupos g ON g.Id_Grupo = i.id_grupo
            ORDER BY i.fecha DESC
        """)
        filas = cursor.fetchall()
        cursor.close()
        conexion.close()
        return jsonify({"success": True, "data": filas})
    except Exception as e:
        return jsonify({"success": False, "mensaje": str(e)}), 500


@configuracion_bp.route("/importar-taca", methods=["POST"])
def importar_taca():
    if "archivo" not in request.files:
        return jsonify({"success": False, "mensaje": "No se envió ningún archivo"}), 400

    archivo = request.files["archivo"]

    if archivo.filename == "":
        return jsonify({"success": False, "mensaje": "Nombre de archivo vacío"}), 400

    nombre_archivo = secure_filename(archivo.filename)
    extension = os.path.splitext(nombre_archivo)[1].lower()

    if extension not in EXTENSIONES_PERMITIDAS:
        return jsonify({"success": False, "mensaje": "Formato no soportado, sube un .xls o .xlsx"}), 400

    # Por ahora estos valores van fijos, luego los podemos mandar desde el front
    # (selects de grupo/carrera/semestre/periodo en la misma pantalla)
    id_grupo = request.form.get("id_grupo", 40, type=int)
    id_carrera = request.form.get("id_carrera", 2, type=int)
    semestre = request.form.get("semestre", 6, type=int)
    periodo = request.form.get("periodo", "FEBRERO - JULIO 2026")

    ruta_temporal = os.path.join(tempfile.gettempdir(), nombre_archivo)
    archivo.save(ruta_temporal)

    try:
        resultado = importar_taca_completo(
            ruta_archivo=ruta_temporal,
            nombre_archivo=nombre_archivo,
            id_grupo=id_grupo,
            id_carrera=id_carrera,
            semestre=semestre,
            periodo=periodo,
            importado_por=None,
        )
    except Exception as e:
        return jsonify({"success": False, "mensaje": f"Error al importar: {str(e)}"}), 500
    finally:
        if os.path.exists(ruta_temporal):
            os.remove(ruta_temporal)

    return jsonify({
        "success": True,
        "mensaje": "Archivo TACA importado correctamente",
        "archivo": nombre_archivo,
        "registros": resultado["alumnos"],
        "id_importacion": resultado["id_importacion"],
        "detalle": resultado,
    })