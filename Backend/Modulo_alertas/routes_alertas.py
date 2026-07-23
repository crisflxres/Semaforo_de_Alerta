import smtplib
from flask import Blueprint, request, jsonify
from .services import obtener_alumnos_por_alerta, obtener_grupos, obtener_resumen_destinatarios
from .correo_service import enviar_correo, reemplazar_variables, extraer_imagenes_base64
from conexion_db import obtener_conexion
from datetime import datetime
from zoneinfo import ZoneInfo
from .scheduler_config import scheduler
from .correo_service import SMTP_SERVER, SMTP_PORT, SMTP_EMAIL, SMTP_PASSWORD

alerta_bp = Blueprint("alertas", __name__, url_prefix="/alertas")

ZONA_MX = ZoneInfo("America/Mexico_City")

@alerta_bp.route("/alumnos", methods=["GET"])
def alumnos_por_alerta():
    nivel = request.args.get("nivel")
    if not nivel:
        return jsonify({"ok": False, "mensaje": "Debe indicar el nivel de alerta"}), 400
    try:
        alumnos = obtener_alumnos_por_alerta(nivel)
        return jsonify({"ok": True, "total": len(alumnos), "datos": alumnos})
    except Exception as e:
        return jsonify({"ok": False, "mensaje": str(e)}), 500

@alerta_bp.route("/grupos", methods=["GET"])
def grupos():
    try:
        grupos = obtener_grupos()
        return jsonify({"ok": True, "datos": grupos})
    except Exception as e:
        return jsonify({"ok": False, "mensaje": str(e)}), 500

@alerta_bp.route("/resumen", methods=["GET"])
def resumen_destinatarios():
    try:
        resumen = obtener_resumen_destinatarios()
        return jsonify({"ok": True, "datos": resumen})
    except Exception as e:
        return jsonify({"ok": False, "mensaje": str(e)}), 500

@alerta_bp.route("/prueba-correo", methods=["POST"])
def prueba_correo():
    nivel = request.args.get("nivel")
    correo_prueba = request.args.get("correo_prueba")

    if not nivel or not correo_prueba:
        return jsonify({"ok": False, "mensaje": "Faltan 'nivel' y 'correo_prueba'"}), 400

    try:
        alumnos = obtener_alumnos_por_alerta(nivel)
        if not alumnos:
            return jsonify({"ok": False, "mensaje": "No hay alumnos con ese nivel de alerta"}), 404

        alumno = alumnos[0]

        asunto = reemplazar_variables("Alerta académica: {alumno}", {
            "nombre": alumno["Nombre"],
            "apellidos": alumno["Apellidos"],
            "matricula": alumno["Matricula"],
            "carrera": alumno["Carrera"],
            "grupo": alumno["Grupo"],
            "materias_reprobadas": alumno["Materias_Reprobadas"],
            "pac": alumno["PAC"],
        })

        cuerpo = f"""
        <h2>Alerta de prueba</h2>
        <p>Alumno: {alumno['Nombre']} {alumno['Apellidos']} ({alumno['Matricula']})</p>
        <p>Grupo: {alumno['Grupo']} - Carrera: {alumno['Carrera']}</p>
        <p>Nivel: {alumno['Nivel_Alerta']} - PAC: {alumno['PAC']} - Reprobadas: {alumno['Materias_Reprobadas']}</p>
        <p><strong>{alumno['Descripcion_Nivel']}</strong></p>
        """

        cuerpo_procesado, imagenes = extraer_imagenes_base64(cuerpo)
        enviado = enviar_correo(correo_prueba, asunto, cuerpo_procesado, imagenes)

        return jsonify({"ok": enviado, "alumno": alumno["Matricula"], "correo_prueba": correo_prueba})
    except Exception as e:
        return jsonify({"ok": False, "mensaje": str(e)}), 500

