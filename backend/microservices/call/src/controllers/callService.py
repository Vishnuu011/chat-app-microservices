from datetime import datetime
from bson import ObjectId
from fastapi import Depends, HTTPException
from typing import Any
from fastapi import status
from bson.errors import InvalidId
from typing import Any, Dict, Optional, List

from src.config.db import get_db
from src.middlewares.isAuth import isAuth
from src.schema.callSchema import (
    StartCallRequest,
    CallResponse,
    EndCallResponse,
    CallHistoryItem,
    CallHistoryResponse
)
from src.socket.socket_app import sio, get_receiver_socket_id



async def startCall(
    data: StartCallRequest,
    user: dict = Depends(isAuth),
    db: Any = Depends(get_db)
) -> Optional[CallResponse]:

    caller_id = str(user["_id"])

    # Prevent calling yourself
    if caller_id == data.receiverId:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot call yourself"
        )

    # Validate chatId
    try:
        chat_object_id = ObjectId(data.chatId)
    except InvalidId:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid chatId"
        )

    chats = db["chats"]

    chat = await chats.find_one(
        {
            "_id": chat_object_id,
            "users": {
                "$all": [
                    caller_id, 
                    data.receiverId
                ]
            }
        }
    )

    if not chat:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat not found or users not in chat"
        )

    calls_collection = db["calls"]

    now = datetime.utcnow()

    call_data = {
        "callerId": caller_id,
        "receiverId": data.receiverId,
        "chatId": data.chatId,
        "callType": data.callType,
        "status": "ringing",
        "createdAt": now
    }

    result = await calls_collection.insert_one(
        call_data
    )

    call_id = str(result.inserted_id)

    receiver_socket = get_receiver_socket_id(
        data.receiverId
    )

    # Notify receiver
    if receiver_socket:

        await sio.emit(
            "incomingCall",
            {
                "callId": call_id,
                "callerId": caller_id,
                "chatId": data.chatId,
                "callType": data.callType
            },
            room=receiver_socket
        )

    return CallResponse(
        callId=call_id,
        callerId=caller_id,
        receiverId=data.receiverId,
        chatId=data.chatId,
        callType=data.callType,
        status="ringing",
        createdAt=now,
        duration=None
    )



async def endCall(
    callId: str,
    user: dict = Depends(isAuth),
    db: Any = Depends(get_db)
) -> Optional[EndCallResponse]:

    try:
        call_object_id = ObjectId(callId)
    except InvalidId:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid callId"
        )

    calls = db["calls"]

    call = await calls.find_one(
        {
            "_id": call_object_id
        }
    )

    if not call:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Call not found"
        )

    user_id = str(user["_id"])

    if user_id not in [
        call["callerId"], 
        call["receiverId"]
    ]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not allowed to end this call"
        )

    now = datetime.utcnow()

    duration = (
        now - call["createdAt"]
    ).total_seconds()

    await calls.update_one(
        {
            "_id": call_object_id
        },
        {
            "$set": {
                "status": "ended",
                "endedAt": now,
                "duration": duration
            }
        }
    )

    receiver_socket = get_receiver_socket_id(
        call["receiverId"]
    )
    caller_socket = get_receiver_socket_id(
        call["callerId"]
    )

    payload = {
        "callId": callId,
        "duration": duration
    }

    if receiver_socket:

        await sio.emit(
            "callEnded", 
            payload, 
            room=receiver_socket
        )

    if caller_socket:

        await sio.emit(
            "callEnded", 
            payload, 
            room=caller_socket
        )

    return EndCallResponse(
        message="Call ended",
        callId=callId,
        duration=duration
    )



async def getAllCalls(
    user: dict = Depends(isAuth),
    db: Any = Depends(get_db)
) -> Optional[CallHistoryResponse]:

    user_id = str(user["_id"])

    calls_collection = db["calls"]

    cursor = calls_collection.find(
        {
            "$or": [
                {
                    "callerId": user_id
                },
                {
                    "receiverId": user_id
                }
            ]
        }
    ).sort("createdAt", -1)

    calls: list[CallHistoryItem] = []

    async for call in cursor:

        calls.append(
            CallHistoryItem(
                callId=str(call["_id"]),
                callerId=call["callerId"],
                receiverId=call["receiverId"],
                chatId=call["chatId"],
                callType=call["callType"],
                status=call["status"],
                createdAt=call["createdAt"],
                duration=call.get("duration")
            )
        )

    return CallHistoryResponse(
        calls=calls
    )