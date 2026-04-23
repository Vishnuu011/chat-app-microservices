import fastapi
from typing import Annotated, List, Optional,Any
from src.controllers.chatController import createNewChat
from src.schema.schema import (
    ChatRespondsSchema,
    CreateChatRequest
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

