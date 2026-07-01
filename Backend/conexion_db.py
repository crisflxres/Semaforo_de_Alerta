import mysql.connector

def obtener_conexion():
    conn = mysql.connector.connect(
        host="localhost",
        port=3307,
        user="root",
        password="",
        database="semaforo_alerta",
        use_pure=True
    )
    cursor = conn.cursor()
    cursor.execute("SET SQL_MODE = ''")
    cursor.close()
    return conn