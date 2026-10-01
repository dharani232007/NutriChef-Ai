import os
import random
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.utils import formatdate, make_msgid
from dotenv import load_dotenv

load_dotenv()

SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
SMTP_EMAIL = os.getenv("SMTP_EMAIL", "").strip().strip('"').strip("'")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "").strip().strip('"').strip("'")

def generate_otp() -> str:
    return str(random.randint(100000, 999999))

def send_verification_email(recipient_email: str, otp: str):
    if not SMTP_EMAIL or not SMTP_PASSWORD:
        raise ValueError("SMTP credentials missing from .env")

    # 1. Use 'alternative' to support both text and HTML versions
    msg = MIMEMultipart("alternative")
    
    # 2. Add legitimate headers that spam filters check for
    msg["Subject"] = f"{otp} is your NutriChef verification code"
    msg["From"] = f"NutriChef Assistant <{SMTP_EMAIL}>"
    msg["To"] = recipient_email
    msg["Reply-To"] = SMTP_EMAIL
    msg["Date"] = formatdate(localtime=True)
    msg["Message-ID"] = make_msgid(domain="gmail.com")

    # 3. Plain-text version (Filters check if this exists)
    text_content = f"Your NutriChef verification code is: {otp}\n\nThis code expires in 10 minutes."

    # 4. Clean HTML version
    html_content = f"""<!DOCTYPE html>
    <html>
      <body style="font-family: Arial, sans-serif; background-color: #f7faf8; margin: 0; padding: 24px;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 480px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px;">
          <tr>
            <td>
              <h2 style="color: #2a3c2e; margin-top: 0;">NutriChef Account Verification</h2>
              <p style="color: #4a5568; font-size: 14px; line-height: 1.5;">
                Welcome to NutriChef! Please enter the 6-digit confirmation code below to complete your registration:
              </p>
              <div style="text-align: center; margin: 28px 0;">
                <span style="display: inline-block; font-size: 32px; font-weight: 700; letter-spacing: 6px; color: #2d6a4f; background-color: #ebfbee; padding: 12px 28px; border-radius: 8px;">
                  {otp}
                </span>
              </div>
              <p style="color: #718096; font-size: 12px; margin-bottom: 0;">
                This code expires in 10 minutes. If you did not create this account, you can safely disregard this message.
              </p>
            </td>
          </tr>
        </table>
      </body>
    </html>"""

    # Attach both parts (text first, html second)
    msg.attach(MIMEText(text_content, "plain"))
    msg.attach(MIMEText(html_content, "html"))

    with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
        server.ehlo()
        server.starttls()
        server.ehlo()
        server.login(SMTP_EMAIL, SMTP_PASSWORD)
        server.sendmail(SMTP_EMAIL, recipient_email, msg.as_string())