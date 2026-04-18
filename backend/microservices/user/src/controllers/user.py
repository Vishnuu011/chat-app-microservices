from src.config.redis import redis_client
from src.config.rabbitmq import publishToQueue
from src.config.redis import get_redis
from fastapi import Depends, Body, HTTPException, status
from src.schema.schema import LoginRequest
from typing import Annotated
import math
import random

async def loginUser(
    request: LoginRequest,
    redis = Depends(get_redis)
):
    try:
        email = request.email

        ratelimitkey = f"otp:ratelimit:{email}"
        ratelimit = await redis.get(ratelimitkey)

        if ratelimit:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many requests. Please wait before requesting new OTP"
            )

        otp = str(random.randint(100000, 999999))

        otpkey = f"otp:{email}"

        await redis.set(otpkey, otp, ex=300)
        await redis.set(ratelimitkey, "true", ex=60)

        message = {
            "email": email,
            "otp": otp
        }

        await publishToQueue("send-otp", message)

        return {"message": "OTP sent to your email"}

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error in loginUser: {str(e)}"
        )