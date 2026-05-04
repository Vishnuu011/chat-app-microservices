from src.models.chatModel import Chat

from typing import Annotated,Any
from bson import ObjectId
from datetime import datetime
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
import cloudinary
import src.config.cloudinary

import cloudinary.uploader
from fastapi.encoders import jsonable_encoder

from src.socket.socket_app import (
    get_receiver_socket_id, 
    is_user_in_room, 
    sio
)





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
        ).sort("updatedAt", -1)

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
                    "created_at": "",
                    "updated_at": ""
                }

            chat_items.append(
                ChatItemSchema(
                    user=UserSchema(
                        id=user_data.get("_id"),
                        name=user_data.get("name"),
                        email=user_data.get("email"),
                        created_at=user_data.get("created_at"),
                        updated_at=user_data.get("updated_at")
                    ),
                    chat=ChatSchema(
                        id=str(chat["_id"]),
                        users=chat.get("users", []),
                        createdAt=chat.get("createdAt"),
                        updatedAt=chat.get("updatedAt"),
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
    File: UploadFile | None = File(None),
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
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Chat not found"
            )

        if sender_id not in chat["users"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User not in chat"
            )
        other_user_id = next(
            uid for uid in chat["users"] if uid != sender_id
        )

        receiverSocketId = get_receiver_socket_id(
            str(other_user_id)
        )

        isReceiverInChatRoom = False

        if receiverSocketId:
            isReceiverInChatRoom = is_user_in_room(
                receiverSocketId, 
                chatId
            )

        now = datetime.utcnow()

        message_data = {
            "chatId": chatId,
            "sender": sender_id,
            "seen": isReceiverInChatRoom,
            "seenAt": now if isReceiverInChatRoom else None,
            "createdAt": now,
            "updatedAt": now
        }

        # FILE MESSAGE
        if File:

            content_type = File.content_type or ""

            if "image" in content_type:
                message_type = "image"
            elif "video" in content_type:
                message_type = "video"
            else:
                message_type = "document"

            upload = await asyncio.to_thread(
                cloudinary.uploader.upload,
                File.file,
                folder="chat-files",
                resource_type="auto",
                use_filename=True
            )

            message_data["file"] = {
                "url": upload["secure_url"],
                "publicId": upload["public_id"],
                "fileName": File.filename,
                "format": upload.get("format"),
                "size": upload.get("bytes")
            }

            message_data["messageType"] = message_type
            message_data["text"] = text or ""

        else:

            if not text:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Text or file required"
                )

            message_data["text"] = text
            message_data["messageType"] = "text"

        result=await messages_collection.insert_one(
            message_data
        )

        message_id = str(result.inserted_id)

        latest_text = "file" if File else text

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
            file=message_data.get("file"),
            messageType=message_data["messageType"],
            seen=isReceiverInChatRoom,
            seenAt=now if isReceiverInChatRoom else None,
            createdAt=now,
            updatedAt=now
        )

        # EMIT MESSAGE TO CHAT ROOM
        await sio.emit(
            "newMessage",
            jsonable_encoder(message_schema),
            room=chatId
        )

        # # EMIT DIRECTLY TO RECEIVER
        # if receiverSocketId:
        #     await sio.emit(
        #         "newMessage",
        #         jsonable_encoder(message_schema),
        #         room=receiverSocketId
        #     )

        # # EMIT BACK TO SENDER
        # senderSocketId=get_receiver_socket_id(
        #     sender_id
        # )

        # if senderSocketId:
        #     await sio.emit(
        #         "newMessage",
        #         jsonable_encoder(message_schema),
        #         room=senderSocketId
        #     )

        # MESSAGE SEEN EVENT
        if isReceiverInChatRoom:

            await sio.emit(
                "messageSeen",
                {
                    "chatId": chatId,
                    "seenBy": str(other_user_id),
                    "messageId": [message_id]
                },
                room=chatId
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

        #Get chat
        chat = await chats_collection.find_one(
            {"_id": ObjectId(chatId)}
        )

        if not chat:
            raise HTTPException(
                status_code=404,
                detail="Chat not found"
            )

        # Check user in chat
        if user_id not in chat["users"]:
            raise HTTPException(
                status_code=403,
                detail="User not in this chat"
            )

        # Find unseen messages
        messages_to_mark_seen = await messages_collection.find(
            {
                "chatId": chatId,
                "sender": {"$ne": user_id},
                "seen": False
            }
        ).to_list(length=None)

        message_ids = [str(m["_id"]) for m in messages_to_mark_seen]

        # Mark messages as seen
        if message_ids:

            await messages_collection.update_many(
                {
                    "_id": {
                        "$in": [ObjectId(mid) for mid in message_ids]
                    }
                },
                {
                    "$set": {
                        "seen": True,
                        "seenAt": datetime.utcnow()
                    }
                }
            )

        # Get messages
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
                    file=msg.get("file"),
                    messageType=msg["messageType"],
                    seen=msg["seen"],
                    seenAt=msg.get("seenAt"),
                    createdAt=msg["createdAt"],
                    updatedAt=msg["updatedAt"]
                )
            )

        # Get other user
        other_user_id = None

        for uid in chat["users"]:
            if uid != user_id:
                other_user_id = uid
                break

        if not other_user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No other user found"
            )

        # Fetch other user details
        async with httpx.AsyncClient() as client:

            response = await client.get(
                f"{settings.USER_SERVICE}/api/v1/user/{other_user_id}"
            )

            user_data = response.json()

        # SOCKET: notify sender messages are seen
        if message_ids:

            otherUserSocketId = get_receiver_socket_id(
                str(other_user_id)
            )

            if otherUserSocketId:

                await sio.emit(
                    "messageSeen",
                    {
                        "chatId": chatId,
                        "seenBy": user_id,
                        "messageId": message_ids
                    },
                    room=otherUserSocketId
                )

        return GetMessagesResponseSchema(
            messages=message_items,
            user=user_data
        )

    except Exception as e:

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error in getMessagesByChat: {str(e)}"
        )