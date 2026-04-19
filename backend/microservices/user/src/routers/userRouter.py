from fastapi import (
    APIRouter,
    Depends,
    status,
    HTTPException,
    Body
)
from src.config.redis import get_redis
from src.config.db import get_db
from src.controllers.userController import loginUser, verifyUser
from typing import Annotated, Optional
from src.schema.schema import LoginRequest, LoginResponds, VerifyOTPResponds, VerifyOTPRequest



user_router=APIRouter()


@user_router.post(
    "/login", 
    response_model=LoginResponds,
    status_code=status.HTTP_200_OK
) 
async def loginRouter(
    request:LoginRequest, 
    redis = Depends(get_redis)
) -> Optional[LoginResponds]:
    usercont=await loginUser(
        request=request,
        redis=redis
    )
    return usercont



@user_router.post(
    "/verify",
    response_model=VerifyOTPResponds,
    status_code=status.HTTP_200_OK
)
async def verifyRouter(
    request:VerifyOTPRequest,
    redis=Depends(get_redis),
    db=Depends(get_db)
) -> Optional[VerifyOTPResponds]:
    verify=await verifyUser(
        request=request,
        redis=redis,
        db=db
    )
    return verify