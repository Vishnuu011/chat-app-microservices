from pydantic import BaseModel
from typing import List

class LatestMessage(BaseModel):
    text: str
    sender: str

class Chat(BaseModel):
    users: List[str]
    latestMessage: LatestMessage