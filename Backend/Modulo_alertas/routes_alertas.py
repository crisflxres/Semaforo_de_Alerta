from flask import Blueprint, request, jsonify
from .services import obtener_alumnos_por_alerta, obtener_grupos, obtener_resumen_destinatarios
from .correo_service import enviar_correo, reemplazar_variables

alerta_bp = Blueprint("alertas", __name__, url_prefix="/alertas")

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

        enviado = enviar_correo(correo_prueba, asunto, cuerpo)

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

        enviados = 0
        fallidos = 0
        detalles = []

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

                ok_envio = enviar_correo(correo, asunto, cuerpo)
                enviados += 1 if ok_envio else 0
                fallidos += 0 if ok_envio else 1
                detalles.append({"matricula": alumno["Matricula"], "destinatario": rol, "correo": correo, "ok": ok_envio})

        return jsonify({
            "ok": True,
            "total_alumnos": len(alumnos),
            "enviados": enviados,
            "fallidos": fallidos,
            "detalles": detalles
        })
    except Exception as e:
        return jsonify({"ok": False, "mensaje": str(e)}), 500