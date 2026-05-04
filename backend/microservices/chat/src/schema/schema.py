from pydantic import BaseModel
from typing import Any, Literal, Optional, List,Dict
from datetime import datetime



class CreateChatRequest(BaseModel):

    otherUserId: str

class ChatRespondsSchema(BaseModel):

    responds:str
    chatId:str  


class UserSchema(BaseModel):
    id: str
    name: str
    email: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class ChatSchema(BaseModel):
    id: str
    users: List[str]
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None
    latestMessage: Optional[Dict] = None
    unseencount: int


class ChatItemSchema(BaseModel):
    user: UserSchema
    chat: ChatSchema


class GetAllChatsResponseSchema(BaseModel):
    chats: List[ChatItemSchema]


class FileSchema(BaseModel):
    url: str
    publicId: str
    fileName: Optional[str] = None
    format: Optional[str] = None
    size: Optional[int] = None


class MessageSchema(BaseModel):
    id: str
    chatId: str
    sender: str
    text: Optional[str] = None

    file: Optional[FileSchema] = None

    messageType: str
    seen: bool
    seenAt: Optional[datetime] = None
    createdAt: datetime
    updatedAt: datetime


class SendMessageResponseSchema(BaseModel):
    message: MessageSchema
    sender: str


class GetMessagesResponseSchema(BaseModel):
    messages: List[MessageSchema]
    user: Dict[str, Any]            


        