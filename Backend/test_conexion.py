from conexion_db import obtener_conexion

conexion = obtener_conexion()
cursor = conexion.cursor()

cursor.execute(
    "UPDATE usuarios SET Email = %s WHERE Id_Usuario = %s",
    ("vicmanu315623@gmail.com", 5)
)
conexion.commit()
print("Filas actualizadas:", cursor.rowcount)

cursor.close()
conexion.close()