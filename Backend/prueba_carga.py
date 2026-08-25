"""
Prueba de carga simple para el Semaforo de Alerta Academica.

Dispara N peticiones concurrentes contra tu servidor REAL (Render),
no contra localhost, para simular varios usuarios usando el sistema
al mismo tiempo.

Uso:
    pip install requests
    python prueba_carga.py
"""

import time
import statistics
from concurrent.futures import ThreadPoolExecutor, as_completed

import requests

# ---------------------------------------------------------------------------
# CONFIGURACION - ajusta esto segun lo que quieras probar
# ---------------------------------------------------------------------------

BASE_URL = "https://semaforo-de-alerta-f2kf.onrender.com"

# Puedes agregar o quitar rutas. method='GET' no necesita body.
# method='DELETE'/'POST'/'PUT' se dejan comentados por defecto porque
# SI modifican datos de verdad - solo actívalos si estás en un ambiente
# donde te da igual el efecto (o usa una BD de prueba).
ENDPOINTS = [
    {"method": "GET", "path": "/api/alumnos"},
    # {"method": "GET", "path": "/calificaciones/24413070030132"},
    # {"method": "GET", "path": "/observaciones/24413070030132"},
]

NUM_USUARIOS_SIMULTANEOS = 20   # cuantas peticiones "al mismo tiempo"
TIMEOUT_SEGUNDOS = 30            # despues de esto, se cuenta como fallo


# ---------------------------------------------------------------------------
# LOGICA DE LA PRUEBA - normalmente no necesitas tocar esto
# ---------------------------------------------------------------------------

def hacer_peticion(endpoint):
    url = BASE_URL + endpoint["path"]
    metodo = endpoint["method"]

    inicio = time.perf_counter()
    try:
        resp = requests.request(metodo, url, timeout=TIMEOUT_SEGUNDOS)
        duracion = time.perf_counter() - inicio
        return {
            "ok": resp.ok,
            "status": resp.status_code,
            "duracion": duracion,
            "url": url,
        }
    except requests.exceptions.RequestException as e:
        duracion = time.perf_counter() - inicio
        return {
            "ok": False,
            "status": f"ERROR: {e.__class__.__name__}",
            "duracion": duracion,
            "url": url,
        }


def correr_prueba():
    tareas = []
    # Repartimos NUM_USUARIOS_SIMULTANEOS peticiones entre los endpoints definidos
    for i in range(NUM_USUARIOS_SIMULTANEOS):
        endpoint = ENDPOINTS[i % len(ENDPOINTS)]
        tareas.append(endpoint)

    print(f"Disparando {len(tareas)} peticiones simultaneas contra {BASE_URL} ...\n")

    resultados = []
    inicio_total = time.perf_counter()

    with ThreadPoolExecutor(max_workers=NUM_USUARIOS_SIMULTANEOS) as executor:
        futuros = [executor.submit(hacer_peticion, t) for t in tareas]
        for futuro in as_completed(futuros):
            resultados.append(futuro.result())

    duracion_total = time.perf_counter() - inicio_total

    # --- Reporte ---
    exitosas = [r for r in resultados if r["ok"]]
    fallidas = [r for r in resultados if not r["ok"]]
    duraciones = [r["duracion"] for r in resultados]

    print("=" * 60)
    print("RESULTADOS")
    print("=" * 60)
    print(f"Total de peticiones:     {len(resultados)}")
    print(f"Exitosas:                {len(exitosas)}")
    print(f"Fallidas:                {len(fallidas)}")
    print(f"Tiempo total (todas):    {duracion_total:.2f} s")
    print()

    if duraciones:
        print(f"Tiempo por peticion (promedio): {statistics.mean(duraciones):.2f} s")
        print(f"Tiempo por peticion (mediana):  {statistics.median(duraciones):.2f} s")
        print(f"Tiempo minimo:                  {min(duraciones):.2f} s")
        print(f"Tiempo maximo:                  {max(duraciones):.2f} s")

    if fallidas:
        print("\nDetalle de fallidas:")
        for r in fallidas:
            print(f"  - {r['url']} -> {r['status']} ({r['duracion']:.2f}s)")

    print("=" * 60)


if __name__ == "__main__":
    correr_prueba()
