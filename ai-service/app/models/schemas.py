from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class ReferenceRange(BaseModel):
    low: Optional[float] = None
    high: Optional[float] = None
    raw: str = ""

class MedicalTestResult(BaseModel):
    test_name: str
    normalized_name: str
    value: float
    unit: str = ""
    reference_range: ReferenceRange
    status: str  # NORMAL, HIGH, LOW, CRITICAL
    category: str = "General"
    clinical_significance: Optional[str] = None

class AbnormalityItem(BaseModel):
    test_name: str
    value: float
    unit: str
    reference_range: str
    status: str
    clinical_significance: str

class ShapFeature(BaseModel):
    feature: str
    value: float
    impact: float

class RiskPrediction(BaseModel):
    available: bool
    condition: str = "Metabolic & Diabetes Screening Risk"
    risk_score: Optional[float] = None  # 0 to 100%
    risk_level: Optional[str] = None    # Low, Moderate, Elevated
    model_name: str = "Scikit-Learn Clinical Screening Classifier"
    features_used: List[str] = []
    message: str = ""
    shap_values: List[ShapFeature] = []

class DocumentProcessResponse(BaseModel):
    success: bool
    report_date: Optional[str] = None
    extracted_text: str
    tests: List[MedicalTestResult]
    abnormalities: List[AbnormalityItem]
    summary: str
    risk_prediction: RiskPrediction
    error: Optional[str] = None

class AskQuestionRequest(BaseModel):
    report_id: str
    question: str
    extracted_text: Optional[str] = ""
    tests: Optional[List[dict]] = None

class AskQuestionResponse(BaseModel):
    answer: str
    sources: List[str] = []
    grounded_in_report: bool = False

class ExplainTermRequest(BaseModel):
    test_name: str
    value: Optional[float] = None
    unit: Optional[str] = ""
    status: Optional[str] = "NORMAL"

class ExplainTermResponse(BaseModel):
    test_name: str
    explanation: str
    general_context: str
    dietary_lifestyle_context: str
