import aio_pika
from fastapi_mail import ConnectionConfig, FastMail, MessageSchema
from src.config import settings
import aio_pika
import json
from fastapi_mail import FastMail, MessageSchema


connection = None
channel = None


conf = ConnectionConfig(
    MAIL_USERNAME="your_email@gmail.com",
    MAIL_PASSWORD="your_app_password",
    MAIL_FROM="your_email@gmail.com",
    MAIL_PORT=587,
    MAIL_SERVER="smtp.gmail.com",
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False
)

async def send_email(email: str, otp: str):

    message = MessageSchema(
        subject="Your OTP Code",
        recipients=[email],
        body=f"Your OTP code is {otp}",
        subtype="plain"
    )

    fm = FastMail(conf)
    await fm.send_message(message)


async def process_message(message: aio_pika.IncomingMessage):
    
    async with message.process():

        data = json.loads(message.body)

        email = data["email"]
        otp = data["otp"]

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