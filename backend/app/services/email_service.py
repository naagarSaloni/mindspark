import os
import requests

# ✅ correct way: env variable name
RESEND_API_KEY = os.getenv("RESEND_API_KEY")


def send_otp_email(receiver_email: str, otp: str):
    if not RESEND_API_KEY:
        print("❌ RESEND_API_KEY is missing in environment variables")
        return False

    url = "https://api.resend.com/emails"

    payload = {
        "from": "MindSpark <onboarding@resend.dev>",  # use verified sender
        "to": [receiver_email],
        "subject": "MindSpark OTP Verification",
        "html": f"""
        <div style="font-family: Arial;">
            <h2>MindSpark OTP Verification</h2>
            <p>Your OTP is:</p>
            <h1>{otp}</h1>
            <p>Valid for 5 minutes.</p>
        </div>
        """
    }

    headers = {
        "Authorization": f"Bearer {RESEND_API_KEY}",
        "Content-Type": "application/json"
    }

    try:
        response = requests.post(url, json=payload, headers=headers)

        print("EMAIL STATUS:", response.status_code)
        print("EMAIL RESPONSE:", response.text)

        if response.status_code not in [200, 202]:
            print("❌ Email sending failed")
            return False

        print("✅ OTP EMAIL SENT SUCCESSFULLY")
        return True

    except Exception as e:
        print("❌ EMAIL ERROR:", str(e))
        return False