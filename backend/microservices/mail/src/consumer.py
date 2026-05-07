import aio_pika

import json
import httpx
from src.config import settings
import asyncio

connection = None
channel = None





# async def send_email(email: str, otp: str):

#     url = "https://api.sendgrid.com/v3/mail/send"


#     payload = {
#         "personalizations": [
#             {
#                 "to": [{"email": email}],
#                 "subject": "Your OTP Code"
#             }
#         ],
#         "from": {"email": settings.MAIL_FROM},
#         "content": [
#             {
#                 "type": "text/html",
#                 "value": f"""
#                 <h2>Chat App Login</h2>
#                 <p>Your OTP is:</p>
#                 <h1>{otp}</h1>
#                 <p>Valid for 5 minutes</p>
#                 """
#             }
#         ]
#     }

#     headers = {
#         "Authorization": f"Bearer {settings.SENDGRID_API_KEY}",
#         "Content-Type": "application/json"
#     }

#     try:

#         async with httpx.AsyncClient(timeout=30.0) as client:

#             response = await client.post(
#                 url,
#                 json=payload,
#                 headers=headers
#             )

#         print("SendGrid Status:", response.status_code)
#         print("SendGrid Response:", response.text)

#     except Exception as e:
#         print("SendGrid Error:", str(e))

async def send_email(email: str, otp: str):

    url = "https://api.sendgrid.com/v3/mail/send"

    html_template = f"""
    <!DOCTYPE html>
    <html>
    <head>
    <meta charset="UTF-8">
    <title>Your OTP Code</title>
    <style>
    body {{
        margin:0;
        padding:0;
        background:#f4f6fb;
        font-family:Arial, Helvetica, sans-serif;
    }}    

    .container {{
        max-width:520px;
        margin:40px auto;
        background:white;
        border-radius:10px;
        box-shadow:0 5px 25px rgba(0,0,0,0.08);
        overflow:hidden;
    }}    

    .header {{
        background:linear-gradient(135deg,#4f46e5,#2563eb);
        color:white;
        text-align:center;
        padding:30px;
    }}    

    .content {{
        padding:35px;
        text-align:center;
    }}    

    .otp-box {{
        font-size:32px;
        letter-spacing:8px;
        font-weight:bold;
        background:#f1f5f9;
        padding:15px;
        border-radius:8px;
        display:inline-block;
        margin:20px 0;
    }}    

    .footer {{
        background:#f9fafb;
        text-align:center;
        padding:20px;
        font-size:12px;
        color:#9ca3af;
    }}
    </style>
    </head>    

    <body>    

    <div class="container">    

    <div class="header">
    <h1>Chat App</h1>
    <p>Verify Your Login</p>
    </div>    

    <div class="content">    

    <p>Use this OTP to continue login:</p>    

    <div class="otp-box">
    {otp}
    </div>    

    <p>This code will expire in <b>5 minutes</b>.</p>    

    <p style="color:gray;font-size:13px;">
    If you didn't request this code, please ignore this email.
    </p>    

    </div>    

    <div class="footer">
    © 2026 Chat App • Secure Login
    </div>    

    </div>    

    </body>
    </html>
    """

    payload = {
        "personalizations": [
            {
                "to": [{"email": email}],
                "subject": "Your OTP Code"
            }
        ],
        "from": {
            "email": "vishnurrajeev@gmail.com"
        },
        "content": [
            {
                "type": "text/html",
                "value": html_template
            }
        ]
    }

    headers = {
        "Authorization": f"Bearer {settings.SENDGRID_API_KEY}",
        "Content-Type": "application/json"
    }

    async with httpx.AsyncClient() as client:
        response = await client.post(url, json=payload, headers=headers)

    print("SendGrid Status:", response.status_code)
    print("SendGrid Response:", response.text)

async def process_message(message: aio_pika.IncomingMessage):

    async with message.process():

        try:

            data = json.loads(message.body)

            email = data.get("email")
            otp = data.get("otp")

            if not email or not otp:
                print("Invalid message:", data)
                return

            print("Received OTP request:", data)

            await send_email(email, otp)

            print(f"OTP sent to {email}")

        except Exception as e:
            print(f"Error processing message: {str(e)}")


async def startSendOtpConsumer():

    global connection, channel

    try:

        connection = await aio_pika.connect_robust(
            settings.RABBITMQ_URL
        )

        channel = await connection.channel()

        queue_name = "send-otp"

        queue = await channel.declare_queue(
            queue_name,
            durable=True
        )

        await queue.consume(process_message)

        print("Mail Service consumer started listening for OTP emails")

        # keep consumer alive
        await asyncio.Future()

    except Exception as e:
        print(f"Failed to start RabbitMQ consumer: {str(e)}")




     