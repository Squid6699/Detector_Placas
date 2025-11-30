import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.image import MIMEImage
import os
import ssl
import uuid

SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 465   # Usar SMTP_SSL
SMTP_USER = "buenoqueteimporta69@gmail.com"
SMTP_PASSWORD = "ibrq ysau rrrh qlkk"

def enviar_notificacion(email_destino, asunto, mensaje, img_principal=None, evidencias=None):
    try:
        remitente = SMTP_USER
        password = SMTP_PASSWORD

        # Contenedor principal (related)
        msg = MIMEMultipart("related")
        msg["From"] = remitente
        msg["To"] = email_destino
        msg["Subject"] = asunto

        # Contenedor alternative (obligatorio)
        alt = MIMEMultipart("alternative")
        msg.attach(alt)

        # Texto plano (fallback)
        alt.attach(MIMEText("Tu cliente de correo no soporta HTML.", "plain"))

        # HTML que vamos a seguir construyendo
        html_final = mensaje  

        # Imagen principal
        if img_principal and os.path.exists(img_principal):
            with open(img_principal, "rb") as f:
                data = f.read()

            cid = f"imgprincipal-{uuid.uuid4()}"
            img = MIMEImage(data)
            img.add_header("Content-ID", f"<{cid}>")
            img.add_header("Content-Disposition", "inline", filename="foto_principal.jpg")
            msg.attach(img)

            html_final += f"""
                <h3>Imagen principal</h3>
                <img src="cid:{cid}" style="max-width:25%;border-radius:8px;margin-bottom:15px;">
            """

        # Evidencias
        if evidencias:
            html_final += "<h3>Evidencias</h3>"

            for i, path in enumerate(evidencias):
                if os.path.exists(path):
                    with open(path, "rb") as f:
                        data = f.read()

                    cid = f"evidencia-{i}-{uuid.uuid4()}"
                    img = MIMEImage(data)
                    img.add_header("Content-ID", f"<{cid}>")
                    img.add_header("Content-Disposition", "inline", filename=f"evidencia_{i}.jpg")
                    msg.attach(img)

                    html_final += f"""
                        <p><b>Evidencia {i+1}</b></p>
                        <img src="cid:{cid}" style="max-width:25%;border-radius:8px;margin-bottom:20px;">
                    """

        # Agregar el HTML correctamente al multipart/alternative
        alt.attach(MIMEText(html_final, "html"))

        # Enviar correo usando SMTP_SSL
        contexto = ssl.create_default_context()
        with smtplib.SMTP_SSL(SMTP_SERVER, SMTP_PORT, context=contexto) as server:
            server.login(remitente, password)
            server.sendmail(remitente, email_destino, msg.as_string())

        return True

    except Exception as e:
        print("Error enviando correo:", e)
        return False
