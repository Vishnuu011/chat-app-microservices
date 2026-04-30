from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class Call(BaseModel):
    callerId: str
    receiverId: str
    chatId: str
    callType: str  # audio | video
    status: str  # ringing | accepted | rejected | ended
    createdAt: datetime
    endedAt: Optional[datetime] = None