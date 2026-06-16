import requests

RESEND_API_KEY = "re_PHNuLRKX_Jd26oi6mBxKb2hyz7Biitwo6"


def send_otp_email(receiver_email: str, otp: str):
    try:
        response = requests.post(
            "https://api.resend.com/emails",
            headers={
                "Authorization": f"Bearer {RESEND_API_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "from": "MindSpark <onboarding@resend.dev>",
                "to": receiver_email,
                "subject": "MindSpark OTP",
                "html": f"<h2>Your OTP is: {otp}</h2>"
            }
        )

        print("EMAIL SENT:", response.text)
        return True

    except Exception as e:
        print("EMAIL FAILED:", e)
        return False