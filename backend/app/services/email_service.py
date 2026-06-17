import requests

RESEND_API_KEY = "re_PHNuLRKX_Jd26oi6mBxKb2hyz7Biitwo6"


def send_otp_email(receiver_email: str, otp: str):
    try:
        url = "https://api.resend.com/emails"

        payload = {
            "from": "MindSpark <onboarding@resend.dev>",
            "to": [receiver_email],
            "subject": "MindSpark OTP Verification",
            "html": f"""
                <div style="font-family: Arial; padding: 10px;">
                    <h2>MindSpark OTP Verification</h2>
                    <p>Your OTP code is:</p>
                    <h1 style="color: #2d6cdf;">{otp}</h1>
                    <p>This OTP is valid for 5 minutes.</p>
                    <br/>
                    <p>If you did not request this, ignore this email.</p>
                </div>
            """
        }

        headers = {
            "Authorization": f"Bearer {RESEND_API_KEY}",
            "Content-Type": "application/json"
        }

        response = requests.post(url, json=payload, headers=headers)

        print("EMAIL STATUS CODE:", response.status_code)
        print("EMAIL RESPONSE:", response.text)

        # IMPORTANT: Resend success is usually 200 OR 202
        if response.status_code not in [200, 202]:
            raise Exception(f"Resend failed: {response.text}")

        print("OTP EMAIL SENT SUCCESSFULLY")
        return True

    except Exception as e:
        print("EMAIL SENDING FAILED:", str(e))
        return False