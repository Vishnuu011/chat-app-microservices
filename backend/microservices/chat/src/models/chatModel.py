from pydantic import BaseModel
from typing import List, Optional

class LatestMessage(BaseModel):
    text: str
    sender: str

class Chat(BaseModel):
    users: List[str]
    latestMessage: Optional[LatestMessage] =None