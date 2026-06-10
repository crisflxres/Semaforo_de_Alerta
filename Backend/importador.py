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
            
            if nombre == ultimo or nombre == "PAC":
                continue
            
            if nombre.lower().startswith("sub"):
                tipo = "submodulo"
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

def limpiar_calificacion(valor):
    if float(valor) == 0 or pd.isna(valor):
        return None  #Guarda Null en lugar de 0 para que no falle la logica de aprobacion
    return float(valor)

def importar_calificaciones(hoja, materias):
    calificaciones:list = []
    
    for i, fila in hoja.iterrows():
        if str(fila[0]).startswith("M") and len(str(fila[0])) >= 15:
            for materia in materias:
                P1 = limpiar_calificacion(fila[materia["columna"]])
                P2 = limpiar_calificacion(fila[materia["columna"] + 1])
                P3 = limpiar_calificacion(fila[materia["columna"] + 2])
                PR = limpiar_calificacion(fila[materia["columna"] + 3])
                
                if P1 is None and P2 is None and P3 is None:
                    continue
                
                if materia["tipo"] == "submodulo":
                    aprobado = 1 if (P1 and P1 >= 6) and (P2 and P2 >= 6) and (P3 and P3 >= 6) else 0
                else:
                    aprobado = 1 if PR and PR >= 6 else 0 #0 significa que reprobo y uno que aprobo

                
                calificacion:dict = {
                    "matricula": fila[0],
                    "materia": materia["nombre"],
                    "P1": P1,
                    "P2": P2,
                    "P3": P3,
                    "PR": PR,
                    "aprobado": aprobado,
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