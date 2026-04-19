from fastapi.security import OAuth2PasswordBearer
from fastapi import (
    status,
    HTTPException,
    Depends
)
from src.config.db import get_db
from src.config.config import settings
from jose import JWTError, jwt
from typing import Any

from bson import ObjectId
from jose import jwt, JWTError

oauth_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/verify")


async def isAuth(
    token: str = Depends(oauth_scheme),
    db=Depends(get_db)
):

    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )

        user_id = payload.get("user_id")

        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )

        users = db["users"]

        user = await users.find_one(
            {"_id": ObjectId(user_id)}
        )

        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found"
            )

        user["_id"] = str(user["_id"])

        return user

    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token invalid or expired"
        )