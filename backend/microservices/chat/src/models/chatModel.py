from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
class LatestMessage(BaseModel):
    text: str
    sender: str

class Chat(BaseModel):
    users: List[str]
    latestMessage: Optional[LatestMessage] =None
    createdAt:Optional[datetime]
    updatedAt:Optional[datetime]