from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings

app = FastAPI(
    title="MedInsight AI Service",
    description="Python FastAPI service for Medical Report NLP, OCR, FAISS Vector RAG, and ML Disease Risk Screening with SHAP",
    version="1.0.0"
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {
        "service": "MedInsight AI Service",
        "status": "running",
        "version": "1.0.0"
    }

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "ai-service",
        "tesseract_configured": bool(settings.TESSERACT_CMD),
        "gemini_configured": bool(settings.GEMINI_API_KEY)
    }

# Include AI Processing and RAG Pipeline
from app.routes.pipeline import router as pipeline_router
app.include_router(pipeline_router)
