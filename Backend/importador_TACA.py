def leer_taca(ruta_archivo):
    import pandas as pd
    """
    Lee un archivo TACA sin importar si es HTML disfrazado (.xls) 
    o un archivo Excel binario real (.xlsx).
    Devuelve el DataFrame ya normalizado, listo para usarse
    con importar_alumnos, importar_materias, importar_calificaciones.
    """
    try:
        # Intento 1: formato HTML disfrazado (el más común)
        tablas = pd.read_html(ruta_archivo, encoding='utf-8')
        hoja = tablas[0]
        return hoja
    except Exception as error_html:
        # Intento 2: formato Excel binario real
        try:
            hoja = pd.read_excel(ruta_archivo, header=None)
            hoja.iloc[0] = hoja.iloc[0].ffill()
            return hoja
        except Exception as error_excel:
            raise Exception(
                f"No se pudo leer el archivo como HTML ni como Excel.\n"
                f"Error HTML: {error_html}\n"
                f"Error Excel: {error_excel}"
            )

def limpiar_texto(valor):
    # Evita que celdas vacías (NaN) rompan concatenaciones de texto
    if pd.isna(valor):
        return ""
    return str(valor).strip()

def importar_alumnos(hoja):
    alumnos: list = []

    for i, fila in hoja.iterrows():
        texto = str(fila[0])
        if texto[1:].isdigit() and len(texto[1:]) >= 14:
            ultima_columna = hoja.shape[1] - 1
            alumno: dict = {
                "matricula": texto[1:],
                "apellido.p": limpiar_texto(fila[1]),
                "apellido.m": limpiar_texto(fila[2]),
                "nombre(s)": limpiar_texto(fila[3]),
                "PAC": float(fila[ultima_columna])
            }
            alumnos.append(alumno)
    return alumnos

def importar_materias(hoja):
    materias:list = []
    
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
    # Evitar convertir valores NA/NaN a float directamente
    if pd.isna(valor):
        return None  # Guarda Null en lugar de valores faltantes
    try:
        f = float(valor)
    except Exception:
        return None
    if f == 0:
        return None  # Guarda Null en lugar de 0 para que no falle la logica de aprobacion
    return f

def importar_calificaciones(hoja, materias):
    calificaciones:list = []
    
    for i, fila in hoja.iterrows():
        texto = str(fila[0])
        if texto[1:].isdigit() and len(texto[1:]) >= 14:
            for materia in materias:
                P1 = limpiar_calificacion(fila[materia["columna"]])
                P2 = limpiar_calificacion(fila[materia["columna"] + 1])
                P3 = limpiar_calificacion(fila[materia["columna"] + 2])
                PR = limpiar_calificacion(fila[materia["columna"] + 3])
                
                if P1 is None and P2 is None and P3 is None:
                    continue
                
                if materia["tipo"] == "submodulo":
                    parciales_con_valor = [p for p in [P1, P2, P3] if p is not None]
                    if len(parciales_con_valor) == 0:
                        aprobado = 0
                    else:
                        aprobado = 1 if all(p >= 6 for p in parciales_con_valor) else 0
                else:
                    aprobado = 1 if (PR is not None and PR >= 6) else 0

                
                calificacion:dict = {
                    "matricula": texto[1:],
                    "materia": materia["nombre"],
                    "P1": P1,
                    "P2": P2,
                    "P3": P3,
                    "PR": PR,
                    "aprobado": aprobado,
                }
                calificaciones.append(calificacion)
    return calificaciones

if __name__== "__main__":
    # Leer el archivo (ya usando la función que detecta el formato automáticamente)
    hoja = leer_taca(r"C:\Users\aleja\OneDrive\Documentos\Archivos_bd\TACA_03AJ6L.xls")

    # Ver cuántas filas y columnas tiene
    print("Filas y columnas:", hoja.shape)

    # Ver las primeras 5 filas de la tabla
    print(hoja.head())

    pd.set_option('display.max_columns', 10)
    pd.set_option('display.width', 200)

    #imprimir fila por fila con su numero 
    for i, fila in hoja.iterrows():
        print(f"Fila {i}: {fila[0]}")

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