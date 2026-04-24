import fastapi
from typing import(
    Annotated, 
    List, 
    Optional,
    Any
)
from src.controllers.chatController import createNewChat, getAllChats, sendMessage
from src.schema.schema import (
    ChatRespondsSchema,
    CreateChatRequest,
    GetAllChatsResponseSchema,
    SendMessageResponseSchema
)
from src.middlewares.isAuth import isAuth
from src.config.config import settings
from src.config.db import get_db




chat_router=fastapi.APIRouter()




@chat_router.post(
    "/chat/new",
    response_model=ChatRespondsSchema,
    status_code=fastapi.status.HTTP_200_OK,
)
async def CreateNewChatRouter(
    request:CreateChatRequest,
    is_auth:Any=fastapi.Depends(isAuth),
    db:Any=fastapi.Depends(get_db)
) -> Optional[ChatRespondsSchema]:
    
    createnewchat=await createNewChat(
        data=request,
        user=is_auth,
        db=db
    )

    return createnewchat



@chat_router.get(
    "/chat/all",
    response_model=GetAllChatsResponseSchema,
    status_code=fastapi.status.HTTP_200_OK
)
async def getAllChatsRouter(
    is_auth_user:dict=fastapi.Depends(isAuth),
    db:Any=fastapi.Depends(get_db)
) -> Optional[GetAllChatsResponseSchema]:
    
    getAllChat=await getAllChats(
        user=is_auth_user,
        db=db
    )

    return getAllChat




@chat_router.post(
    "/message",
    response_model=SendMessageResponseSchema,
    status_code=fastapi.status.HTTP_201_CREATED,
)
async def sendMessageRouter(
    chatId: str = fastapi.Form(...),
    text: str | None = fastapi.Form(None),
    imageFile: fastapi.UploadFile | None = fastapi.File(None),
    auth_user: dict = fastapi.Depends(isAuth),
    db:Any=fastapi.Depends(get_db)
) -> Optional[SendMessageResponseSchema]:
    
    message=await sendMessage(
        chatId=chatId,
        text=text,
        imageFile=imageFile,
        auth_user=auth_user,
        db=db
    )

    return message

