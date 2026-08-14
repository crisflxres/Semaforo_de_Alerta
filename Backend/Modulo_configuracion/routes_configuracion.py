import os
import re
import gc
import shutil
import tempfile
import pandas as pd
from werkzeug.utils import secure_filename
from flask import Blueprint, jsonify, request
from db_manager import importar_taca_completo, actualizar_correos_bulk, actualizar_fotos_bulk, insertar_importacion
from importador_Contactos import importar_correos_electronicos
from importador_fotos import importar_fotos
from conexion_db import obtener_conexion
from PIL import Image, ImageOps 
from io import BytesIO

configuracion_bp = Blueprint(
    "configuracion",
    __name__,
    url_prefix="/configuracion"
)

EXTENSIONES_PERMITIDAS = {".xls", ".xlsx"}
EXTENSIONES_FOTOS_PERMITIDAS = {".jpg", ".jpeg"}

MAPA_SEMESTRES = {
    "primero": 1, "segundo": 2, "tercero": 3, "cuarto": 4,
    "quinto": 5, "sexto": 6, "septimo": 7, "séptimo": 7,
    "octavo": 8, "noveno": 9, "decimo": 10, "décimo": 10,
}


def extraer_nombre_grupo(nombre_archivo):
    nombre_sin_extension = os.path.splitext(nombre_archivo)[0]
    coincidencia = re.search(r'TACA_([A-Za-z0-9]+)', nombre_sin_extension, re.IGNORECASE)
    if not coincidencia:
        return None
    return coincidencia.group(1).upper()


def obtener_datos_grupo(cursor, nombre_grupo):
    cursor.execute(
        "SELECT Id_Grupo, Id_Carrera, Semestre FROM grupos WHERE Nombre = %s",
        (nombre_grupo,)
    )
    fila = cursor.fetchone()

    if not fila:
        return None

    semestre_texto = fila["Semestre"].strip().lower()
    semestre_numero = MAPA_SEMESTRES.get(semestre_texto)

    if semestre_numero is None:
        raise ValueError(f"No se reconoce el semestre '{fila['Semestre']}' del grupo '{nombre_grupo}'")

    return fila["Id_Grupo"], fila["Id_Carrera"], semestre_numero


def comprimir_foto(ruta_archivo, ancho_maximo=400, calidad=75):
    with Image.open(ruta_archivo) as imagen:
        imagen = ImageOps.exif_transpose(imagen)
        if imagen.mode != "RGB":
            imagen = imagen.convert("RGB")

        if imagen.width > ancho_maximo:
            proporcion = ancho_maximo / imagen.width
            nuevo_alto = int(imagen.height * proporcion)
            imagen = imagen.resize((ancho_maximo, nuevo_alto), Image.LANCZOS)

        buffer = BytesIO()
        imagen.save(buffer, format="JPEG", quality=calidad, optimize=True)
        return buffer.getvalue()


@configuracion_bp.route("/prueba", methods=["GET"])
def prueba():
    return jsonify({
        "success": True,
        "mensaje": "Router Configuración funcionando"
    })


@configuracion_bp.route("/historial/<int:id_importacion>", methods=["DELETE"])
def borrar_importacion(id_importacion):
    conexion = None
    try:
        conexion = obtener_conexion()
        cursor = conexion.cursor()
        cursor.execute("DELETE FROM calificaciones WHERE Id_Importacion = %s", (id_importacion,))
        cursor.execute("DELETE FROM importaciones WHERE id_importacion = %s", (id_importacion,))
        conexion.commit()
        cursor.close()
        return jsonify({"success": True, "mensaje": "Importación eliminada"})
    except Exception as e:
        if conexion and conexion.is_connected():
            conexion.rollback()
        return jsonify({"success": False, "mensaje": str(e)}), 500
    finally:
        if conexion and conexion.is_connected():
            conexion.close()


