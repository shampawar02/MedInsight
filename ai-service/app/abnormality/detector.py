from typing import List
from app.models.schemas import MedicalTestResult, AbnormalityItem

def detect_abnormalities(tests: List[MedicalTestResult]) -> List[AbnormalityItem]:
    """
    Filters tests that are outside normal clinical bounds and provides
    educational context on what the deviation signifies.
    """
    abnormalities: List[AbnormalityItem] = []

    for t in tests:
        if t.status in ["LOW", "HIGH", "CRITICAL"]:
            # Compose clear educational significance
            if t.status == "HIGH":
                note = f"{t.test_name} is elevated above the reference upper threshold ({t.reference_range.raw} {t.unit})."
            elif t.status == "LOW":
                note = f"{t.test_name} is below the reference lower threshold ({t.reference_range.raw} {t.unit})."
            else:
                note = f"CRITICAL: {t.test_name} deviates significantly from expected thresholds and requires clinical review."

            if t.clinical_significance:
                note += f" Context: {t.clinical_significance}"

            abnormalities.append(
                AbnormalityItem(
                    test_name=t.test_name,
                    value=t.value,
                    unit=t.unit,
                    reference_range=t.reference_range.raw,
                    status=t.status,
                    clinical_significance=note
                )
            )

    return abnormalities
