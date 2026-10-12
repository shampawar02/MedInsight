import os
import re
import secrets
import uuid
from typing import Optional
from fastapi import APIRouter, UploadFile, File, Form, Header, HTTPException, Depends
from app.models.schemas import (
    DocumentProcessResponse,
    AskQuestionRequest,
    AskQuestionResponse,
    ExplainTermRequest,
    ExplainTermResponse,
    RiskPrediction,
    ShapFeature
)
from app.config import settings
from app.ocr.extractor import extract_text
from app.extraction.medical_ner import extract_medical_tests, extract_date_from_text
from app.abnormality.detector import detect_abnormalities
from app.rag.vector_store import build_faiss_index, search_faiss_index, delete_faiss_index
from app.llm.client import generate_report_summary, answer_rag_question, explain_medical_term
from app.ml.risk_model import predict_metabolic_risk
from app.shap.explainer import compute_shap_explanations

async def require_internal_token(x_internal_token: Optional[str] = Header(None)):
    expected_token = settings.AI_SERVICE_INTERNAL_TOKEN
    if not expected_token:
        raise HTTPException(status_code=503, detail="AI service internal token is not configured.")
    if not x_internal_token or not secrets.compare_digest(x_internal_token, expected_token):
        raise HTTPException(status_code=403, detail="Not authorized.")

router = APIRouter(tags=["AI Pipeline"], dependencies=[Depends(require_internal_token)])

@router.delete("/reports/{report_id}/index")
async def delete_report_index(report_id: str):
    """Remove report-specific retrieval data after an owner-authorized backend deletion."""
    if not re.fullmatch(r"[a-fA-F0-9]{24}", report_id):
        raise HTTPException(status_code=400, detail="Invalid report identifier.")
    return {"success": True, "removed_files": delete_faiss_index(report_id)}

@router.post("/process-document", response_model=DocumentProcessResponse)
async def process_document(
    file_path: Optional[str] = Form(None),
    report_id: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None)
):
    """
    Main processing pipeline:
    1. Extract text (PyMuPDF or OCR)
    2. Extract date & tests (Medical NER)
    3. Detect abnormalities
    4. Build FAISS vector index for RAG
    5. Generate AI educational summary
    6. Run ML disease screening model
    7. Compute SHAP explanations
    """
    target_path = None
    temp_created = False
    rep_id = report_id or str(uuid.uuid4())

    try:
        if file_path and os.path.exists(file_path):
            target_path = file_path
        elif file:
            # Save uploaded file temporarily
            ext = os.path.splitext(file.filename)[1]
            temp_path = f"./vector_store/temp_{rep_id}{ext}"
            with open(temp_path, "wb") as f:
                f.write(await file.read())
            target_path = temp_path
            temp_created = True
        else:
            raise HTTPException(status_code=400, detail="Either file_path or file upload must be provided.")

        # 1. Text Extraction
        extracted_text, is_scanned = extract_text(target_path)
        if not extracted_text or len(extracted_text.strip()) == 0:
            extracted_text = "No readable text could be extracted from this document."

        # 2. Date and Clinical Medical Tests Extraction
        report_date = extract_date_from_text(extracted_text)
        tests = extract_medical_tests(extracted_text)

        # 3. Abnormality Detection
        abnormalities = detect_abnormalities(tests)

        # 4. Build FAISS Vector Store Index
        try:
            build_faiss_index(rep_id, extracted_text)
        except Exception as e:
            print(f"[FAISS Error]: {e}")

        # 5. Generate AI Summary
        summary = generate_report_summary(extracted_text, tests, abnormalities)

        # 6. ML Disease Risk Screening Model
        is_risk_avail, risk_data = predict_metabolic_risk(tests)
        shap_features: list[ShapFeature] = []

        if is_risk_avail:
            # 7. SHAP Explanations
            try:
                shap_features = compute_shap_explanations(
                    risk_data["feature_vector"],
                    risk_data["features_used"]
                )
            except Exception as e:
                print(f"[SHAP Error]: {e}")

            risk_pred = RiskPrediction(
                available=True,
                condition=risk_data["condition"],
                risk_score=risk_data["risk_score"],
                risk_level=risk_data["risk_level"],
                model_name=risk_data["model_name"],
                features_used=risk_data["features_used"],
                message=risk_data["message"],
                shap_values=shap_features
            )
        else:
            risk_pred = RiskPrediction(
                available=False,
                message=risk_data.get(
                    "message",
                    "Risk prediction unavailable: There is not enough structured information available to generate this screening estimate."
                ),
                shap_values=[]
            )

        return DocumentProcessResponse(
            success=True,
            report_date=report_date,
            extracted_text=extracted_text,
            tests=tests,
            abnormalities=abnormalities,
            summary=summary,
            risk_prediction=risk_pred
        )

    except Exception as e:
        print(f"[Process Document Error]: {e}")
        return DocumentProcessResponse(
            success=False,
            extracted_text="",
            tests=[],
            abnormalities=[],
            summary="An error occurred during medical report analysis.",
            risk_prediction=RiskPrediction(
                available=False,
                message="Risk prediction unavailable due to processing error."
            ),
            error=str(e)
        )
    finally:
        if temp_created and target_path and os.path.exists(target_path):
            try:
                os.remove(target_path)
            except Exception:
                pass

@router.post("/ask", response_model=AskQuestionResponse)
async def ask_question(req: AskQuestionRequest):
    """
    RAG Query Endpoint:
    1. Embeds question
    2. Retrieves top-K relevant chunks from FAISS
    3. Synthesizes context-grounded response
    """
    try:
        results = search_faiss_index(req.report_id, req.question, top_k=3)
        retrieved_chunks = [chunk for chunk, score in results]
        test_sources = [
            f"{test.get('test_name', 'Test')}: {test.get('value', '')} {test.get('unit', '')} "
            f"(Reference: {test.get('reference_range', '')}; Status: {test.get('status', 'UNKNOWN')})"
            for test in (req.tests or [])
        ]
        text_source = (req.extracted_text or '').strip()
        if text_source.startswith('[NOTICE:'):
            text_source = ''
        sources = retrieved_chunks or test_sources or ([text_source[:1200]] if text_source else [])
        if not sources:
            return AskQuestionResponse(
                answer="I could not find readable report content to support an answer. Please check the uploaded document or ask about a report with extracted results.",
                sources=[],
                grounded_in_report=False
            )

        answer = answer_rag_question(
            req.question,
            retrieved_chunks,
            req.extracted_text or "",
            req.tests or []
        )
        return AskQuestionResponse(
            answer=answer,
            sources=sources,
            grounded_in_report=True
        )
    except Exception as e:
        print(f"[RAG Error]: {e}")
        return AskQuestionResponse(
            answer="We could not retrieve relevant information from this report. Please consult your physician.",
            sources=[],
            grounded_in_report=False
        )

@router.post("/explain-term", response_model=ExplainTermResponse)
async def explain_term(req: ExplainTermRequest):
    """Provides educational explanations for specific lab biomarkers."""
    result = explain_medical_term(
        req.test_name,
        req.value,
        req.unit or "",
        req.status or "NORMAL"
    )
    return ExplainTermResponse(
        test_name=req.test_name,
        explanation=result["explanation"],
        general_context=result["general_context"],
        dietary_lifestyle_context=result["dietary_lifestyle_context"]
    )
