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
from fastapi import File, UploadFile, Form
from bson import ObjectId
from typing import Optional
from fastapi import HTTPException, status, Depends
from src.middlewares.isAuth import isAuth
from src.config.db import get_db
from src.config.config import settings
import cloudinary.uploader





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



async def sendMessage(
    chatId: str = Form(...),
    text: str | None = Form(None),
    imageFile: UploadFile | None = File(None),
    auth_user: dict = Depends(isAuth),
    db=Depends(get_db)
) -> SendMessageResponseSchema:

    try:

        sender_id = str(auth_user["_id"])

        chats_collection = db["chats"]
        messages_collection = db["messages"]

        chat = await chats_collection.find_one(
            {"_id": ObjectId(chatId)}
        )

        if not chat:
            raise HTTPException(
                status_code=404,
                detail="Chat not found"
            )

        if sender_id not in chat["users"]:
            raise HTTPException(
                status_code=403,
                detail="User not in chat"
            )

        now = datetime.utcnow()

        message_data = {
            "chatId": chatId,
            "sender": sender_id,
            "seen": False,
            "seenAt": None,
            "createdAt": now,
            "updatedAt": now
        }

        # IMAGE MESSAGE
        if imageFile:

            upload = cloudinary.uploader.upload(
                imageFile.file,
                folder="chat-images"
            )

            message_data["image"] = {
                "url": upload["secure_url"],
                "publicId": upload["public_id"]
            }

            message_data["messageType"] = "image"
            message_data["text"] = text or ""

        else:

            if not text:
                raise HTTPException(
                    status_code=400,
                    detail="Text or image required"
                )

            message_data["text"] = text
            message_data["messageType"] = "text"

        result = await messages_collection.insert_one(message_data)

        message_id = str(result.inserted_id)

        latest_text = "image" if imageFile else text

        await chats_collection.update_one(
            {"_id": ObjectId(chatId)},
            {
                "$set": {
                    "latestMessage": {
                        "text": latest_text,
                        "sender": sender_id
                    },
                    "updatedAt": now
                }
            }
        )

        message_schema = MessageSchema(
            id=message_id,
            chatId=chatId,
            sender=sender_id,
            text=message_data.get("text"),
            image=message_data.get("image"),
            messageType=message_data["messageType"],
            seen=False,
            seenAt=None,
            createdAt=now,
            updatedAt=now
        )

        return SendMessageResponseSchema(
            message=message_schema,
            sender=sender_id
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error in sendMessage: {str(e)}"
        )




async def getMessagesByChat(
    chatId: str,
    auth_user: dict = Depends(isAuth),
    db=Depends(get_db)
) -> GetMessagesResponseSchema:

    try:
        user_id = str(auth_user["_id"])

        chats_collection = db["chats"]
        messages_collection = db["messages"]

        # 1️⃣ Get chat
        chat = await chats_collection.find_one(
            {"_id": ObjectId(chatId.chatId)}
        )

        if not chat:
            raise HTTPException(
                status_code=404,
                detail="Chat not found"
            )

        # 2️⃣ Check user in chat
        if user_id not in chat["users"]:
            raise HTTPException(
                status_code=403,
                detail="User not in this chat"
            )

        # 3️⃣ Mark messages as seen
        await messages_collection.update_many(
            {
                "chatId": chatId.chatId,
                "sender": {"$ne": user_id},
                "seen": False
            },
            {
                "$set": {
                    "seen": True,
                    "seenAt": datetime.utcnow()
                }
            }
        )

        # 4️⃣ Get messages
        messages_cursor = messages_collection.find(
            {"chatId": chatId}
        ).sort("createdAt", 1)

        messages = await messages_cursor.to_list(length=None)

        message_items = []

        for msg in messages:
            message_items.append(
                MessageSchema(
                    id=str(msg["_id"]),
                    chatId=msg["chatId"],
                    sender=msg["sender"],
                    text=msg.get("text"),
                    image=msg.get("image"),
                    messageType=msg["messageType"],
                    seen=msg["seen"],
                    seenAt=msg.get("seenAt"),
                    createdAt=msg["createdAt"],
                    updatedAt=msg["updatedAt"]
                )
            )

        # 5️⃣ Get other user
        other_user_id = None
        for uid in chat["users"]:
            if uid != user_id:
                other_user_id = uid
                break

        if not other_user_id:
            raise HTTPException(
                status_code=400,
                detail="No other user found"
            )

        # 6️⃣ Call user service
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{settings.USER_SERVICE}/api/v1/user/{other_user_id}"
            )
            user_data = response.json()

        return GetMessagesResponseSchema(
            messages=message_items,
            user=user_data
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error in getMessagesByChat: {str(e)}"
        )