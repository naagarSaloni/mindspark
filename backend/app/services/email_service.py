import smtplib
from email.mime.text import MIMEText

EMAIL = "mindspark.exam@gmail.com"
PASSWORD = "nopogwjhfygjzqbm"

def send_otp_email(receiver_email: str, otp: str):

    msg = MIMEText(f"Your OTP is {otp}")
    msg["Subject"] = "MindSpark OTP"
    msg["From"] = EMAIL
    msg["To"] = receiver_email

    try:
        server = smtplib.SMTP("smtp.gmail.com", 587)
        server.starttls()
        server.login(EMAIL, PASSWORD)
        server.sendmail(EMAIL, receiver_email, msg.as_string())
        server.quit()

        print("EMAIL SENT SUCCESSFULLY")
        return True

    except Exception as e:
        print("EMAIL ERROR:", e)
        return False