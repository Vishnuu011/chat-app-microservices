import aio_pika
from src.config.config import settings
from typing import Any
import json

connection = None
channel = None

async def connectRabbitmq():

    global connection, channel

    try:
        connection = await aio_pika.connect_robust(
            settings.RABBITMQ_URL
        )

        channel=await connection.channel()

        print("Rabbitmq Connected ✅")

    except Exception as e:
        print(f"Failed to connect rabbitmq: {str(e)}")



async def close_rabbitmq():

    global connection

    if connection:
        await connection.close()
        print("RabbitMQ closed")



def get_channel():
    if channel is None:
        raise Exception("RabbitMQ not connected")

    return channel  

  

async def publishToQueue(queueName: str, message: Any):

    if not channel:
        print("RabbitMQ channel is not initialized")
        return

    # declare queue
    queue = await channel.declare_queue(queueName, durable=True)

    # convert message to bytes
    body = json.dumps(message).encode()

    # publish message
    await channel.default_exchange.publish(
        aio_pika.Message(body=body),
        routing_key=queue.name
    )

    print("Message sent to queue") 