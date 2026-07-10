import pandas as pd

def importar_correos_electronicos (hoja):
    contactos: list =[]
    
    for i, fila in hoja.iterrows():
        matricula = str(fila.iloc[0])
        correo = str(fila.iloc[9])
        
        if pd.notna(fila.iloc[9]) and matricula.startswith("M"):
            contacto = {
                "matricula": matricula,
                "correo": correo
            }
            contactos.append(contacto)
    return contactos
    
if __name__ == "__main__":
    
    Contactos = pd.read_excel(r"C:\Users\aleja\OneDrive\Documentos\Archivos_bd\Matricula_Actual(2).xls")
    
    print("Tablas encontradas: ", len(Contactos))
    
    hoja = Contactos
    
    print("Filas y columnas: ", hoja.shape)
    
    print(Contactos.head())
    
    pd.set_option("display.max_columns", 10)
    pd.set_option("display.width", 200)
    
    for i,fila in hoja.iterrows():
        print(f"Fila:{i}: {fila[0]}")

    correos = importar_correos_electronicos(hoja)
    print("Total contactos: ", len(correos))
    for c in correos:
        print(c)