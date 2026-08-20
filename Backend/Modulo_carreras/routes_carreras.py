from flask import Blueprint, jsonify
import mysql.connector
from conexion_db import obtener_conexion
from auth_utils import requiere_rol

carreras_bp = Blueprint("carreras", __name__)

@carreras_bp.route("/api/carreras")
@requiere_rol(1, 2, 3, 5)
def get_carreras():
    conexion = None
    try:
        conexion = obtener_conexion()          # ← esto faltaba
        cursor = conexion.cursor(dictionary=True)
        cursor.execute("SELECT Id_Carrera, Nombre, Clave FROM carreras")
        carreras = cursor.fetchall()           # ← una sola llamada
        cursor.close()
        return jsonify(carreras)

    except mysql.connector.Error as err:
        return jsonify({"success": False, "message": str(err)}), 500
    finally:
        if conexion and conexion.is_connected():
            conexion.close()