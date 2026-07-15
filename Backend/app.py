from flask import Flask, request, jsonify, send_file
import os

# 1. FUNCIÓN DE CONEXIÓN A TU MYSQL WORKBENCH (CONFIGURADA PARA XAMPP) EN conexion_db.py
from conexion_db import obtener_conexion

from flask_cors import CORS
import mysql.connector
import bcrypt
from Modulo_recuperacion.routes_recuperacion import recuperacion_bp
from Modulo_alertas.scheduler_config import scheduler
from Modulo_Alumnos.routes_alumnos import alumnos_bp
from Modulo_docentes.routes_docentes import rutas_docentes
from Modulo_materias.routes_materias import materias_bp
from Modulo_configuracion.routes_configuracion import configuracion_bp
from Modulo_calificaciones.routes_calificaciones import calificaciones_bp
from Modulo_grupos.routes_grupos import grupos_bp
from Modulo_alertas.routes_alertas import alerta_bp
from Modulo_horarios.routes_horarios import horarios_bp   # <-- RESTAURADO
from Modulo_aulas.routes_aulas import aulas_bp             # <-- RESTAURADO

app = Flask(__name__)
# Permitimos CORS para que tus archivos HTML y JS del frontend puedan comunicarse con Python
CORS(app)
app.register_blueprint(recuperacion_bp)
app.register_blueprint(alumnos_bp)
app.register_blueprint(materias_bp)
app.register_blueprint(rutas_docentes)
app.register_blueprint(configuracion_bp)
app.register_blueprint(calificaciones_bp)
app.register_blueprint(grupos_bp)
app.register_blueprint(alerta_bp)
app.register_blueprint(horarios_bp)   # <-- RESTAURADO
app.register_blueprint(aulas_bp)      # <-- RESTAURADO


# 2. RUTA DE PRUEBA: Para verificar en el navegador que el servidor esté encendido
@app.route('/', methods=['GET'])
def inicio():
    return "El servidor de Python para el Semáforo Académico está corriendo correctamente."

@app.route('/login', methods=['POST'])
def login():
    datos = request.get_json()

    usuario_login = datos.get('correo', '').strip()
    password_usuario = datos.get('password', '').strip()

    if not usuario_login or not password_usuario:
        return jsonify({
            "success": False,
            "message": "Campos incompletos."
        }), 400

    try:
        conexion = obtener_conexion()
        cursor = conexion.cursor(dictionary=True)

        query = """
            SELECT *
            FROM usuarios
            WHERE Email = %s
            AND Activo = 1
            LIMIT 1
        """
        cursor.execute(query, (usuario_login,))
        usuario = cursor.fetchone()

        if usuario and bcrypt.checkpw(
            password_usuario.encode('utf-8'),
            usuario['Password'].strip().encode('utf-8')
        ):
            matricula = None
            if usuario['Id_Rol'] == 5:
                cursor2 = conexion.cursor(dictionary=True)
                cursor2.execute("SELECT Matricula FROM alumnos WHERE id_usuario = %s", (usuario['Id_Usuario'],))
                alumno = cursor2.fetchone()
                cursor2.close()
                if alumno:
                    matricula = alumno['Matricula']

            cursor.close()
            conexion.close()

            return jsonify({
                "success": True,
                "message": "Bienvenido al sistema.",
                "nombre": usuario['Nombre'],
                "rol": usuario['Id_Rol'],
                "matricula": matricula
            })

        cursor.close()
        conexion.close()

        return jsonify({
            "success": False,
            "message": "Usuario o contraseña incorrectos."
        }), 401

    except mysql.connector.Error as err:
        return jsonify({
            "success": False,
            "message": f"Error de base de datos: {err}"
        }), 500
        
@app.route('/registro', methods=['POST'])
def registro():
    datos = request.get_json()

    nombre_completo = datos.get('nombre', '').strip()
    email = datos.get('correo', '').strip()
    password_usuario = datos.get('password', '').strip()

    if not nombre_completo or not email or not password_usuario:
        return jsonify({
            "success": False,
            "message": "Campos obligatorios."
        }), 400

    partes = nombre_completo.split(' ')
    nombre = partes[0]
    apellidos = ' '.join(partes[1:]) if len(partes) > 1 else 'No especificado'

    password_encriptada = bcrypt.hashpw(
        password_usuario.encode('utf-8'),
        bcrypt.gensalt()
    ).decode('utf-8')

    try:
        conexion = obtener_conexion()
        cursor = conexion.cursor()

        query = """
            INSERT INTO usuarios
            (Id_Rol, Nombre, Apellidos, Email, Password, Activo)
            VALUES (%s, %s, %s, %s, %s, %s)
        """
        cursor.execute(query, (5, nombre, apellidos, email, password_encriptada, 1))

        conexion.commit()
        cursor.close()
        conexion.close()

        return jsonify({
            "success": True,
            "message": "Usuario registrado correctamente."
        })

    except mysql.connector.Error as err:
        return jsonify({
            "success": False,
            "message": f"Error al registrar: {err}"
        }), 500

