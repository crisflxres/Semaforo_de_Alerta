import os

def importar_fotos(ruta_carpeta_foto):
    fotos: list = []
    
    for carpeta, subcarpeta, archivos in os.walk(ruta_carpeta_foto):
        for archivo in archivos:
            nombre, extension = os.path.splitext(archivo)
            
            if nombre.isnumeric() and extension.lower() in [".jpg", ".jpeg"]:
                matricula = "M" + nombre
                ruta_completa = os.path.join(carpeta, archivo)
                foto: dict = {
                    "matricula": matricula,
                    "ruta": ruta_completa
                }
                fotos.append(foto)
    return fotos

if __name__ == "__main__":
    
    fotos = importar_fotos(r"C:\Users\aleja\OneDrive\Documentos\Archivos_bd\Matricula Total")
    
    for f in fotos:
        print(f)
    print("Total fotos:", len(fotos))
