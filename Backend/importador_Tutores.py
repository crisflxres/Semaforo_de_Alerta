import pandas as pd

def importar_tutores(hoja):
    tutores: list =[]
    
    for i, fila in hoja.iterrows():
        grupo = str(fila.iloc[1])
        periodo = str(fila.iloc[4])
        nombre_tutor = str(fila.iloc[5])
        
        tutor: dict = {
            "grupo": grupo,
            "periodo": periodo,
            "tutor": nombre_tutor
        }
        tutores.append(tutor)
    return tutores

if __name__ == "__main__":
    
    hoja = pd.read_excel(r"C:\Users\aleja\OneDrive\Documentos\Archivos_bd\Datos Programa.xlsx", skiprows= 7)
    
    tutores = importar_tutores(hoja)
    
    for f in tutores:
        print(f)
    print("Total tutores:", len(tutores))