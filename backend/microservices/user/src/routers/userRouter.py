from fastapi import (
    APIRouter,
    Depends,
    status,
    HTTPException,
    Body
)
from src.config.redis import get_redis
from src.config.db import get_db
from src.controllers.userController import (
    loginUser, 
    verifyUser, 
    myProfile, 
    updateName, 
    getAllUsers, 
    getAUser
)
from src.middlewares.isAuth import isAuth
from typing import Annotated, Optional, Any,Dict
from src.schema.schema import (
    LoginRequest, 
    LoginResponds, 
    VerifyOTPResponds, 
    VerifyOTPRequest, 
    UpdateNameRequest, 
    UpdateNameResponds, 
    GetAUserRequest

)




user_router=APIRouter()




@user_router.post(
    "/login", 
    response_model=LoginResponds,
    status_code=status.HTTP_200_OK
) 
async def loginRouter(
    request:LoginRequest, 
    redis:Any=Depends(get_redis)
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
    redis:Any=Depends(get_redis),
    db:Any=Depends(get_db)
) -> Optional[VerifyOTPResponds]:
    verify=await verifyUser(
        request=request,
        redis=redis,
        db=db
    )
    return verify



@user_router.get(
    "/me",
    status_code=status.HTTP_200_OK
)
async def myProfileRouter(
    is_auth:Any=Depends(isAuth)
) -> Any:
    
    user = await myProfile(
        is_auth=is_auth
    )

    return user



@user_router.post(
    "/update/user",
    response_model=UpdateNameResponds,
    status_code=status.HTTP_200_OK
)
async def UpdateNameRouter(
    request:UpdateNameRequest,
    auth_user:Any=Depends(isAuth),
    db:Any=Depends(get_db)
) -> Optional[UpdateNameResponds]:
    
    updated = await updateName(
        request=request,
        user=auth_user,
        db=db
    )
    return updated



@user_router.get(
    "/user/all",
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(isAuth)]
)
async def getAllUsersRouter(
    db:Any=Depends(get_db)
):
    getalluser=await getAllUsers(
        db=db
    )
    return getalluser



@user_router.get(
    "/user/{id}",
    status_code=status.HTTP_200_OK
) 
async def getAUserRouter(
    id:str,
    db:Any=Depends(get_db)
) -> Any:
    getauser=await getAUser(
        id=id,
        db=db
    )

    return getauser

