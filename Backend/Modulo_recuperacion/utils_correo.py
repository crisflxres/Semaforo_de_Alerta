"""
Funciones para el envío del correo de recuperación de contraseña.

MODO: envío real vía SMTP (Gmail), leyendo credenciales desde variables
de entorno (archivo .env) en vez de tenerlas escritas en el código.
"""

import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv()  # lee el archivo .env y carga las variables

# URL base del frontend donde vive nueva_contrasena.html
FRONTEND_URL_BASE = "https://semaforo-de-alerta.onrender.com/Semaforo_de_Alerta/Frontend/html/nueva_contrasena.html"

# --- Credenciales de correo (ahora vienen del .env, no están aquí escritas) ---
REMITENTE = os.getenv("CORREO_REMITENTE")
PASSWORD_APP = os.getenv("CORREO_PASSWORD_APP")


def enviar_correo_recuperacion(destinatario, token):
    """
    Envía el correo real con el link de recuperación.

    destinatario: correo del usuario (str)
    token: token generado para el reseteo (str)
    """
    if not REMITENTE or not PASSWORD_APP:
        print("[ERROR] Faltan credenciales de correo. Revisa tu archivo .env")
        return False

    link = f"{FRONTEND_URL_BASE}?token={token}"

    cuerpo = f"""Hola,

Recibimos una solicitud para restablecer tu contraseña del
Semáforo de Alerta Académica.

Da clic en el siguiente enlace para continuar (válido por 30 minutos):
{link}

Si tú no solicitaste esto, ignora este correo.
"""

    mensaje = MIMEMultipart()
    mensaje["Subject"] = "Recuperación de contraseña - Semáforo de Alerta Académica"
    mensaje["From"] = REMITENTE
    mensaje["To"] = destinatario
    mensaje.attach(MIMEText(cuerpo, "plain"))

    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as servidor:
            servidor.login(REMITENTE, PASSWORD_APP)
            servidor.sendmail(REMITENTE, destinatario, mensaje.as_string())
        print(f"[OK] Correo de recuperación enviado a {destinatario}")
        return True
    except Exception as e:
        print(f"[ERROR] No se pudo enviar el correo a {destinatario}: {e}")
        return False