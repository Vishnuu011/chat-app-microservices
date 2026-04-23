from src.models.chatModel import Chat
from src.models.messagesModel import IMessageModel
from typing import Annotated,Any
from bson import ObjectId
from src.schema.schema import (
    ChatRespondsSchema,
    CreateChatRequest,
)
from src.schema.schema import *
import asyncio
import httpx
from bson import ObjectId
from typing import Optional
from fastapi import HTTPException, status, Depends
from src.middlewares.isAuth import isAuth
from src.config.db import get_db
from src.config.config import settings





async def createNewChat(
    data:CreateChatRequest,
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
        now = datetime.utcnow()
        # create new chat
        new_chat = Chat(
            users=[user_id, other_user_id],
            latestMessage=None,
            createdAt=now,
            updatedAt=now
        )

        result = await chats.insert_one(new_chat.model_dump())

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
    


async def getAllChats(
    user: dict = Depends(isAuth),
    db: Any = Depends(get_db)
) -> GetAllChatsResponseSchema:

    try:
        user_id = str(user["_id"])

        chats_collection = db["chats"]
        messages_collection = db["messages"]

        chats_cursor = chats_collection.find(
            {"users": user_id}
        ).sort("updatedat", -1)

        chats = await chats_cursor.to_list(length=None)

        chat_items = []

        for chat in chats:

            other_user_id = None
            for uid in chat["users"]:
                if uid != user_id:
                    other_user_id = uid
                    break

            unseen_count = await messages_collection.count_documents(
                {
                    "chatId": str(chat["_id"]),
                    "sender": {"$ne": user_id},
                    "seen": False
                }
            )

            try:
                async with httpx.AsyncClient() as client:
                    res = await client.get(
                        f"{settings.USER_SERVICE}/api/v1/user/{other_user_id}"
                    )
                    user_data = res.json()
            except Exception:
                user_data = {
                    "_id": other_user_id,
                    "name": "unknown",
                    "email": "",
                    "createdat": "",
                    "updatedat": ""
                }

            chat_items.append(
                ChatItemSchema(
                    user=UserSchema(
                        id=user_data.get("_id"),
                        name=user_data.get("name"),
                        email=user_data.get("email"),
                        createdat=user_data.get("created_at"),
                        updatedat=user_data.get("updated_at")
                    ),
                    chat=ChatSchema(
                        id=str(chat["_id"]),
                        users=chat.get("users", []),
                        createdat=chat.get("createdAt"),
                        updatedat=chat.get("updatedAt"),
                        latestMessage=chat.get("latestMessage"),
                        unseencount=unseen_count
                    )
                )
            )

        return GetAllChatsResponseSchema(chats=chat_items)

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error in getAllChats: {str(e)}"
        )