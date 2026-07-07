import pandas as pd

def importar_docentes(hoja):
    docentes: list = []
    
    for i, fila in hoja.iterrows():
        nombre_docente = str(fila.iloc[1])
        correo = str(fila.iloc[2])
        rol = str(fila.iloc[3])
        
        if rol == "subdirectora":
            continue
        
        if rol == "docente" or rol == "coordinador":
            rol = 2
        
        docente: dict = {
            "nombre_docente": nombre_docente,
            "correo": correo,
            "rol": rol
        }
        docentes.append(docente)
    return docentes

if __name__ == "__main__":
    
    hoja = pd.read_excel(r"C:\Users\crisf\OneDrive\Documentos\UPT\SEXTO CUATRIMESTRE_SERVICIO_SOCIAL_(TSU)\Proyecto_Documentacion\archivos de prueba\correos docentes.xlsx")
    
    docentes = importar_docentes(hoja)
    
    for f in docentes:
        print(f)
    print("Total docentes:", len(docentes))