@configuracion_bp.route("/historial", methods=["GET"])
def historial_importaciones():
    conexion = None
    try:
        conexion = obtener_conexion()
        cursor = conexion.cursor(dictionary=True)
        cursor.execute("""
            SELECT 
                i.id_importacion, 
                i.archivo, 
                i.fecha,
                g.Nombre AS grupo,
                COUNT(c.Id_Calificacion) AS registros
            FROM importaciones i
            LEFT JOIN grupos g ON g.Id_Grupo = i.id_grupo
            LEFT JOIN calificaciones c ON c.Id_Importacion = i.id_importacion
            GROUP BY i.id_importacion, i.archivo, i.fecha, g.Nombre
            ORDER BY i.fecha DESC
        """)
        filas = cursor.fetchall()
        for fila in filas:
            if fila["fecha"]:
                fila["fecha"] = fila["fecha"].strftime("%Y-%m-%d %H:%M:%S")

        cursor.close()
        return jsonify({"success": True, "data": filas})
    except Exception as e:
        return jsonify({"success": False, "mensaje": str(e)}), 500
    finally:
        if conexion and conexion.is_connected():
            conexion.close()


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

    nombre_grupo = extraer_nombre_grupo(nombre_archivo)
    if nombre_grupo is None:
        return jsonify({
            "success": False,
            "mensaje": f"No se pudo determinar el grupo a partir del nombre del archivo '{nombre_archivo}'. "
                        f"Se espera un nombre como 'TACA_03AL4I.xls'."
        }), 400

    conexion = None
    try:
        conexion = obtener_conexion()
        cursor = conexion.cursor(dictionary=True)

        datos_grupo = obtener_datos_grupo(cursor, nombre_grupo)

        if datos_grupo is None:
            return jsonify({
                "success": False,
                "mensaje": f"El grupo '{nombre_grupo}' extraído del archivo no existe en la tabla de grupos."
            }), 400

        id_grupo, id_carrera, semestre = datos_grupo

        ruta_temporal = os.path.join(tempfile.gettempdir(), nombre_archivo)
        archivo.save(ruta_temporal)

        resultado = importar_taca_completo(
            ruta_archivo=ruta_temporal,
            nombre_archivo=nombre_archivo,
            id_grupo=id_grupo,
            id_carrera=id_carrera,
            semestre=semestre,
            importado_por=None,
        )

        conexion.commit()
        cursor.close()

    except ValueError as e:
        return jsonify({"success": False, "mensaje": str(e)}), 400
    except Exception as e:
        if conexion and conexion.is_connected():
            conexion.rollback()
        return jsonify({"success": False, "mensaje": f"Error al importar: {str(e)}"}), 500
    finally:
        if conexion and conexion.is_connected():
            conexion.close()
        if 'ruta_temporal' in locals() and os.path.exists(ruta_temporal):
            os.remove(ruta_temporal)

    return jsonify({
        "success": True,
        "mensaje": "Archivo TACA importado correctamente",
        "archivo": nombre_archivo,
        "registros": resultado["alumnos"],
        "id_importacion": resultado["id_importacion"],
        "detalle": resultado,
    })


@configuracion_bp.route("/importar-contactos", methods=["POST"])
def importar_contactos():
    if "archivo" not in request.files:
        return jsonify({"success": False, "mensaje": "No se envió ningún archivo"}), 400

    archivo = request.files["archivo"]

    if archivo.filename == "":
        return jsonify({"success": False, "mensaje": "Nombre de archivo vacío"}), 400

    nombre_archivo = secure_filename(archivo.filename)
    extension = os.path.splitext(nombre_archivo)[1].lower()

    if extension not in EXTENSIONES_PERMITIDAS:
        return jsonify({"success": False, "mensaje": "Formato no soportado, sube un .xls o .xlsx"}), 400

    ruta_temporal = os.path.join(tempfile.gettempdir(), nombre_archivo)
    archivo.save(ruta_temporal)

    conexion = None
    try:
        hoja = pd.read_excel(ruta_temporal)
        contactos = importar_correos_electronicos(hoja)

        conexion = obtener_conexion()
        cursor = conexion.cursor()

        actualizados = actualizar_correos_bulk(cursor, contactos)
        id_importacion = insertar_importacion(cursor, None, nombre_archivo, None)

        conexion.commit()
        cursor.close()

        return jsonify({
            "success": True,
            "mensaje": "Contactos importados correctamente",
            "archivo": nombre_archivo,
            "registros": actualizados,
            "id_importacion": id_importacion,
        })
    except Exception as e:
        if conexion and conexion.is_connected():
            conexion.rollback()
        return jsonify({"success": False, "mensaje": f"Error al importar contactos: {str(e)}"}), 500
    finally:
        if conexion and conexion.is_connected():
            conexion.close()
        if os.path.exists(ruta_temporal):
            os.remove(ruta_temporal)


