from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector
import bcrypt

app = Flask(__name__)
# Permitimos CORS para que tus archivos HTML y JS del frontend puedan comunicarse con Python
CORS(app) 

# 1. FUNCIÓN DE CONEXIÓN A TU MYSQL WORKBENCH (CONFIGURADA PARA XAMPP)
def obtener_conexion():
    return mysql.connector.connect(
        host="localhost",
        port=3306,
        user="root",
        password="", 
        database="semaforo_academico"  
    )

# 2. RUTA DE PRUEBA: Para verificar en el navegador que el servidor esté encendido
@app.route('/', methods=['GET'])
def inicio():
    return "El servidor de Python para el Semáforo Académico está corriendo perfectamente."


# 3. RUTA PARA EL INICIO DE SESIÓN (LOGIN)
@app.route('/login', methods=['POST'])
def login():
    datos = request.get_json()
    email = datos.get('correo', '').strip()
    password_usuario = datos.get('password', '')

    if not email or not password_usuario:
        return jsonify({"success": False, "message": "Campos incompletos."}), 400

    try:
        conexion = obtener_conexion()
        cursor = conexion.cursor(dictionary=True)

        # Buscamos al usuario por su Email en la tabla 'usuarios'
        query = "SELECT * FROM usuarios WHERE Email = %s AND Activo = 1"
        cursor.execute(query, (email,))
        usuario = cursor.fetchone()

        cursor.close()
        conexion.close()

        # Verificamos si existe el usuario y si la contraseña coincide usando bcrypt
        if usuario and bcrypt.checkpw(password_usuario.encode('utf-8'), usuario['Password'].encode('utf-8')):
            return jsonify({
                "success": True,
                "message": "¡Bienvenido al sistema!",
                "nombre": usuario['Nombre'],
                "rol": usuario['Id_Rol']
            })
        else:
            return jsonify({"success": False, "message": "Correo o contraseña incorrectos."}), 401

    except mysql.connector.Error as err:
        return jsonify({"success": False, "message": f"Error de base de datos: {err}"}), 500


# 4. RUTA PARA EL REGISTRO DE USUARIOS
@app.route('/registro', methods=['POST'])
def registro():
    datos = request.get_json()
    nombre_completo = datos.get('nombre', '').strip()
    email = datos.get('correo', '').strip()
    password_usuario = datos.get('password', '')

    if not nombre_completo or not email or not password_usuario:
        return jsonify({"success": False, "message": "Todos los campos son obligatorios."}), 400

    # Separamos el nombre completo en Nombre y Apellidos para tus columnas de la BD
    partes = nombre_completo.split(' ')
    nombre = partes[0]
    apellidos = ' '.join(partes[1:]) if len(partes) > 1 else 'No especificado'

    # Encriptamos la contraseña con bcrypt antes de guardarla por seguridad
    password_encriptada = bcrypt.hashpw(password_usuario.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    id_rol = 5 # Rol por defecto: Alumno (según tu base de datos)

    try:
        conexion = obtener_conexion()
        cursor = conexion.cursor()

        query = """INSERT INTO usuarios (Id_Rol, Nombre, Apellidos, Email, Password) 
                   VALUES (%s, %s, %s, %s, %s)"""
        valores = (id_rol, nombre, apellidos, email, password_encriptada)

        cursor.execute(query, valores)
        conexion.commit() # Confirmamos los cambios en la Base de Datos

        cursor.close()
        conexion.close()

        return jsonify({"success": True, "message": "Usuario registrado correctamente en MySQL Workbench."})

    except mysql.connector.Error as err:
        # Si el correo ya existe, saltará el error por la llave UNIQUE de tu BD
        return jsonify({"success": False, "message": f"Error al registrar: {err}"}), 500
    
    # 5. RUTA PARA RECUPERAR / RESTABLECER CONTRASEÑA
@app.route('/recuperar', methods=['POST'])
def recuperar():
    datos = request.get_json()
    email = datos.get('correo', '').strip()
    nueva_password = datos.get('password', '')

    if not email or not nueva_password:
        return jsonify({"success": False, "message": "Todos los campos son obligatorios."}), 400

    try:
        conexion = obtener_conexion()
        cursor = conexion.cursor(dictionary=True)

        # 1. Verificar si el correo realmente existe en la base de datos
        query_verificar = "SELECT Id_Usuario FROM usuarios WHERE Email = %s"
        cursor.execute(query_verificar, (email,))
        usuario = cursor.fetchone()

        if not usuario:
            cursor.close()
            conexion.close()
            return jsonify({"success": False, "message": "El correo electrónico no está registrado."}), 404

        # 2. Si existe, encriptamos la nueva contraseña con bcrypt
        password_encriptada = bcrypt.hashpw(nueva_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

        # 3. Actualizamos la contraseña en la base de datos
        query_update = "UPDATE usuarios SET Password = %s WHERE Id_Usuario = %s"
        cursor.execute(query_update, (password_encriptada, usuario['Id_Usuario']))
        conexion.commit()

        cursor.close()
        conexion.close()

        return jsonify({"success": True, "message": "Contraseña actualizada correctamente en MySQL."})

    except mysql.connector.Error as err:
        return jsonify({"success": False, "message": f"Error en la base de datos: {err}"}), 500

if __name__ == '__main__':
    # Corremos el servidor en el puerto 5000
    app.run(debug=True, port=5000)