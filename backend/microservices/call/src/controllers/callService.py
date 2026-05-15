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
from src.utils.videosdk import (
    create_videosdk_token,
    create_meeting
)



async def startCall(
    data: StartCallRequest,
    user: dict = Depends(isAuth),
    db: Any = Depends(get_db)
) -> Dict[str, Any]:

    caller_id = str(user["_id"])
    receiver_id = data.receiverId

    if caller_id == receiver_id:
        raise HTTPException(
            status_code=400,
            detail="Cannot call yourself"
        )

    calls = db["calls"]

    token = create_videosdk_token()

    meeting_id = await create_meeting(
        token=token
    )

    now = datetime.utcnow()

    call_data = {
        "callerId": caller_id,
        "receiverId": receiver_id,
        "chatId": data.chatId,
        "callType": data.callType,
        "meetingId": meeting_id,
        "token": token,
        "status": "ringing",
        "createdAt": now
    }

    result = await calls.insert_one(
        call_data
    )

    call_id = str(result.inserted_id)

    receiver_socket = get_receiver_socket_id(
        receiver_id
    )

    if receiver_socket:
        await sio.emit(
            "incomingCall",
            {
                "callId": call_id,
                "meetingId": meeting_id,
                "token": token,
                "callerId": caller_id,
                "receiverId": receiver_id,
                "callType": data.callType
            },
            to=receiver_socket
        )

    return {
        "message": "Call started",
        "callId": call_id,
        "meetingId": meeting_id,
        "token": token,
        "callerId": caller_id,
        "receiverId": receiver_id,
        "callType": data.callType,
        "status": "ringing",
        "createdAt": now
    }




async def endCall(
    callId: str,
    user: dict = Depends(isAuth),
    db: Any = Depends(get_db)
) -> EndCallResponse:

    try:
        call_object_id = ObjectId(callId)
    except InvalidId:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid callId"
        )

    calls = db["calls"]
    call = await calls.find_one(
        {"_id": call_object_id}
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

    if call.get("status") == "ended":
        return EndCallResponse(
            message="Call already ended",
            callId=callId,
            duration=call.get("duration", 0)
        )

    now = datetime.utcnow()


    was_ringing = call.get("status") == "ringing"
    final_status = "missed" if was_ringing else "ended"
    duration = 0 if was_ringing else (
        now - call["createdAt"]
    ).total_seconds()

    await calls.update_one(
        {"_id": call_object_id},
        {
            "$set": {
                "status": final_status,
                "endedAt": now,
                "duration": duration
            }
        }
    )

    payload = {
        "callId": callId, 
        "duration": duration
    }

    # ✅ Consistent payload emitted to both parties
    receiver_socket = get_receiver_socket_id(
        call["receiverId"]
    )
    caller_socket = get_receiver_socket_id(
        call["callerId"]
    )

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

    cursor = calls_collection.find({
        "$or": [
            {"callerId": user_id},
            {"receiverId": user_id}
        ]
    }).sort("createdAt", -1)

    calls: list[CallHistoryItem] = []

    async for call in cursor:
        calls.append(CallHistoryItem(
            callId=str(call["_id"]),
            callerId=call["callerId"],
            receiverId=call["receiverId"],
            chatId=call["chatId"],
            callType=call["callType"],
            status=call["status"],
            createdAt=call["createdAt"],
            duration=call.get("duration")
        ))

    return CallHistoryResponse(calls=calls)