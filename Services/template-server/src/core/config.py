# Loads environment variables for the service

import os
from dotenv import load_dotenv

load_dotenv()  # Load .env file into system environment

class Settings:
    # Database connection string and environment name
    DATABASE_URL = os.getenv("DATABASE_URL")
    ENV = os.getenv("ENV", "dev")

# Create a global settings object for reuse
settings = Settings()