@configuracion_bp.route("/importar-fotos", methods=["POST"])
def importar_fotos_route():
    archivos = request.files.getlist("fotos")

    if not archivos:
        return jsonify({"success": False, "mensaje": "No se enviaron fotos"}), 400

    carpeta_temporal = tempfile.mkdtemp(prefix="fotos_import_")
    conexion = None

    try:
        for archivo in archivos:
            nombre_base = os.path.basename(archivo.filename)
            extension = os.path.splitext(nombre_base)[1].lower()
            if extension not in EXTENSIONES_FOTOS_PERMITIDAS:
                continue 
            nombre_seguro = secure_filename(nombre_base)
            ruta_destino = os.path.join(carpeta_temporal, nombre_seguro)
            archivo.save(ruta_destino)

        fotos_encontradas = importar_fotos(carpeta_temporal)

        # Procesamiento secuencial (sin hilos) para mantener el pico de memoria
        # bajo y predecible. Cada foto se comprime y su archivo temporal se
        # borra de inmediato, en vez de esperar a que termine todo el lote.
        fotos_comprimidas = []
        for foto in fotos_encontradas:
            try:
                contenido = comprimir_foto(foto["ruta"])
                fotos_comprimidas.append({"matricula": foto["matricula"], "contenido_bytes": contenido})
            except Exception as e:
                print(f"[AVISO] No se pudo procesar la foto de {foto['matricula']}: {e}")
            finally:
                try:
                    os.remove(foto["ruta"])
                except OSError:
                    pass

        conexion = obtener_conexion()
        cursor = conexion.cursor()

        actualizadas = actualizar_fotos_bulk(cursor, fotos_comprimidas)

        conexion.commit()
        cursor.close()

        # Liberar explícitamente la memoria del lote antes de responder,
        # para que no se acumule de un request al siguiente.
        del fotos_comprimidas, fotos_encontradas
        gc.collect()

        return jsonify({
            "success": True,
            "mensaje": "Lote de fotos importado correctamente",
            "registros": actualizadas,
        })
    except Exception as e:
        if conexion and conexion.is_connected():
            conexion.rollback()
        return jsonify({"success": False, "mensaje": f"Error al importar fotos: {str(e)}"}), 500
    finally:
        if conexion and conexion.is_connected():
            conexion.close()
        shutil.rmtree(carpeta_temporal, ignore_errors=True)


@configuracion_bp.route("/finalizar-importacion-fotos", methods=["POST"])
def finalizar_importacion_fotos():
    datos = request.get_json() or {}
    total_registros = datos.get("registros", 0)

    conexion = None
    try:
        conexion = obtener_conexion()
        cursor = conexion.cursor()
        id_importacion = insertar_importacion(cursor, None, "Carpeta de fotos", None)
        conexion.commit()
        cursor.close()

        return jsonify({
            "success": True,
            "id_importacion": id_importacion,
            "registros": total_registros,
        })
    except Exception as e:
        if conexion and conexion.is_connected():
            conexion.rollback()
        return jsonify({"success": False, "mensaje": str(e)}), 500
    finally:
        if conexion and conexion.is_connected():
            conexion.close()