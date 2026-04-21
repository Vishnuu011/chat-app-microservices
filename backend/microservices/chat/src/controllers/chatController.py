from src.models.chatModel import Chat
from typing import Annotated,Any
from bson import ObjectId
from src.schema.schema import (
    ChatRespondsSchema,
    CreateChatRequest
)
from typing import Optional
from fastapi import HTTPException, status, Depends
from src.middlewares.isAuth import isAuth
from src.config.db import get_db
from src.config.config import settings





async def createNewChat(
    data: CreateChatRequest,
    user: dict = Depends(isAuth),
    db: Any = Depends(get_db)
) -> Optional[ChatRespondsSchema]:

    try:
        user_id = str(user["_id"])
        other_user_id = data.otherUserId

        if not other_user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Other user id is required"
            )

        chats = db["chats"]

        # check existing chat
        existing_chat = await chats.find_one(
            {
                "users": {
                    "$all": [user_id, other_user_id],
                    "$size": 2
                }
            }
        )

        if existing_chat:
            return ChatRespondsSchema(
                responds="Chat already exists",
                chatId=str(existing_chat["_id"])
            )

        # create new chat
        new_chat = Chat(
            users=[user_id, other_user_id],
            latestMessage=None
        )

        result = await chats.insert_one(new_chat.dict())

        return ChatRespondsSchema(
            responds="New chat created",
            chatId=str(result.inserted_id)
        )

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error in createNewChat: {str(e)}"
        )