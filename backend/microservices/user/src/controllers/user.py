from src.config.redis import redis_client
from src.config.rabbitmq import publishToQueue
from fastapi import Depends, Body, HTTPException, status
from typing import Annotated
import math
import random

async def loginUser(
    request: Annotated[str, Body()]
):
    global redis_client

    try:
        email = request

        ratelimitkey = f"otp:ratelimit:{email}"

        ratelimit = await redis_client.get(ratelimitkey)

        if ratelimit:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many requests. Please wait before requesting new OTP"
            )

        otp = str(random.randint(100000, 999999))

        otpkey = f"otp:{email}"

        await redis_client.set(otpkey, otp, ex=300)
        await redis_client.set(ratelimitkey, "true", ex=60)

        message = {
            "to": email,
            "subject": "Your OTP Code",
            "body": f"Your OTP is {otp}. It is valid for 5 minutes."
        }

        await publishToQueue("send-otp", message)

        return {
            "message": "OTP sent to your email"
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error in loginUser: {str(e)}"
        )