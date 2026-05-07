from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):

    MAIL_FROM: str
    SENDGRID_API_KEY: str
    RABBITMQ_URL: str
    ALLOW_ORIGINS: str

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore"
    )

settings = Settings()
