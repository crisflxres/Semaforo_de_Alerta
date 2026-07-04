import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

SMTP_SERVER   = "smtp.gmail.com"
SMTP_PORT     = 587
SMTP_EMAIL    = "vicmanu315623@gmail.com"
SMTP_PASSWORD = "plpyyluikspahcdz"

def enviar_correo(destinatario, asunto, cuerpo_html):
    """
    Envía un correo a un destinatario.
    Devuelve True si se envió, False si falló.
    """
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = asunto
        msg["From"]    = SMTP_EMAIL
        msg["To"]      = destinatario

        msg.attach(MIMEText(cuerpo_html, "html"))

        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as servidor:
            servidor.starttls()
            servidor.login(SMTP_EMAIL, SMTP_PASSWORD)
            servidor.sendmail(SMTP_EMAIL, destinatario, msg.as_string())

        return True

    except Exception as e:
        print(f"Error al enviar correo a {destinatario}: {e}")
        return False

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