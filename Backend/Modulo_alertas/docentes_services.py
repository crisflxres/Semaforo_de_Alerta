"""
Lógica EXCLUSIVA para el botón "Docentes" del panel de alertas.

A diferencia de alumnos/tutores (que reciben 1 correo por alumno),
el docente debe recibir 1 SOLO correo, con el resumen de TODOS los
alumnos que le corresponden en el nivel de alerta elegido.

grupo_id es OPCIONAL:
- Si se manda, el resumen es solo de ese grupo.
- Si no se manda, el resumen junta a todos los alumnos del docente
  en TODOS los grupos donde da clase (por eso se agrega la columna
  "Grupo" en la tabla del correo, para diferenciar de dónde es cada alumno).

Por eso vive en su propio archivo, con sus propias funciones,
sin tocar la lógica de /alertas/enviar.
"""

from collections import defaultdict
from datetime import datetime
from zoneinfo import ZoneInfo

from .services import obtener_alumnos_por_alerta
from .correo_service import enviar_correo, extraer_imagenes_base64
from conexion_db import obtener_conexion

ZONA_MX = ZoneInfo("America/Mexico_City")


def obtener_alumnos_para_docentes(nivel, grupo_id=None):
    """
    Trae los alumnos de un nivel de alerta.
    Si grupo_id viene, filtra solo ese grupo; si no, regresa todos.
    """
    alumnos = obtener_alumnos_por_alerta(nivel)
    if grupo_id:
        alumnos = [a for a in alumnos if str(a.get("Id_Grupo")) == str(grupo_id)]
    return alumnos


def _agrupar_por_docente(alumnos):
    """
    Agrupa la lista de alumnos por correo de docente.
    Los alumnos sin docente asignado (Correo_Docente vacío) se ignoran.
    """
    grupos_por_docente = defaultdict(list)
    for alumno in alumnos:
        correo_docente = alumno.get("Correo_Docente")
        if correo_docente:
            grupos_por_docente[correo_docente].append(alumno)
    return grupos_por_docente


def _fila_tabla(alumno):
    return f"""
        <tr>
            <td style="padding:8px;border:1px solid #e0e0e0;">{alumno['Matricula']}</td>
            <td style="padding:8px;border:1px solid #e0e0e0;">{alumno['Nombre']}</td>
            <td style="padding:8px;border:1px solid #e0e0e0;">{alumno['Apellidos']}</td>
            <td style="padding:8px;border:1px solid #e0e0e0;">{alumno.get('Grupo', '')}</td>
            <td style="padding:8px;border:1px solid #e0e0e0;text-align:center;">{alumno.get('PAC', '')}</td>
            <td style="padding:8px;border:1px solid #e0e0e0;text-align:center;">{alumno.get('Materias_Reprobadas', 0)}</td>
        </tr>"""


def _construir_tabla_html(alumnos):
    filas = "".join(_fila_tabla(a) for a in alumnos)
    return f"""
    <table style="border-collapse:collapse;width:100%;font-size:13px;margin-top:12px;">
        <thead>
            <tr style="background:#f5f5f5;">
                <th style="padding:8px;border:1px solid #e0e0e0;">Matrícula</th>
                <th style="padding:8px;border:1px solid #e0e0e0;">Nombre</th>
                <th style="padding:8px;border:1px solid #e0e0e0;">Apellidos</th>
                <th style="padding:8px;border:1px solid #e0e0e0;">Grupo</th>
                <th style="padding:8px;border:1px solid #e0e0e0;">PAC</th>
                <th style="padding:8px;border:1px solid #e0e0e0;">Materias Reprobadas</th>
            </tr>
        </thead>
        <tbody>{filas}</tbody>
    </table>"""


