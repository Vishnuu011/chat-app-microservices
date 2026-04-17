from motor.motor_asyncio import AsyncIOMotorClient
from src.config.config import settings

client: AsyncIOMotorClient | None = None
db = None


async def connectDB():
    global client, db

    url = settings.MONGO_URI

    if not url:
        raise Exception(
            "MONGO_URI is not defined in environment variables"
        )

    try:
        client = AsyncIOMotorClient(url)
        db = client["Chatappmicroserviceapp"]

        await client.admin.command("ping")

        print("MongoDB connected successfully")

    except Exception as e:
        print(f"Failed to connect to MongoDB: {str(e)}")


async def closeDB():
    global client

    if client:
        client.close()
        print("MongoDB connection closed")


def get_db():
    if db is None:
        raise Exception("Database not connected")
    return db