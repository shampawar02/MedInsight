import os
from pathlib import Path
from dotenv import load_dotenv

# Base directory for ai-service
BASE_DIR = Path(__file__).resolve().parent.parent

# Load .env files in priority order
load_dotenv(BASE_DIR / ".env")
load_dotenv(BASE_DIR.parent / ".env")
load_dotenv(BASE_DIR.parent / "backend" / ".env")

class Settings:
    HOST: str = os.getenv("AI_SERVICE_HOST", "0.0.0.0")
    PORT: int = int(os.getenv("AI_SERVICE_PORT", "8000"))
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY", "")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    AI_SERVICE_INTERNAL_TOKEN: str = os.getenv("AI_SERVICE_INTERNAL_TOKEN", "")
    TESSERACT_CMD: str = os.getenv("TESSERACT_CMD", "")
    FAISS_INDEX_DIR: Path = BASE_DIR / os.getenv("FAISS_INDEX_DIR", "vector_store")
    MODEL_DIR: Path = BASE_DIR / os.getenv("MODEL_DIR", "ml_models")

    def update_gemini_key(self, key: str):
        self.GEMINI_API_KEY = key.strip()
        os.environ["GEMINI_API_KEY"] = self.GEMINI_API_KEY

settings = Settings()

# Ensure directories exist
settings.FAISS_INDEX_DIR.mkdir(parents=True, exist_ok=True)
settings.MODEL_DIR.mkdir(parents=True, exist_ok=True)
