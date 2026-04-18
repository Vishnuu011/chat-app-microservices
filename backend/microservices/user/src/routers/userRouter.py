from fastapi import (
    APIRouter,
    Depends,
    status,
    HTTPException,
    Body
)
from src.config.redis import get_redis, redis_client
from src.controllers.user import loginUser
from typing import Annotated
from src.schema.schema import LoginRequest



user_router=APIRouter()

@user_router.post("/login") 
async def loginRouter(request:LoginRequest, redis = Depends(get_redis)):
    return await loginUser(request=request,redis=redis)