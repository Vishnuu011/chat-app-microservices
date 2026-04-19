from pydantic import BaseModel, EmailStr, Field
from datetime import datetime, timezone

class UserModel(BaseModel):

    name: str
    email: EmailStr
    created_at:datetime=Field(default_factory=datetime.now)
    updated_at:datetime=Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column_kwargs={
            "onupdate": datetime.now(timezone.utc)
        }
    )