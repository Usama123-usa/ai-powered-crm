import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv()

SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
FROM_EMAIL = os.getenv("FROM_EMAIL")
FROM_NAME = os.getenv("FROM_NAME", "Jarrod Brown")


def send_email(to_email: str, subject: str, body: str) -> bool:
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"{FROM_NAME} <{FROM_EMAIL}>"
    msg["To"] = to_email

    html_body = f"""
    <html>
      <body style="font-family: Inter, Arial, sans-serif; color: #1e293b; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="border-left: 4px solid #2563EB; padding-left: 20px; margin-bottom: 24px;">
          <h2 style="color: #2563EB; margin: 0 0 4px 0;">Brown Capital</h2>
          <p style="color: #64748b; margin: 0; font-size: 13px;">Financial Advisory Services</p>
        </div>
        <div style="background: #f8fafc; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
          {body.replace(chr(10), '<br>')}
        </div>
        <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; color: #94a3b8; font-size: 12px;">
          <p>Jarrod Brown | Brown Capital<br>
          Financial Advisory | Wealth Management</p>
        </div>
      </body>
    </html>
    """

    msg.attach(MIMEText(body, "plain"))
    msg.attach(MIMEText(html_body, "html"))

    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.ehlo()
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.sendmail(FROM_EMAIL, to_email, msg.as_string())
        return True
    except Exception as e:
        print(f"Email send error: {e}")
        return False
