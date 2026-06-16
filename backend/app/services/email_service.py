import os
import smtplib
from email.mime.text import MIMEText
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

EMAIL = os.getenv("EMAIL")
APP_PASSWORD = os.getenv("APP_PASSWORD")


def send_otp_email(receiver_email: str, otp: str):
    try:
        subject = "MindSpark Password Reset OTP"

        body = f"""
Hello,

Your MindSpark OTP is:

{otp}

This OTP is valid for 5 minutes.

If you did not request this password reset, ignore this email.

MindSpark Team
"""

        # Create email message
        msg = MIMEText(body)
        msg["Subject"] = subject
        msg["From"] = EMAIL
        msg["To"] = receiver_email

        # Gmail SMTP connection (SSL version - more stable on Render)
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(EMAIL, APP_PASSWORD)
            server.send_message(msg)

        print("OTP email sent successfully")
        return True

    except Exception as e:
        print("Email sending failed:", str(e))
        return False