@app.route('/admin/crear_usuario', methods=['POST'])
def crear_usuario():
    datos = request.get_json()

    nombre = datos.get('nombre', '').strip()
    apellidos = datos.get('apellidos', '').strip()
    email = datos.get('email', '').strip()
    password_usuario = datos.get('password', '').strip()
    telefono = datos.get('telefono', '').strip()
    id_rol = datos.get('id_rol')

    if not all([nombre, apellidos, email, password_usuario, telefono, id_rol]):
        return jsonify({
            "success": False,
            "message": "Todos los campos son obligatorios."
        }), 400

    try:
        id_rol = int(id_rol)
    except (ValueError, TypeError):
        return jsonify({
            "success": False,
            "message": "Rol inválido."
        }), 400

    password_encriptada = bcrypt.hashpw(
        password_usuario.encode('utf-8'),
        bcrypt.gensalt()
    ).decode('utf-8')

    try:
        conexion = obtener_conexion()
        cursor = conexion.cursor(dictionary=True)

        # Verificar que el correo no exista ya
        cursor.execute("SELECT Id_Usuario FROM usuarios WHERE Email = %s", (email,))
        existente = cursor.fetchone()
        if existente:
            cursor.close()
            conexion.close()
            return jsonify({
                "success": False,
                "message": "Ese correo ya está registrado."
            }), 409

        query = """
            INSERT INTO usuarios
            (Id_Rol, Nombre, Apellidos, Email, Password, Telefono, Activo)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """
        cursor.execute(query, (id_rol, nombre, apellidos, email, password_encriptada, telefono, 1))

        conexion.commit()
        cursor.close()
        conexion.close()

        return jsonify({
            "success": True,
            "message": "Usuario creado correctamente."
        })

    except mysql.connector.Error as err:
        return jsonify({
            "success": False,
            "message": f"Error al crear usuario: {err}"
        }), 500

# --- Fotos de alumnos (agregado por tu compañero) ---
CARPETA_FOTOS = r"C:\Users\crisf\OneDrive\Documentos\UPT\SEXTO CUATRIMESTRE_SERVICIO_SOCIAL_(TSU)\Proyecto_Documentacion\Matricula Total"

def construir_mapa_fotos(carpeta):
    mapa = {}
    for raiz, dirs, archivos in os.walk(carpeta):
        for archivo in archivos:
            nombre, ext = os.path.splitext(archivo)
            if ext.lower() in [".jpg", ".jpeg"]:
                clave = nombre.lstrip("M")
                mapa[clave] = os.path.join(raiz, archivo)
    return mapa

MAPA_FOTOS = construir_mapa_fotos(CARPETA_FOTOS)

@app.route('/fotos/<matricula>')
def get_foto(matricula):
    nombre = matricula.lstrip("M")
    ruta = MAPA_FOTOS.get(nombre)
    if ruta:
        return send_file(ruta, mimetype="image/jpeg")
    print(f"No se encontró foto para matrícula: {nombre}")
    return "", 404




@app.route('/recuperar', methods=['POST'])
def recuperar():
    datos = request.get_json()

    email = datos.get('correo', '').strip()
    nueva_password = datos.get('password', '').strip()

    if not email or not nueva_password:
        return jsonify({
            "success": False,
            "message": "Campos obligatorios."
        }), 400

    try:
        conexion = obtener_conexion()
        cursor = conexion.cursor(dictionary=True)

        query_verificar = "SELECT Id_Usuario FROM usuarios WHERE Email = %s"
        cursor.execute(query_verificar, (email,))
        usuario = cursor.fetchone()

        if not usuario:
            cursor.close()
            conexion.close()
            return jsonify({
                "success": False,
                "message": "Usuario no registrado."
            }), 404

        password_encriptada = bcrypt.hashpw(
            nueva_password.encode('utf-8'),
            bcrypt.gensalt()
        ).decode('utf-8')

        cursor.execute(
            "UPDATE usuarios SET Password = %s WHERE Id_Usuario = %s",
            (password_encriptada, usuario['Id_Usuario'])
        )

        conexion.commit()
        cursor.close()
        conexion.close()

        return jsonify({
            "success": True,
            "message": "Contraseña actualizada correctamente."
        })

    except mysql.connector.Error as err:
        return jsonify({
            "success": False,
            "message": f"Error: {err}"
        }), 500   # <-- FALTABA este 500, sin él el return quedaba roto

if __name__ == '__main__':
    app.run(debug=True, port=5000)