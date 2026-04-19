import aio_pika
from fastapi_mail import ConnectionConfig, FastMail, MessageSchema
from src.config import settings
import aio_pika
import json
from fastapi_mail import FastMail, MessageSchema


connection = None
channel = None



conf = ConnectionConfig(
    MAIL_USERNAME=settings.MAIL_USERNAME,
    MAIL_PASSWORD=settings.MAIL_PASSWORD,
    MAIL_FROM=settings.MAIL_FROM,
    MAIL_PORT=587,
    MAIL_SERVER="smtp.gmail.com",
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False
)

async def send_email(email: str, otp: str):

    message = MessageSchema(
        subject="Your OTP Code",
        recipients=[email],
        body=f"""
    <html>
        <body style="font-family: Arial; background:#f4f4f4; padding:20px;">
            <div style="max-width:500px; margin:auto; background:white; padding:20px; border-radius:8px;">
                
                <h2 style="color:#333;">Chat App Login</h2>

                <p>Your One Time Password is:</p>

                <h1 style="
                    background:#2563eb;
                    color:white;
                    padding:10px;
                    border-radius:6px;
                    text-align:center;
                    letter-spacing:4px;
                ">
                    {otp}
                </h1>

                <p>This OTP is valid for <b>5 minutes</b>.</p>

                <p style="color:gray;font-size:12px;">
                    If you didn't request this, please ignore this email.
                </p>

            </div>
        </body>
    </html>
    """,
        subtype="html"
    )

    fm = FastMail(conf)
    await fm.send_message(message)


async def process_message(message: aio_pika.IncomingMessage):

    async with message.process():

        data = json.loads(message.body)

        email = data.get("email")
        otp = data.get("otp")

        if not email or not otp:
            print("Invalid message:", data)
            return

        await send_email(email, otp)

        print(f"OTP sent to {email}")


async def startSendOtpConsumer():

    global connection, channel

    try:
        connection = await aio_pika.connect_robust(
            settings.RABBITMQ_URL
        )

        channel = await connection.channel()

        queue_name = "send-otp"

        queue = await channel.declare_queue(queue_name, durable=True)

        await queue.consume(process_message)

        print("Mail Service consumer started listening for OTP emails")

    except Exception as e:
        print(f"Failed to start RabbitMQ consumer: {e}")