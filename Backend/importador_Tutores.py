import pandas as pd

def importar_tutores(hoja):
    tutores: list = []
    
    for i, fila in hoja.iterrows():
        # Capturamos el valor original y su versión en texto
        val_tutor = fila.iloc[5]
        nombre_tutor = str(val_tutor).strip()
        
        # Omitir si la celda está vacía (NaN), si es 'nan' o si es el encabezado 'Nombre del tutor'
        if pd.isna(val_tutor) or nombre_tutor.lower() in ["nan", "nombre del tutor", ""]:
            continue
        
        grupo = str(fila.iloc[1])
        periodo = str(fila.iloc[4])
        
        tutor: dict = {
            "grupo": grupo,
            "periodo": periodo,
            "tutor": nombre_tutor
        }
        tutores.append(tutor)
        
    return tutores

if __name__ == "__main__":
    hoja = pd.read_excel(r"C:\Users\aleja\OneDrive\Documentos\Archivos_bd\Datos Programa.xlsx", skiprows=7)
    
    tutores = importar_tutores(hoja)
    
    for f in tutores:
        print(f)
    print("Total tutores:", len(tutores))