from pydantic import BaseModel

class CreateChatRequest(BaseModel):

    otherUserId: str

class ChatRespondsSchema(BaseModel):

    responds:str
    chatId:str    