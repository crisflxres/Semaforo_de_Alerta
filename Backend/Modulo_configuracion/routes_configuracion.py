import os
import re
import tempfile
from werkzeug.utils import secure_filename
from flask import Blueprint, jsonify, request
from db_manager import importar_taca_completo
from conexion_db import obtener_conexion

configuracion_bp = Blueprint(
    "configuracion",
    __name__,
    url_prefix="/configuracion"
)

EXTENSIONES_PERMITIDAS = {".xls", ".xlsx"}

MAPA_SEMESTRES = {
    "primero": 1, "segundo": 2, "tercero": 3, "cuarto": 4,
    "quinto": 5, "sexto": 6, "septimo": 7, "séptimo": 7,
    "octavo": 8, "noveno": 9, "decimo": 10, "décimo": 10,
}


def extraer_nombre_grupo(nombre_archivo):
    """
    Extrae el código de grupo a partir del nombre del archivo TACA.
    Funciona con nombres como 'TACA_03AL4I.xls' o 'meca_TACA_03U6A.xls'.
    Devuelve el código en mayúsculas (ej. '03AL4I') o None si no lo encuentra.
    """
    nombre_sin_extension = os.path.splitext(nombre_archivo)[0]
    coincidencia = re.search(r'TACA_([A-Za-z0-9]+)', nombre_sin_extension, re.IGNORECASE)
    if not coincidencia:
        return None
    return coincidencia.group(1).upper()


def obtener_datos_grupo(nombre_grupo):
    """
    Busca el grupo por nombre en la tabla `grupos` y devuelve
    (id_grupo, id_carrera, semestre_numero) o None si no existe.
    """
    conexion = obtener_conexion()
    cursor = conexion.cursor(dictionary=True)
    cursor.execute(
        "SELECT Id_Grupo, Id_Carrera, Semestre FROM grupos WHERE Nombre = %s",
        (nombre_grupo,)
    )
    fila = cursor.fetchone()
    cursor.close()
    conexion.close()

    if not fila:
        return None

    semestre_texto = fila["Semestre"].strip().lower()
    semestre_numero = MAPA_SEMESTRES.get(semestre_texto)

    if semestre_numero is None:
        raise ValueError(f"No se reconoce el semestre '{fila['Semestre']}' del grupo '{nombre_grupo}'")

    return fila["Id_Grupo"], fila["Id_Carrera"], semestre_numero


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
        # Convertir datetime a texto 
        for fila in filas:
            if fila["fecha"]:
                fila["fecha"] = fila["fecha"].strftime("%Y-%m-%d %H:%M:%S")
                
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

    # Extraer el grupo del nombre del archivo y buscar sus datos reales en la BD
    nombre_grupo = extraer_nombre_grupo(nombre_archivo)
    if nombre_grupo is None:
        return jsonify({
            "success": False,
            "mensaje": f"No se pudo determinar el grupo a partir del nombre del archivo '{nombre_archivo}'. "
                        f"Se espera un nombre como 'TACA_03AL4I.xls'."
        }), 400

    try:
        datos_grupo = obtener_datos_grupo(nombre_grupo)
    except ValueError as e:
        return jsonify({"success": False, "mensaje": str(e)}), 400

    if datos_grupo is None:
        return jsonify({
            "success": False,
            "mensaje": f"El grupo '{nombre_grupo}' extraído del archivo no existe en la tabla de grupos."
        }), 400

    id_grupo, id_carrera, semestre = datos_grupo
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