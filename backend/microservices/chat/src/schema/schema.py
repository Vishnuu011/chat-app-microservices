from pydantic import BaseModel
from typing import Literal, Optional, List,Dict
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
    createdat: Optional[datetime] = None
    updatedat: Optional[datetime] = None


class ChatSchema(BaseModel):
    id: str
    users: List[str]
    createdat: Optional[datetime] = None
    updatedat: Optional[datetime] = None
    latestMessage: Optional[Dict] = None
    unseencount: int


class ChatItemSchema(BaseModel):
    user: UserSchema
    chat: ChatSchema


class GetAllChatsResponseSchema(BaseModel):
    chats: List[ChatItemSchema]