from pydantic import BaseModel, EmailStr, Field
from datetime import datetime, timezone
from typing import Optional

class UserModel(BaseModel):

    name: str
    email: EmailStr
    publicKey: Optional[str] = None
    created_at:datetime=Field(default_factory=datetime.now)
    updated_at:datetime=Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column_kwargs={
            "onupdate": datetime.now(timezone.utc)
        }
    )