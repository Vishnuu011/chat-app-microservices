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
    USER_SERVICE: str

    CLOUD_NAME: str
    API_KEY: str
    API_SECRET: str

    model_config = SettingsConfigDict(env_file=".env")



settings = Settings()    