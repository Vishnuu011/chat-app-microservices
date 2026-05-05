from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, Literal



class StartCallRequest(BaseModel):

    receiverId: str = Field(
        ...,
        description="User ID of the receiver"
    )
    chatId: str = Field(
        ...,
        description="Chat ID where call belongs"
    )
    callType: Literal[
        "audio",
        "video"
    ] = Field(
        ...,
        description="Type of call"
    )

class CallResponse(BaseModel):

    message: str

    callId: str
    callerId: str
    receiverId: str
    chatId: str
    callType: Literal[
        "audio",
        "video"
    ]
    status: Literal[
        "ringing",
        "accepted",
        "rejected",
        "missed",
        "ended"
    ]
    createdAt: datetime
    duration: Optional[float] = None



class EndCallResponse(BaseModel):

    message: str
    callId: str
    duration: Optional[float] = None



class CallHistoryItem(BaseModel):

    callId: str
    callerId: str
    receiverId: str
    chatId: str
    callType: Literal[
        "audio",
        "video"
    ]
    status: Literal[
        "ringing",
        "accepted",
        "rejected",
        "missed",
        "ended"
    ]
    createdAt: datetime
    duration: Optional[float] = None



class CallHistoryResponse(BaseModel):

    calls: list[CallHistoryItem]