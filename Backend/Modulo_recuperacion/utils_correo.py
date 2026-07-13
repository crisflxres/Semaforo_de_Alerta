"""
Funciones para el envío del correo de recuperación de contraseña.

MODO ACTUAL: simulado (imprime el link en consola).
Esto permite probar todo el flujo (token -> link -> nueva contraseña)
sin necesitar todavía un correo/SMTP configurado.

Cuando el equipo tenga las credenciales de correo (Gmail con contraseña
de aplicación, SendGrid, etc.), solo hay que reemplazar el contenido
de la función enviar_correo_recuperacion() por el envío real, dejando
la firma (nombre y parámetros) igual para que el resto del código
no se tenga que tocar.
"""

# URL base del frontend donde vive nueva_contrasena.html
# Cambien esto por su dominio/puerto real cuando tengan el front desplegado
FRONTEND_URL_BASE = "http://127.0.0.1:5500/Semaforo_de_Alerta/Frontend/html/nueva_contrasena.html"


def enviar_correo_recuperacion(destinatario, token):
    """
    Envía (o por ahora simula) el correo con el link de recuperación.

    destinatario: correo del usuario (str)
    token: token generado para el reseteo (str)
    """
    link = f"{FRONTEND_URL_BASE}?token={token}"

    # --- MODO SIMULADO (actual) ---
    print("=" * 60)
    print(f"[SIMULACION DE CORREO] Para: {destinatario}")
    print(f"Link de recuperación: {link}")
    print("=" * 60)

    # --- MODO REAL (descomentar y completar cuando tengan SMTP) ---
    #
    # import smtplib
    # from email.mime.text import MIMEText
    #
    # remitente = "tu_correo@gmail.com"
    # password_app = "tu_contraseña_de_aplicacion"
    #
    # cuerpo = f"""
    # Hola,
    #
    # Recibimos una solicitud para restablecer tu contraseña del
    # Semáforo de Alerta Académica.
    #
    # Da clic en el siguiente enlace para continuar (válido por 30 minutos):
    # {link}
    #
    # Si tú no solicitaste esto, ignora este correo.
    # """
    #
    # mensaje = MIMEText(cuerpo)
    # mensaje["Subject"] = "Recuperación de contraseña - Semáforo de Alerta Académica"
    # mensaje["From"] = remitente
    # mensaje["To"] = destinatario
    #
    # with smtplib.SMTP_SSL("smtp.gmail.com", 465) as servidor:
    #     servidor.login(remitente, password_app)
    #     servidor.sendmail(remitente, destinatario, mensaje.as_string())

    return True