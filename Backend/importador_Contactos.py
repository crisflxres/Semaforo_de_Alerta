import pandas as pd

def importar_correos_electronicos (hoja):
    contactos: list =[]
    
if __name__ == "__name":
    Contactos = pd.read_html(r"C:\Users\crisf\OneDrive\Documentos\UPT\SEXTO CUATRIMESTRE_SERVICIO_SOCIAL_(TSU)\Proyecto_Documentacion\proyecto 2026\Matricula_Actual(2).xls""")
    print("Tablas encontradas: ", len(Contactos))
    
    hoja = Contactos[0]
    
    print("Filas y columnas: ", hoja.shape)
    
    print(Contactos.head())
    
    for i,fila in hoja.iterrows():
        print(f"Fila:{i}: {fila[0]}")