@alerta_bp.route("/enviar", methods=["POST"])
def enviar_alerta():
    data = request.get_json(silent=True) or {}
    nivel = data.get("nivel")
    destinatarios = data.get("destinatarios", [])
    alcance = data.get("alcance", "todos")
    grupo_id = data.get("grupo_id")
    asunto_plantilla = data.get("asunto", "")
    mensaje_plantilla = data.get("mensaje", "")
    modalidad = data.get("modalidad", "ahora")
    fecha_envio = data.get("fecha_envio")
    hora_envio = data.get("hora_envio")

    if not nivel:
        return jsonify({"ok": False, "mensaje": "Falta el nivel de alerta"}), 400
    if not destinatarios:
        return jsonify({"ok": False, "mensaje": "Selecciona al menos un destinatario"}), 400
    if not asunto_plantilla or not mensaje_plantilla:
        return jsonify({"ok": False, "mensaje": "Falta asunto o mensaje"}), 400

    try:
        alumnos = obtener_alumnos_por_alerta(nivel)

        if alcance == "especifico" and grupo_id:
            alumnos = [a for a in alumnos if str(a.get("Id_Grupo")) == str(grupo_id)]

        if not alumnos:
            return jsonify({"ok": False, "mensaje": "No hay alumnos que coincidan con los filtros"}), 404
        
        def proceso_envio():
            conexion = obtener_conexion()
            cursor = conexion.cursor()

            enviados = 0
            fallidos = 0
            detalles = []

            with smtplib.SMTP_SSL(SMTP_SERVER, SMTP_PORT) as servidor:
                servidor.login(SMTP_EMAIL, SMTP_PASSWORD)

                for alumno in alumnos:
                    destinos = []
                    if "alumnos" in destinatarios and alumno.get("Email"):
                        destinos.append(("Alumno", alumno["Email"]))
                    if "tutores" in destinatarios and alumno.get("Correo_Tutor"):
                        destinos.append(("Tutor", alumno["Correo_Tutor"]))
                    if "docentes" in destinatarios and alumno.get("Correo_Docente"):
                        destinos.append(("Docente", alumno["Correo_Docente"]))

                    for rol, correo in destinos:
                        variables = {
                            "destinatario": rol,
                            "nombre": alumno["Nombre"],
                            "apellidos": alumno["Apellidos"],
                            "matricula": alumno["Matricula"],
                            "carrera": alumno["Carrera"],
                            "grupo": alumno["Grupo"],
                            "materias_reprobadas": alumno.get("Materias_Reprobadas", 0),
                            "pac": alumno.get("PAC", ""),
                            "estatus": alumno.get("Nivel_Alerta", ""),
                        }
                        asunto = reemplazar_variables(asunto_plantilla, variables)
                        cuerpo = reemplazar_variables(mensaje_plantilla, variables)
                        cuerpo, imagenes = extraer_imagenes_base64(cuerpo)

                        ok_envio = enviar_correo(servidor, correo, asunto, cuerpo, imagenes)
                        enviados += 1 if ok_envio else 0
                        fallidos += 0 if ok_envio else 1
                        detalles.append({"matricula": alumno["Matricula"], "destinatario": rol, "correo": correo, "ok": ok_envio})

                        estado = "Enviado" if ok_envio else "Error"
                        fecha_local = datetime.now(ZONA_MX).replace(tzinfo=None)

                        sql_notif = """INSERT INTO notificaciones 
                            (Matricula, Destinatario, Asunto, Cuerpo, Estado, Id_Alerta, Fecha_Enviado)
                            VALUES (%s, %s, %s, %s, %s, %s, %s)"""
                        valores_notif = (alumno["Matricula"], correo, asunto, cuerpo, estado, None, fecha_local)
                        cursor.execute(sql_notif, valores_notif)

            conexion.commit()
            cursor.close()
            conexion.close()

            print(f"[Envío ejecutado] Enviados: {enviados}, Fallidos: {fallidos}")
            return enviados, fallidos, detalles

        if modalidad == "programar" and fecha_envio and hora_envio:
            fecha_hora_str = f"{fecha_envio} {hora_envio}"
            fecha_hora_dt = datetime.strptime(fecha_hora_str, "%Y-%m-%d %H:%M")

            scheduler.add_job(proceso_envio, "date", run_date=fecha_hora_dt)

            return jsonify({
                "ok": True,
                "mensaje": f"Envío programado para {fecha_hora_str}",
                "total_alumnos": len(alumnos)
            })
        else:
            enviados, fallidos, detalles = proceso_envio()  
            return jsonify({
                "ok": True,
                "total_alumnos": len(alumnos),
                "enviados": enviados,  
                "fallidos": fallidos    
            })

    except Exception as e:
        return jsonify({"ok": False, "mensaje": str(e)}), 500

@alerta_bp.route("/historial", methods=["GET"])
def historial_notificaciones():
    completo = request.args.get("completo")  # ?completo=1 trae todo, si no, solo 3
    try:
        conexion = obtener_conexion()
        cursor = conexion.cursor(dictionary=True)

        sql = """
            SELECT Id_Notificacion, Matricula, Destinatario, Asunto, Estado, Fecha_Enviado
            FROM notificaciones
            ORDER BY Fecha_Enviado DESC
        """
        if not completo:
            sql += " LIMIT 3"

        cursor.execute(sql)
        filas = cursor.fetchall()
        cursor.close()
        conexion.close()

        for f in filas:
            if f.get("Fecha_Enviado"):
                f["Fecha_Enviado"] = f["Fecha_Enviado"].strftime("%d/%m/%Y %I:%M %p")

        return jsonify({"ok": True, "total": len(filas), "datos": filas})
    except Exception as e:
        return jsonify({"ok": False, "mensaje": str(e)}), 500