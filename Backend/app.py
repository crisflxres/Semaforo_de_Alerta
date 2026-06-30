from flask import Flask, request, jsonify

# 1. FUNCIÓN DE CONEXIÓN A TU MYSQL WORKBENCH (CONFIGURADA PARA XAMPP) EN conexion_db.py
from conexion_db import obtener_conexion

from Modulo_materias.routes_materias import materias_bp
from flask_cors import CORS
import mysql.connector
import bcrypt
from conexion_db import obtener_conexion
from Modulo_Alumnos.routes_alumnos import alumnos_bp

app = Flask(__name__)
# Permitimos CORS para que tus archivos HTML y JS del frontend puedan comunicarse con Python
CORS(app)
app.register_blueprint(alumnos_bp)
app.register_blueprint(materias_bp)


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

        cursor.close()
        conexion.close()

        if usuario and bcrypt.checkpw(
            password_usuario.encode('utf-8'),
            usuario['Password'].strip().encode('utf-8')
        ):
            return jsonify({
                "success": True,
                "message": "Bienvenido al sistema.",
                "nombre": usuario['Nombre'],
                "rol": usuario['Id_Rol']
            })

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
        }), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)