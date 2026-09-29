import smtplib
import random
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os

SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
SMTP_EMAIL = os.getenv("SMTP_EMAIL") # your email address
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD") # Gmail App Password

def generate_otp() -> str:
    return str(random.randint(100000, 999999))

def send_verification_email(recipient_email: str, otp: str):
    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Verify your RasoiAI Account"
    msg["From"] = f"RasoiAI <{SMTP_EMAIL}>"
    msg["To"] = recipient_email

    html_content = f"""
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; border: 1px solid #4d6b53; border-radius: 16px;">
        <h2 style="color: #2a3c2e; margin-bottom: 8px;">Welcome to RasoiAI!</h2>
        <p style="color: #555; font-size: 14px;">Use the verification code below to verify your email address and activate your account:</p>
        <div style="text-align: center; margin: 24px 0;">
            <span style="display: inline-block; font-size: 28px; font-weight: bold; letter-spacing: 6px; color: #4d6b53; background: #f0f7f2; padding: 12px 24px; border-radius: 12px; border: 1px dashed #4d6b53;">
                {otp}
            </span>
        </div>
        <p style="color: #888; font-size: 12px;">This code expires in 10 minutes. If you did not request this, please ignore this email.</p>
    </div>
    """
    msg.attach(MIMEText(html_content, "html"))

    with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
        server.starttls()
        server.login(SMTP_EMAIL, SMTP_PASSWORD)
        server.sendmail(SMTP_EMAIL, recipient_email, msg.as_string())