import smtplib
import re
import base64
import uuid
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.image import MIMEImage

SMTP_SERVER   = "smtp.gmail.com"
SMTP_PORT     = 587
SMTP_EMAIL    = "vicmanu315623@gmail.com"
SMTP_PASSWORD = "plpyyluikspahcdz"

def enviar_correo(destinatario, asunto, cuerpo_procesado, imagenes):
    """
    Envía un correo a un destinatario.
    Recibe el cuerpo YA procesado (sin base64) y las imágenes ya extraídas,
    y las adjunta como embebidas (Content-ID) para que se vean en Gmail/Outlook.
    Devuelve True si se envió, False si falló.
    """
    try:
        msg = MIMEMultipart("related")
        msg["Subject"] = asunto
        msg["From"]    = SMTP_EMAIL
        msg["To"]      = destinatario

        msg_alt = MIMEMultipart("alternative")
        msg_alt.attach(MIMEText(cuerpo_procesado, "html"))
        msg.attach(msg_alt)

        for cid, tipo, datos in imagenes:
            img = MIMEImage(datos, _subtype=tipo)
            img.add_header("Content-ID", f"<{cid}>")
            img.add_header("Content-Disposition", "inline", filename=f"{cid}.{tipo}")
            msg.attach(img)

        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as servidor:
            servidor.starttls()
            servidor.login(SMTP_EMAIL, SMTP_PASSWORD)
            servidor.sendmail(SMTP_EMAIL, destinatario, msg.as_string())

        return True

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