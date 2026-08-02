"""Funciones para el envío del correo de recuperación de contraseña.
    MODO: envío vía API HTTP de Brevo."""

import os
import sib_api_v3_sdk
from sib_api_v3_sdk.rest import ApiException
from dotenv import load_dotenv

load_dotenv()

FRONTEND_URL_BASE = "https://sema-cecyteh.netlify.app/html/nueva_contrasena.html" #ruta de netlify y carpeta

SENDINBLUE_API_KEY = os.environ.get("SENDINBLUE_API_KEY")
BROVO_SENDER_EMAIL = "semaalert@gmail.com"
BROVO_SENDER_NAME = "Sistema de Alertas CECyTEH"


def enviar_correo_recuperacion(destinatario, token):
    if not SENDINBLUE_API_KEY or not BROVO_SENDER_EMAIL:
        print("[ERROR] Faltan credenciales de Brevo. Revisa tus variables de entorno.")
        return False

    link = f"{FRONTEND_URL_BASE}?token={token}"

    cuerpo_html = f"""
    <p>Hola,</p>
    <p>Recibimos una solicitud para restablecer tu contraseña del Semáforo de Alerta Académica.</p>
    <p><a href="{link}">Da clic aquí para continuar</a> (válido por 30 minutos).</p>
    <p>Si tú no solicitaste esto, ignora este correo.</p>
    """

    configuration = sib_api_v3_sdk.Configuration()
    configuration.api_key['api-key'] = SENDINBLUE_API_KEY
    api_instance = sib_api_v3_sdk.TransactionalEmailsApi(sib_api_v3_sdk.ApiClient(configuration))

    email = sib_api_v3_sdk.SendSmtpEmail(
        to=[{"email": destinatario}],
        sender={"email": BROVO_SENDER_EMAIL, "name": BROVO_SENDER_NAME},
        subject="Recuperación de contraseña - Semáforo de Alerta Académica",
        html_content=cuerpo_html
    )

    try:
        api_instance.send_transac_email(email)
        print(f"[OK] Correo de recuperación enviado a {destinatario}")
        return True
    except ApiException as e:
        print(f"[ERROR] No se pudo enviar el correo a {destinatario}: {e}")
        return False