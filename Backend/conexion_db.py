import mysql.connector
from mysql.connector import pooling
import os
from urllib.parse import urlparse

# El pool se crea una sola vez por proceso, la primera vez que se pide una conexión.
_pool = None


def _crear_pool():
    database_url = os.environ.get("DATABASE_URL")

    if database_url:
        resultado = urlparse(database_url)
        config = {
            "host": resultado.hostname,
            "port": resultado.port,
            "user": resultado.username,
            "password": resultado.password,
            "database": resultado.path.lstrip('/'),
            "use_pure": True,
            "ssl_disabled": False,
        }
    else:
        # Estamos en local con XAMPP (fallback para desarrollo)
        config = {
            "host": "localhost",
            "port": 3306,
            "user": "root",
            "password": "",
            "database": "semaforo_alerta",
            "use_pure": True,
        }

    return pooling.MySQLConnectionPool(
        pool_name="semaforo_pool",
        pool_size=4,          # numero de conexiones que se mantienen abiertas y listas
        pool_reset_session=True,
        **config
    )


def obtener_conexion():
    global _pool
    if _pool is None:
        _pool = _crear_pool()

    conn = _pool.get_connection()

    cursor = conn.cursor()
    cursor.execute("SET SQL_MODE = ''")
    cursor.close()

    return conn