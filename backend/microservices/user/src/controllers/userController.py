from src.config.rabbitmq import publishToQueue
from src.config.redis import get_redis
from src.config.db import get_db, db
from src.config.config import settings
from fastapi import Depends, Body, HTTPException, status
from src.schema.schema import LoginRequest, LoginResponds, VerifyOTPRequest, VerifyOTPResponds
from typing import Annotated, Optional
from src.model.User import UserModel
from datetime import datetime, timedelta
from bson import objectid
from jose import JWTError, jwt
import math
import random

async def loginUser(
    request: LoginRequest,
    redis = Depends(get_redis)
) -> Optional[LoginResponds]:
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

        return LoginResponds(
            responds="OTP sent to your email"
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error in loginUser: {str(e)}"
        )


async def verifyUser(
    request: VerifyOTPRequest,
    redis=Depends(get_redis),
    db=Depends(get_db)
) -> Optional[VerifyOTPResponds]:

    try:
        email=request.email
        enteredOtp = request.otp

        if not email or not enteredOtp:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email and OTP required"
            )

        otpkey = f"otp:{email}"

        storedOtp = await redis.get(otpkey)

        if not storedOtp or storedOtp != enteredOtp:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired OTP"
            )

        # delete OTP
        await redis.delete(otpkey)

        users = db["users"]

        user = await users.find_one({"email": email})

        if not user:
            name = email[:8]

            user_data = UserModel(
                name=name,
                email=email
            )

            result = await users.insert_one(user_data.model_dump())

            user_id = str(result.inserted_id)

            user_info = {
                "id": user_id,
                "name": name,
                "email": email
            }

        else:
            user_id = str(user["_id"])

            user_info = {
                "id": user_id,
                "name": user["name"],
                "email": user["email"]
            }

        expire = datetime.utcnow() + timedelta(days=7)

        token = jwt.encode(
            {
                "user_id": user_id,
                "email": email,
                "exp": expire
            },
            settings.SECRET_KEY,
            algorithm=settings.ALGORITHM
        )

        return VerifyOTPResponds(
            responds="User verified successfully",
            userinfo=user_info,
            token=token
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error in verifyUser: {str(e)}"
        )