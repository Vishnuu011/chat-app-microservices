from redis.asyncio import Redis
from src.config.config import settings


redis_client: Redis | None = None

async def connectRedis():
    
    global redis_client

    try:
        redis_client=Redis.from_url(
            settings.REDIS_URL,
            decode_responses=True 
        )

        await redis_client.ping()

        print("Redis connected successfully ✅")

    except Exception as e:
        print(f"Filed to connect redis: {str(e)}")


async def close_redis():
    global redis_client

    if redis_client:
        await redis_client.close()
        print("Redis connection closed")


async def get_redis() -> Redis:
    global redis_client
    if redis_client is None:
        raise Exception("Redis not connected")

    return redis_client

