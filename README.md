# MedInsight AI: Intelligent Medical Report Analysis and Health Insight Generation

MedInsight AI is an end-to-end full-stack medical report analysis platform built with React, Node.js, Python FastAPI, MongoDB, RAG, and Machine Learning.

> **Disclaimer:** MedInsight AI provides informational and decision-support insights based on uploaded lab reports. AI explanations and model predictions are NOT a medical diagnosis or replacement for professional medical advice.

---

## Architecture

- **Frontend (`/frontend`)**: React 18, Vite, Tailwind CSS, Recharts, Lucide Icons, Axios.
- **Backend (`/backend`)**: Node.js, Express, MongoDB (Mongoose), JWT authentication, Multer.
- **AI Service (`/ai-service`)**: Python 3.12, FastAPI, PyMuPDF, Pytesseract OCR, FAISS vector store, Sentence-Transformers, Scikit-learn, SHAP.

---

## Getting Started

### 1. Prerequisites
- Node.js (v18+)
- Python (v3.10 - 3.12)
- MongoDB Server running locally or MongoDB Atlas URI

### 2. Backend Setup
```bash
cd backend
cp ../.env.example .env
npm install
npm run dev
```

Before running, replace `AI_SERVICE_INTERNAL_TOKEN` in `backend/.env` with a private random value. On Windows PowerShell, generate one with:
```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
The backend uses this token to authenticate all requests to the AI service, including document processing, report Q&A, and report-index deletion. The AI service rejects pipeline requests when the token is missing or incorrect. Do not commit the configured `.env` file.

### 3. AI Service Setup
```bash
cd ai-service
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
python run.py
```

### 4. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:5173`.
The backend will run at `http://localhost:5000`.
The AI Service will run at `http://localhost:8000`.
