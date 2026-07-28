from flask import Blueprint, jsonify
from conexion_db import obtener_conexion
from auth_utils import requiere_rol

carreras_bp = Blueprint("carreras", __name__)

@carreras_bp.route("/api/carreras")
@requiere_rol(1, 2, 3)
def get_carreras():
    conexion = obtener_conexion()
    query = "SELECT Id_Carrera, Nombre, Clave FROM carreras"

    cursor = conexion.cursor()
    cursor.execute(query)
    filas = cursor.fetchall()

    carreras: list = []

    for fila in filas:
        carreras.append({
            "Id_Carrera": fila[0],
            "Nombre": fila[1],
            "Clave": fila[2]
        })

    cursor.close()
    conexion.close()
    return jsonify(carreras)