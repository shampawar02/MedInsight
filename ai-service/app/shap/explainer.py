from typing import List, Dict, Any
import numpy as np
import shap
from app.ml.risk_model import get_risk_model, FEATURE_NAMES
from app.models.schemas import ShapFeature

_tree_explainer = None

def get_explainer():
    global _tree_explainer
    if _tree_explainer is None:
        model = get_risk_model()
        print("[SHAP] Initializing SHAP TreeExplainer for Random Forest model...")
        _tree_explainer = shap.TreeExplainer(model)
    return _tree_explainer

def compute_shap_explanations(feature_vector: List[float], features_present: List[str]) -> List[ShapFeature]:
    """
    Computes real SHAP values for the given feature vector using shap.TreeExplainer.
    Filters and formats the top contributing factors for frontend visualization.
    """
    explainer = get_explainer()
    X_sample = np.array([feature_vector])
    
    # shap_values format can be list of arrays (per class) or 3D array in shap >= 0.40
    shap_vals = explainer.shap_values(X_sample)
    
    if isinstance(shap_vals, list):
        # Class 1 (Elevated risk) attribution
        contribs = shap_vals[1][0]
    elif len(shap_vals.shape) == 3:
        contribs = shap_vals[0, :, 1]
    else:
        contribs = shap_vals[0]

    results: List[ShapFeature] = []
    for name, val, impact in zip(FEATURE_NAMES, feature_vector, contribs):
        # Only return features that were actually present in the patient's report
        # or have significant impact
        if name in features_present:
            results.append(
                ShapFeature(
                    feature=name,
                    value=round(float(val), 2),
                    impact=round(float(impact), 4)
                )
            )

    # Sort features by absolute impact descending
    results.sort(key=lambda x: abs(x.impact), reverse=True)
    return results
