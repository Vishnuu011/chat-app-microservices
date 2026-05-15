from pydantic_settings import BaseSettings
from dotenv import load_dotenv
from typing import Optional
import os, sys
from pathlib import Path



from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):

    MONGO_URI: str
    SECRET_KEY: str
    ALGORITHM: str
    VIDEOSDK_API_KEY: str
    VIDEOSDK_SECRET_KEY: str
    # USER_SERVICE: str

    # API_KEY: str
    # API_SECRET: str
    ALLOWED_ORIGINS: Optional[str] = None

    model_config = SettingsConfigDict(env_file=".env")



settings = Settings()    