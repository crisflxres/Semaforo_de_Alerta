from flask import Blueprint, request, jsonify
from .services import obtener_alumnos_por_alerta, obtener_grupos, obtener_resumen_destinatarios

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