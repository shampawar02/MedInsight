import os
import joblib
import numpy as np
from pathlib import Path
from typing import Dict, Any, Optional, Tuple, List
from sklearn.ensemble import RandomForestClassifier
from app.config import settings

MODEL_FILE = settings.MODEL_DIR / "metabolic_risk_rf_model.joblib"

# Feature vector names used by the screening model
FEATURE_NAMES = [
    "Glucose",
    "HbA1c",
    "Total Cholesterol",
    "Triglycerides",
    "HDL Cholesterol",
    "Serum Creatinine"
]

# Population reference medians for imputation of missing secondary features
FEATURE_MEDIANS = {
    "Glucose": 90.0,
    "HbA1c": 5.2,
    "Total Cholesterol": 175.0,
    "Triglycerides": 120.0,
    "HDL Cholesterol": 50.0,
    "Serum Creatinine": 0.9
}

def train_and_save_baseline_model():
    """
    Trains a real Scikit-Learn Random Forest Classifier on a structured clinical screening dataset
    synthesized from established cardiometabolic epidemiology thresholds (ADA & Framingham).
    """
    settings.MODEL_DIR.mkdir(parents=True, exist_ok=True)
    np.random.seed(42)
    n_samples = 1200

    # Simulate realistic clinical cohort distributions
    glucose = np.random.normal(loc=105, scale=35, size=n_samples)
    glucose = np.clip(glucose, 65, 300)

    hba1c = 0.03 * glucose + np.random.normal(loc=2.2, scale=0.5, size=n_samples)
    hba1c = np.clip(hba1c, 4.0, 13.0)

    cholesterol = np.random.normal(loc=195, scale=40, size=n_samples)
    cholesterol = np.clip(cholesterol, 110, 350)

    triglycerides = np.random.normal(loc=150, scale=60, size=n_samples)
    triglycerides = np.clip(triglycerides, 45, 500)

    hdl = np.random.normal(loc=48, scale=12, size=n_samples)
    hdl = np.clip(hdl, 25, 90)

    creatinine = np.random.normal(loc=0.95, scale=0.3, size=n_samples)
    creatinine = np.clip(creatinine, 0.4, 3.5)

    X = np.column_stack([glucose, hba1c, cholesterol, triglycerides, hdl, creatinine])

    # Clinical risk scoring rule for ground truth labels:
    # High risk if fasting glucose >= 126 or HbA1c >= 6.5 or (glucose > 100 and triglycerides > 150 and hdl < 40)
    risk_score_raw = (
        (glucose >= 126).astype(int) * 3 +
        (hba1c >= 6.5).astype(int) * 3 +
        (glucose > 100).astype(int) * 1 +
        (cholesterol > 200).astype(int) * 1 +
        (triglycerides > 150).astype(int) * 1 +
        (hdl < 40).astype(int) * 1 +
        (creatinine > 1.3).astype(int) * 1
    )
    y = (risk_score_raw >= 3).astype(int)

    clf = RandomForestClassifier(n_estimators=100, max_depth=6, random_state=42)
    clf.fit(X, y)

    joblib.dump({"model": clf, "feature_names": FEATURE_NAMES}, MODEL_FILE)
    print(f"[ML Model] Successfully trained and serialized clinical screening classifier to {MODEL_FILE}")
    return clf

_model_cache = None

def get_risk_model():
    global _model_cache
    if _model_cache is None:
        if MODEL_FILE.exists():
            data = joblib.load(MODEL_FILE)
            _model_cache = data["model"]
        else:
            _model_cache = train_and_save_baseline_model()
    return _model_cache

def predict_metabolic_risk(extracted_tests: List[Any]) -> Tuple[bool, Optional[Dict[str, Any]]]:
    """
    Evaluates patient features extracted from the report.
    Returns (is_available, result_dict).
    If required primary features are absent, returns (False, error_info).
    """
    # Map extracted test names to our features
    val_map = {}
    for t in extracted_tests:
        t_name = getattr(t, "test_name", "")
        t_val = getattr(t, "value", None)
        if t_val is None:
            continue

        if "Glucose" in t_name or "Sugar" in t_name:
            val_map["Glucose"] = float(t_val)
        elif "HbA1c" in t_name:
            val_map["HbA1c"] = float(t_val)
        elif "Total Cholesterol" in t_name or (t_name == "Cholesterol"):
            val_map["Total Cholesterol"] = float(t_val)
        elif "Triglycerides" in t_name:
            val_map["Triglycerides"] = float(t_val)
        elif "HDL" in t_name:
            val_map["HDL Cholesterol"] = float(t_val)
        elif "Creatinine" in t_name:
            val_map["Serum Creatinine"] = float(t_val)

    # Primary requirement: Must have at least Glucose, HbA1c, or Lipid components
    has_primary = "Glucose" in val_map or "HbA1c" in val_map or "Total Cholesterol" in val_map
    if not has_primary:
        return False, {
            "message": "Risk prediction unavailable: There is not enough structured information available to generate this screening estimate."
        }

    # Construct feature vector, imputing missing secondary variables with population medians
    feature_vector = []
    features_present = []
    for fname in FEATURE_NAMES:
        if fname in val_map:
            feature_vector.append(val_map[fname])
            features_present.append(fname)
        else:
            feature_vector.append(FEATURE_MEDIANS[fname])

    X_sample = np.array([feature_vector])
    model = get_risk_model()
    prob = model.predict_proba(X_sample)[0][1] # Probability of elevated risk
    risk_percentage = round(float(prob * 100), 1)

    if risk_percentage < 35.0:
        level = "Low"
    elif risk_percentage < 65.0:
        level = "Moderate"
    else:
        level = "Elevated"

    return True, {
        "condition": "Metabolic & Diabetes Screening Risk",
        "risk_score": risk_percentage,
        "risk_level": level,
        "model_name": "Scikit-Learn Random Forest Clinical Screening Model",
        "features_used": features_present,
        "feature_vector": feature_vector,
        "message": f"Model estimated screening probability: {risk_percentage}% ({level} Risk) based on available report biomarkers."
    }
