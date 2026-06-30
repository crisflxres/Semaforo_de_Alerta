import mysql.connector

def obtener_conexion():
    conn = mysql.connector.connect(
        host="localhost",
        port=3306,
        user="root",
        password="",
        database="semaforo_alerta"
    )
    cursor = conn.cursor()
    cursor.execute("SET SQL_MODE = ''")
    cursor.close()
    return conn