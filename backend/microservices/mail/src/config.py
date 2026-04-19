from pydantic_settings import BaseSettings
from dotenv import load_dotenv
from typing import Optional
import os, sys
from pathlib import Path



load_dotenv(
    Path(__file__).parent.parent.parent / ".env"
)

class Settings(BaseSettings):

    RABBITMQ_URL: str
    MAIL_USERNAME: str
    MAIL_PASSWORD: str
    MAIL_FROM:str
    
    
    class Config:
        env_file = ".env"


settings = Settings()  