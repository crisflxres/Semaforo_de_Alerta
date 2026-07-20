import mysql.connector
import os
from urllib.parse import urlparse

def obtener_conexion():
    database_url = os.environ.get("DATABASE_URL")

    if database_url:
        # Estamos en Render/producción: parseamos la URL de Aiven
        resultado = urlparse(database_url)
        conn = mysql.connector.connect(
            host=resultado.hostname,
            port=resultado.port,
            user=resultado.username,
            password=resultado.password,
            database=resultado.path.lstrip('/'),
            use_pure=True,
            ssl_verify_cert=False
        )
    else:
        # Estamos en local con XAMPP (fallback para desarrollo)
        conn = mysql.connector.connect(
            host="localhost",
            port=3306,
            user="root",
            password="",
            database="semaforo_alerta",
            use_pure=True
        )

    cursor = conn.cursor()
    cursor.execute("SET SQL_MODE = ''")
    cursor.close()
    return conn