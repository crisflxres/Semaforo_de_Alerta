import pandas as pd

def importar_docentes(hoja):    
    docentes: list = []
    
    for i, fila in hoja.iterrows():
        nombre_docente = str(fila.iloc[1]).strip()
        correo = str(fila.iloc[2]).strip()
        rol_texto = str(fila.iloc[3]).strip().lower()
        
        # Omitir subdirectora o filas vacías/encabezados
        if rol_texto in ["subdirectora", "nan", "rol", ""]:
            continue
        
        # Mapeo de roles a sus IDs correspondientes en BD
        if rol_texto in ["docente", "coordinador"]:
            rol_id = 2
        elif rol_texto in ["administrador", "admin"]:
            rol_id = 1
        elif rol_texto == "tutor":
            rol_id = 3
        else:
            # Valor por defecto si viene un rol no mapeado
            rol_id = 2
        
        docente: dict = {
            "nombre_docente": nombre_docente,
            "correo": correo,
            "rol": rol_id
        }
        docentes.append(docente)
    return docentes

if __name__ == "__main__":
    
    hoja = pd.read_excel(r"C:\Users\aleja\OneDrive\Documentos\Archivos_bd\archivos de prueba\archivos de prueba\correos docentes.xlsx")
    
    docentes = importar_docentes(hoja)
    
    for f in docentes:
        print(f)
    print("Total docentes:", len(docentes))