from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://inventory_user:changeme123@localhost:5432/server_inventory"
    SECRET_KEY: str = "supersecretkey_change_in_production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480
    ENVIRONMENT: str = "production"

    class Config:
        env_file = ".env"

settings = Settings()
