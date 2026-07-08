from functools import wraps
from flask import request, jsonify

def requiere_rol(*roles_permitidos):
    """
    Decorador para proteger rutas según el rol del usuario.
    Uso: @requiere_rol(1)        -> solo admin
         @requiere_rol(1, 2)     -> admin y docente
    """
    def decorador(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            id_rol = request.headers.get('X-Id-Rol')

            if not id_rol:
                return jsonify({
                    "success": False,
                    "message": "No se especificó el rol del usuario."
                }), 401

            try:
                id_rol = int(id_rol)
            except ValueError:
                return jsonify({
                    "success": False,
                    "message": "Rol inválido."
                }), 400

            if id_rol not in roles_permitidos:
                return jsonify({
                    "success": False,
                    "message": "No tienes permisos para realizar esta acción."
                }), 403

            return f(*args, **kwargs)
        return wrapper
    return decorador