def construir_correo_docente(nombre_docente, nivel, alumnos):
    """
    Arma asunto y cuerpo del correo resumen.
    Ya no depende de un solo "grupo" porque el docente puede tener
    alumnos de varios grupos si no se filtró por uno específico.
    """
    total = len(alumnos)
    grupos_involucrados = sorted({a.get("Grupo", "") for a in alumnos if a.get("Grupo")})
    texto_grupos = ", ".join(grupos_involucrados) if grupos_involucrados else "sus grupos"

    asunto = f"Resumen de alerta académica - Estatus: {nivel}"
    cuerpo = f"""
    <h2>Resumen de alerta académica</h2>
    <p>Estimado(a) docente {nombre_docente}:</p>
    <p>Le informamos que tiene <strong>{total}</strong> alumno(s) en estatus <strong>{nivel}</strong>
    en {texto_grupos}, según el semáforo de alertas académicas.</p>
    {_construir_tabla_html(alumnos)}
    <p style="margin-top:16px;">Le invitamos a dar seguimiento académico a estos estudiantes.</p>
    <p>Atentamente,<br>Coordinación Académica Institucional CECyTE Hidalgo</p>
    """
    return asunto, cuerpo


def enviar_resumen_docentes(nivel, grupo_id=None):
    """
    Función principal del botón Docentes.
    grupo_id es opcional: si no se manda, cubre TODOS los grupos del docente.
    Envía 1 correo resumen por cada docente encontrado y registra
    el envío en `notificaciones` (una fila por alumno incluido, para mantener
    el historial trazable sin cambiar el esquema de la tabla).
    """
    alumnos = obtener_alumnos_para_docentes(nivel, grupo_id)

    if not alumnos:
        return {"ok": False, "mensaje": "No hay alumnos con ese nivel de alerta",
                "total_alumnos": 0, "enviados": 0, "fallidos": 0, "detalles": []}

    grupos_por_docente = _agrupar_por_docente(alumnos)

    if not grupos_por_docente:
        return {"ok": False, "mensaje": "Ninguno de los alumnos encontrados tiene un docente asignado",
                "total_alumnos": len(alumnos), "enviados": 0, "fallidos": 0, "detalles": []}

    conexion = obtener_conexion()
    cursor = conexion.cursor()

    enviados = 0
    fallidos = 0
    detalles = []
    fecha_local = datetime.now(ZONA_MX).replace(tzinfo=None)

    for correo_docente, alumnos_docente in grupos_por_docente.items():
        nombre_docente = f"{alumnos_docente[0].get('Nombre_Docente', '')} {alumnos_docente[0].get('Apellidos_Docente', '')}".strip()
        asunto, cuerpo = construir_correo_docente(nombre_docente or "Docente", nivel, alumnos_docente)
        cuerpo_procesado, imagenes = extraer_imagenes_base64(cuerpo)

        ok_envio = enviar_correo(correo_docente, asunto, cuerpo_procesado, imagenes)
        enviados += 1 if ok_envio else 0
        fallidos += 0 if ok_envio else 1
        estado = "Enviado" if ok_envio else "Error"

        detalles.append({
            "docente": correo_docente,
            "nombre_docente": nombre_docente,
            "total_alumnos": len(alumnos_docente),
            "ok": ok_envio
        })

        # Una fila de historial por cada alumno cubierto en el resumen,
        # para no requerir Matricula nullable en la tabla notificaciones.
        for alumno in alumnos_docente:
            sql_notif = """INSERT INTO notificaciones
                (Matricula, Destinatario, Asunto, Cuerpo, Estado, Id_Alerta, Fecha_Enviado)
                VALUES (%s, %s, %s, %s, %s, %s, %s)"""
            cursor.execute(sql_notif, (alumno["Matricula"], correo_docente, asunto, cuerpo_procesado, estado, None, fecha_local))

    conexion.commit()
    cursor.close()
    conexion.close()

    return {
        "ok": True,
        "total_alumnos": len(alumnos),
        "total_docentes": len(grupos_por_docente),
        "enviados": enviados,
        "fallidos": fallidos,
        "detalles": detalles
    }