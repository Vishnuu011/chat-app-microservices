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
) -> Dict[str, Any]:


    caller_id = str(user["_id"])
    receiver_id = data.receiverId

    if caller_id == receiver_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot call yourself"
        )

    try:
        chat_object_id = ObjectId(
            data.chatId
        )
    except InvalidId:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid chatId"
        )

    chats = db["chats"]

    chat = await chats.find_one({
        "_id": chat_object_id,
        "users": {
            "$all": [
                caller_id, 
                receiver_id
            ]
        }
    })

    if not chat:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat not found"
        )

    calls = db["calls"]

    # 🔥 Check existing call
    existing_call = await calls.find_one({
        "callerId": caller_id,
        "receiverId": receiver_id,
        "status": "ringing"
    })

    if existing_call:
        return {
            "message": "Call already in progress",
            "callId": str(existing_call["_id"]),
            "callerId": existing_call["callerId"],
            "receiverId": existing_call["receiverId"],
            "chatId": existing_call["chatId"],
            "callType": existing_call["callType"],
            "status": existing_call["status"],
            "createdAt": existing_call["createdAt"],
            "duration": existing_call.get("duration")
        }


    now = datetime.utcnow()

    call_data = {
        "callerId": caller_id,
        "receiverId": receiver_id,
        "chatId": data.chatId,
        "callType": data.callType,
        "status": "ringing",
        "createdAt": now
    }

    result = await calls.insert_one(
        call_data
    )

    return {
        "message": "Call started",
        "callId": str(result.inserted_id),
        "callerId": caller_id,
        "receiverId": receiver_id,
        "chatId": data.chatId,
        "callType": data.callType,
        "status": "ringing",
        "createdAt": now,
        "duration": None
    }



async def endCall(
    callId: str,
    user: dict = Depends(isAuth),
    db: Any = Depends(get_db)
) -> EndCallResponse:

    

    # 🔹 Validate callId
    try:
        call_object_id = ObjectId(callId)
    except InvalidId:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid callId"
        )

    calls = db["calls"]

    call = await calls.find_one({"_id": call_object_id})

    if not call:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Call not found"
        )

    user_id = str(user["_id"])

    # 🔹 Check permission
    if user_id not in [
        call["callerId"], 
        call["receiverId"]
    ]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not allowed to end this call"
        )

    # 🔥 Prevent ending twice
    if call.get("status") == "ended":
        return EndCallResponse(
            message="Call already ended",
            callId=callId,
            duration=call.get("duration", 0)
        )

    now = datetime.utcnow()

    duration = (
        now - call["createdAt"]
    ).total_seconds()

    # 🔹 Update DB
    await calls.update_one(
        {"_id": call_object_id},
        {
            "$set": {
                "status": "ended",
                "endedAt": now,
                "duration": duration
            }
        }
    )

    # 🔹 Get sockets
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

    
    try:
        if receiver_socket:
            await sio.emit(
                "callEnded", 
                payload, 
                to=receiver_socket
            )

        if caller_socket:
            await sio.emit(
                "callEnded", 
                payload, 
                to=caller_socket
            )

    except Exception as e:
        print("Emit error:", e)

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
                callId=str(
                    call["_id"]
                ),
                callerId=call[
                    "callerId"
                ],
                receiverId=call[
                    "receiverId"
                ],
                chatId=call[
                    "chatId"
                ],
                callType=call[
                    "callType"
                ],
                status=call[
                    "status"
                ],
                createdAt=call[
                    "createdAt"
                ],
                duration=call.get(
                    "duration"
                )
            )
        )

    return CallHistoryResponse(
        calls=calls
    )