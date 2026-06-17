import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart


# Load credentials from environment variables (RENDER / LOCAL)
EMAIL_USER = os.getenv("EMAIL_USER")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")


def send_otp_email(receiver_email: str, otp: str) -> bool:
    """
    Sends OTP email using Gmail SMTP (App Password required).
    Returns True if email sent successfully, else False.
    """

    if not EMAIL_USER or not EMAIL_PASSWORD:
        print("❌ EMAIL CONFIG MISSING (EMAIL_USER / EMAIL_PASSWORD)")
        return False

    try:
        # ---------------- EMAIL CONTENT ----------------
        msg = MIMEMultipart()
        msg["From"] = EMAIL_USER
        msg["To"] = receiver_email
        msg["Subject"] = "MindSpark OTP Verification"

        body = f"""
        <html>
            <body style="font-family: Arial, sans-serif;">
                <h2>MindSpark OTP Verification</h2>
                <p>Your One-Time Password (OTP) is:</p>
                <h1 style="color:#2d6cdf;">{otp}</h1>
                <p>This OTP is valid for <b>5 minutes</b>.</p>
                <br/>
                <p>If you did not request this, please ignore this email.</p>
            </body>
        </html>
        """

        msg.attach(MIMEText(body, "html"))

        # ---------------- SMTP SERVER ----------------
        server = smtplib.SMTP("smtp.gmail.com", 587)
        server.ehlo()
        server.starttls()
        server.ehlo()

        # Login using Gmail App Password
        server.login(EMAIL_USER, EMAIL_PASSWORD)

        # Send email
        server.sendmail(EMAIL_USER, receiver_email, msg.as_string())

        server.quit()

        print("✅ OTP EMAIL SENT SUCCESSFULLY TO:", receiver_email)
        return True

    except Exception as e:
        print("❌ EMAIL SENDING FAILED:", str(e))
        return False