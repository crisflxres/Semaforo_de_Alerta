import pandas as pd

# Leer el archivo
TACA = pd.read_html(r"C:\Users\crisf\OneDrive\Documentos\UPT\SEXTO CUATRIMESTRE_SERVICIO_SOCIAL_(TSU)\Proyecto_Documentacion\TACA_03AJ6L.xls")

# Ver cuántas tablas encontró
print("Tablas encontradas:", len(TACA))

# Tomar la primera hoja del TACA
hoja = TACA[0]

# Ver cuántas filas y columnas tiene
print("Filas y columnas:", hoja.shape)

# Ver las primeras 5 filas de la tabla
print(hoja.head())

pd.set_option('display.max_columns', 10)
pd.set_option('display.width', 200)

#imprimir fila por fila con su numero 
for i, fila in hoja.iterrows():
    print(f"Fila {i}: {fila[0]}")

def importar_alumnos (hoja):
    alumnos:list =[]
    
    for i, fila in hoja.iterrows():
        if str(fila[0]).startswith("M") and len(str(fila[0])) >= 15:
            ultima_columna= hoja.shape[1] - 1
            alumno:dict = {
                "matricula": fila[0],
                "apellido.p": fila[1],
                "apellido.m": fila[2],
                "nombre(s)": fila[3],
                "PAC": float(fila[ultima_columna])
            }
            alumnos.append(alumno)
    return alumnos

def importar_materias(hoja):
    materias = []
    
    ultimo = None #Guarda el valor del ultimo nombre de la materia registrado
    
    for i, valor in hoja.iloc[0, 4:].items():
        if pd.notna(valor):
            
            nombre = str(valor)
            
            if nombre == ultimo:
                continue
            
            if nombre == ultimo or nombre == "PAC":
                continue
            
            if nombre.lower().startswith("sub"):
                tipo = "submodulo"
            elif nombre.lower().startswith("mód") or nombre.lower().startswith("mod"):
                    tipo = "modulo"
            else:
                tipo = "basica"

            materia = {
                "nombre":  nombre,
                "tipo":    tipo,
                "columna": i
            }
            materias.append(materia)
            ultimo = nombre
    return materias

def importar_calificaciones(hoja, materias):
    calificaciones:list = []
    
    for i, fila in hoja.iterrows():
        if str(fila[0]).startswith("M") and len(str(fila[0])) >= 15:
            for materia in materias:
                calificacion:dict = {
                    "matricula": fila[0],
                    "materia": materia["nombre"],
                    "P1": float(fila[materia["columna"]]),
                    "P2": float(fila[materia["columna"] + 1]),
                    "P3": float(fila[materia["columna"] + 2]),
                    "PR": float(fila[materia["columna"] + 3]),
                }
                calificaciones.append(calificacion)
    return calificaciones

alumnos = importar_alumnos(hoja)
print("Total alumnos: ",len(alumnos))
for a in alumnos:
    print(a)

materias = importar_materias(hoja)
for m in materias:
    print(m)

calificaciones = importar_calificaciones( hoja, materias)
print("Total calificaciones:", len(calificaciones))
for c in calificaciones:
    print(c)