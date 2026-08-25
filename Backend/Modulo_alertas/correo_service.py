import os
import re
import base64
import uuid
import requests

SENDINBLUE_API_KEY = os.environ.get("SENDINBLUE_API_KEY")
BREVO_SENDER_EMAIL = "silviabrizet@gmail.com"
BREVO_SENDER_NAME = "Sistema de Alertas CECyTEH"

def enviar_correo(destinatario, asunwto, cuerpo_procesado, imagenes):
    """
    Envía un correo usando la API HTTP de Brevo (ya no usa SMTP,
    porque Render bloquea las conexiones SMTP salientes).
    """
    try:
        payload = {
            "sender": {
                "name": BREVO_SENDER_NAME,
                "email": BREVO_SENDER_EMAIL
            },
            "to": [{"email": destinatario}],
            "subject": asunto,
            "htmlContent": cuerpo_procesado
        }

        if imagenes:
            attachments = []
            for cid, tipo, datos in imagenes:
                attachments.append({
                    "content": base64.b64encode(datos).decode("utf-8"),
                    "name": f"{cid}.{tipo}"
                })
            payload["attachment"] = attachments

        response = requests.post(
            "https://api.brevo.com/v3/smtp/email",
            headers={
                "accept": "application/json",
                "api-key": SENDINBLUE_API_KEY ,
                "content-type": "application/json"
            },
            json=payload,
            timeout=15
        )

        if response.status_code == 201:
            return True
        else:
            print(f"Error Brevo al enviar a {destinatario}: {response.status_code} - {response.text}")
            return False

    except Exception as e:
        print(f"Error al enviar correo a {destinatario}: {e}")
        return False

def extraer_imagenes_base64(cuerpo_html):
    """
    Busca imágenes en formato data:image/xxx;base64,... dentro del HTML,
    las saca, y las reemplaza por referencias cid: para adjuntarlas
    como archivos embebidos en el correo.
    """
    imagenes = []
    patron = re.compile(r'data:image/(\w+);base64,([^"\')]+)')

    def reemplazar(match):
        tipo = match.group(1)
        datos_b64 = match.group(2)
        cid = uuid.uuid4().hex
        datos_binarios = base64.b64decode(datos_b64)
        imagenes.append((cid, tipo, datos_binarios))
        return f"cid:{cid}"

    cuerpo_procesado = patron.sub(reemplazar, cuerpo_html)
    return cuerpo_procesado, imagenes


def reemplazar_variables(texto, alumno):
    """
    Reemplaza variables del tipo {alumno}, {matricula}, etc.
    en el asunto o cuerpo del mensaje.
    """
    return texto \
        .replace("{alumno}",       f"{alumno['nombre']} {alumno['apellidos']}") \
        .replace("{destinatario}", alumno.get("destinatario", "")) \
        .replace("{matricula}",    alumno["matricula"]) \
        .replace("{carrera}",      alumno.get("carrera", "")) \
        .replace("{grupo}",        alumno.get("grupo", "")) \
        .replace("{reprobadas}",   str(alumno.get("materias_reprobadas", 0))) \
        .replace("{pac}",          str(alumno.get("pac", ""))) \
        .replace("{estatus}",      alumno.get("estatus", ""))