from pydantic import BaseModel
from typing import Optional, Literal
from datetime import datetime


class ImageModel(BaseModel):
    urls: str
    publicid: str


class IMessageModel(BaseModel):
    chatId: str
    sender: str
    text: Optional[str] = None
    image: Optional[ImageModel] = None
    messagetype: Literal["text", "image"]
    seen: bool = False
    seenAt: Optional[datetime] = None
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None