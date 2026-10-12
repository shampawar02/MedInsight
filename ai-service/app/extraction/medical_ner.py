import re
from typing import List, Optional, Tuple, Dict, Any
from app.models.schemas import MedicalTestResult, ReferenceRange

# Clinical biomarker definitions with standard aliases, units, and default fallback ranges if not found in report
BIOMARKER_CATALOG = [
    {
        "canonical": "Fasting Blood Glucose",
        "aliases": ["fasting blood sugar", "fasting glucose", "glucose fasting", "fbs", "blood glucose (fasting)"],
        "unit": "mg/dL",
        "default_low": 70.0,
        "default_high": 100.0,
        "critical_low": 50.0,
        "critical_high": 350.0,
        "category": "Metabolic",
        "significance": "Primary marker for glycemic control, prediabetes, and diabetes screening."
    },
    {
        "canonical": "Post Prandial Blood Glucose",
        "aliases": ["post prandial glucose", "ppbs", "pp glucose", "glucose pp", "blood glucose (pp)"],
        "unit": "mg/dL",
        "default_low": 70.0,
        "default_high": 140.0,
        "critical_low": 50.0,
        "critical_high": 400.0,
        "category": "Metabolic",
        "significance": "Evaluates insulin response and glucose clearance after meals."
    },
    {
        "canonical": "Random Blood Glucose",
        "aliases": ["random blood sugar", "rbs", "random glucose", "blood glucose random"],
        "unit": "mg/dL",
        "default_low": 70.0,
        "default_high": 140.0,
        "critical_low": 50.0,
        "critical_high": 400.0,
        "category": "Metabolic",
        "significance": "General glycemic snapshot without fasting requirement."
    },
    {
        "canonical": "HbA1c (Glycated Hemoglobin)",
        "aliases": ["hba1c", "glycated hemoglobin", "glycosylated hemoglobin", "a1c"],
        "unit": "%",
        "default_low": 4.0,
        "default_high": 5.6,
        "critical_low": None,
        "critical_high": 10.0,
        "category": "Metabolic",
        "significance": "Reflects average blood sugar levels over the preceding 2 to 3 months."
    },
    {
        "canonical": "Hemoglobin",
        "aliases": [
            "haemoglobin (hb)", "haemoglobin", "hemoglobin (hb)", "hemoglobin",
            "total haemoglobin", "total hemoglobin", "hgb", "hb count", "hb"
        ],
        "unit": "g/dL",
        "default_low": 12.0,
        "default_high": 16.5,
        "critical_low": 7.0,
        "critical_high": 20.0,
        "category": "Hematology",
        "significance": "Oxygen-carrying protein in red blood cells. Screen for anemia or polycythemia."
    },
    {
        "canonical": "Total Leukocyte Count (WBC)",
        "aliases": [
            "total wbc count", "total wbc", "wbc count", "wbc", "total leukocyte count",
            "total leucocyte count", "white blood cells", "tlc", "leukocyte count", "leucocyte count"
        ],
        "unit": "/uL",
        "default_low": 4000.0,
        "default_high": 11000.0,
        "critical_low": 2000.0,
        "critical_high": 30000.0,
        "category": "Hematology",
        "significance": "Immune system cells. Elevated in infections or inflammation, low in immune suppression."
    },
    {
        "canonical": "Platelet Count",
        "aliases": ["platelet count", "platelets", "platelet", "plt count", "plt"],
        "unit": "/uL",
        "default_low": 150000.0,
        "default_high": 450000.0,
        "critical_low": 40000.0,
        "critical_high": 1000000.0,
        "category": "Hematology",
        "significance": "Blood clotting components. Low values increase bleeding risk; high can cause clotting risks."
    },
    {
        "canonical": "Red Blood Cell Count (RBC)",
        "aliases": [
            "r.b.c. count", "r.b.c count", "rbc count", "total r.b.c. count", "total rbc count",
            "total r.b.c.", "total rbc", "r.b.c.", "rbc", "red blood cells"
        ],
        "unit": "mill/cumm",
        "default_low": 4.5,
        "default_high": 5.5,
        "critical_low": 2.5,
        "critical_high": 7.0,
        "category": "Hematology",
        "significance": "Total volume of oxygen-transporting red cells in circulation."
    },
    {
        "canonical": "Packed Cell Volume (PCV)",
        "aliases": ["packed cell volume (pcv)", "packed cell volume", "pcv", "hematocrit", "hct"],
        "unit": "%",
        "default_low": 35.0,
        "default_high": 47.0,
        "critical_low": 20.0,
        "critical_high": 60.0,
        "category": "Hematology",
        "significance": "Percentage of total blood volume composed of red blood cells. Screen for dehydration and polycythemia."
    },
    {
        "canonical": "Mean Corpuscular Volume (MCV)",
        "aliases": ["mean corpuscular volume (mcv)", "mean corpuscular volume", "mcv"],
        "unit": "fL",
        "default_low": 76.0,
        "default_high": 96.0,
        "critical_low": 65.0,
        "critical_high": 120.0,
        "category": "Hematology",
        "significance": "Average size and volume of red blood cells. Differentiates microcytic from macrocytic anemia."
    },
    {
        "canonical": "Mean Corpuscular Hemoglobin (MCH)",
        "aliases": [
            "mean corpuscular hemoglobin", "mean corpuscular haemoglobin",
            "mean corpuscular", "mch"
        ],
        "unit": "pg",
        "default_low": 27.0,
        "default_high": 34.0,
        "critical_low": 18.0,
        "critical_high": 40.0,
        "category": "Hematology",
        "significance": "Average weight of hemoglobin inside an individual red blood cell."
    },
    {
        "canonical": "Mean Corpuscular Hemoglobin Concentration (MCHC)",
        "aliases": [
            "mean corpuscular hb con.", "mean corpuscular hb con", "mean corpuscular hb conc",
            "mean corpuscular hemoglobin concentration", "mean corpuscular haemoglobin concentration",
            "mchc"
        ],
        "unit": "g/dL",
        "default_low": 32.0,
        "default_high": 36.0,
        "critical_low": 26.0,
        "critical_high": 38.0,
        "category": "Hematology",
        "significance": "Average concentration of hemoglobin in a packed volume of red blood cells."
    },
    {
        "canonical": "Red Cell Distribution Width (RDW)",
        "aliases": ["red cell distribution width", "rdw", "rdw-cv"],
        "unit": "%",
        "default_low": 11.6,
        "default_high": 14.0,
        "critical_low": None,
        "critical_high": 22.0,
        "category": "Hematology",
        "significance": "Measurement of variation in red blood cell volume and size (anisocytosis)."
    },
    {
        "canonical": "Neutrophils",
        "aliases": ["neutrophils", "neutrophil", "segs", "polymorphs"],
        "unit": "%",
        "default_low": 40.0,
        "default_high": 70.0,
        "critical_low": 20.0,
        "critical_high": 90.0,
        "category": "Hematology",
        "significance": "Primary immune defense against acute bacterial infections."
    },
    {
        "canonical": "Lymphocytes",
        "aliases": ["lymphocytes", "lymphocyte", "lymphs"],
        "unit": "%",
        "default_low": 20.0,
        "default_high": 45.0,
        "critical_low": 10.0,
        "critical_high": 70.0,
        "category": "Hematology",
        "significance": "Immune cells vital for viral response and antibody production."
    },
    {
        "canonical": "Eosinophils",
        "aliases": ["eosinophil", "eosinophils", "eos"],
        "unit": "%",
        "default_low": 0.0,
        "default_high": 6.0,
        "critical_low": None,
        "critical_high": 20.0,
        "category": "Hematology",
        "significance": "Immune cells active in allergic reactions and combating parasitic infections."
    },
    {
        "canonical": "Monocytes",
        "aliases": ["monocytes", "monocyte", "monos"],
        "unit": "%",
        "default_low": 0.0,
        "default_high": 8.0,
        "critical_low": None,
        "critical_high": 25.0,
        "category": "Hematology",
        "significance": "Phagocytic white blood cells that clear cellular debris and respond to chronic inflammation."
    },
    {
        "canonical": "Basophils",
        "aliases": ["basophils", "basophil", "basos"],
        "unit": "%",
        "default_low": 0.0,
        "default_high": 1.0,
        "critical_low": None,
        "critical_high": 10.0,
        "category": "Hematology",
        "significance": "Granulocytes involved in inflammatory and allergic histamine release."
    },
    {
        "canonical": "Erythrocyte Sedimentation Rate (ESR)",
        "aliases": ["esr", "erythrocyte sedimentation rate"],
        "unit": "mm/hr",
        "default_low": 0.0,
        "default_high": 20.0,
        "critical_low": None,
        "critical_high": 100.0,
        "category": "Hematology",
        "significance": "General indicator of systemic inflammation."
    },
    {
        "canonical": "Total Cholesterol",
        "aliases": ["total cholesterol", "serum cholesterol", "cholesterol"],
        "unit": "mg/dL",
        "default_low": 125.0,
        "default_high": 200.0,
        "critical_low": None,
        "critical_high": 300.0,
        "category": "Lipid Profile",
        "significance": "Key biomarker for cardiovascular health and lipid metabolism."
    },
    {
        "canonical": "HDL Cholesterol",
        "aliases": ["hdl cholesterol", "high density lipoprotein", "hdl"],
        "unit": "mg/dL",
        "default_low": 40.0,
        "default_high": 60.0,
        "critical_low": 25.0,
        "critical_high": None,
        "category": "Lipid Profile",
        "significance": "Protective 'good' cholesterol; transports excess lipids to the liver."
    },
    {
        "canonical": "LDL Cholesterol",
        "aliases": ["ldl cholesterol", "low density lipoprotein", "ldl"],
        "unit": "mg/dL",
        "default_low": 50.0,
        "default_high": 100.0,
        "critical_low": None,
        "critical_high": 190.0,
        "category": "Lipid Profile",
        "significance": "Atherogenic 'bad' cholesterol; high values associate with arterial plaque buildup."
    },
    {
        "canonical": "Triglycerides",
        "aliases": ["serum triglycerides", "triglyceride", "tg"],
        "unit": "mg/dL",
        "default_low": 50.0,
        "default_high": 150.0,
        "critical_low": None,
        "critical_high": 500.0,
        "category": "Lipid Profile",
        "significance": "Circulating blood fats; elevated levels correlate with metabolic syndrome."
    },
    {
        "canonical": "Serum Creatinine",
        "aliases": ["s. creatinine", "serum creatinine", "creatinine"],
        "unit": "mg/dL",
        "default_low": 0.6,
        "default_high": 1.2,
        "critical_low": None,
        "critical_high": 4.0,
        "category": "Renal Function",
        "significance": "Primary kidney filtration efficiency marker."
    },
    {
        "canonical": "Blood Urea Nitrogen (BUN)",
        "aliases": ["blood urea nitrogen", "bun", "urea"],
        "unit": "mg/dL",
        "default_low": 7.0,
        "default_high": 20.0,
        "critical_low": None,
        "critical_high": 60.0,
        "category": "Renal Function",
        "significance": "Waste product of protein breakdown excreted by kidneys."
    },
    {
        "canonical": "Serum Uric Acid",
        "aliases": ["s. uric acid", "serum uric acid", "uric acid"],
        "unit": "mg/dL",
        "default_low": 3.5,
        "default_high": 7.2,
        "critical_low": None,
        "critical_high": 10.0,
        "category": "Renal Function",
        "significance": "Purine metabolism byproduct; high levels associated with gout and kidney stones."
    },
    {
        "canonical": "Total Bilirubin",
        "aliases": ["s. bilirubin", "bilirubin total", "total bilirubin"],
        "unit": "mg/dL",
        "default_low": 0.2,
        "default_high": 1.2,
        "critical_low": None,
        "critical_high": 5.0,
        "category": "Liver Function",
        "significance": "Breakdown product of hemoglobin processed by the liver; elevated in jaundice."
    },
    {
        "canonical": "SGPT (ALT)",
        "aliases": ["alanine aminotransferase", "sgpt", "alt"],
        "unit": "U/L",
        "default_low": 7.0,
        "default_high": 45.0,
        "critical_low": None,
        "critical_high": 300.0,
        "category": "Liver Function",
        "significance": "Enzyme specific to hepatocytes; elevated in liver stress or inflammation."
    },
    {
        "canonical": "SGOT (AST)",
        "aliases": ["aspartate aminotransferase", "sgot", "ast"],
        "unit": "U/L",
        "default_low": 8.0,
        "default_high": 40.0,
        "critical_low": None,
        "critical_high": 300.0,
        "category": "Liver Function",
        "significance": "Enzyme found in liver, heart, and muscle tissue."
    },
    {
        "canonical": "Serum Potassium",
        "aliases": ["serum k", "potassium", "k+"],
        "unit": "mEq/L",
        "default_low": 3.5,
        "default_high": 5.1,
        "critical_low": 2.8,
        "critical_high": 6.2,
        "category": "Electrolytes",
        "significance": "Crucial electrolyte for cardiac rhythm and neuromuscular nerve conduction."
    },
    {
        "canonical": "Serum Sodium",
        "aliases": ["serum na", "sodium", "na+"],
        "unit": "mEq/L",
        "default_low": 135.0,
        "default_high": 145.0,
        "critical_low": 120.0,
        "critical_high": 155.0,
        "category": "Electrolytes",
        "significance": "Major extracellular electrolyte regulating fluid balance and blood pressure."
    },
    {
        "canonical": "Thyroid Stimulating Hormone (TSH)",
        "aliases": ["thyroid stimulating hormone", "thyrotropin", "tsh"],
        "unit": "uIU/mL",
        "default_low": 0.4,
        "default_high": 4.5,
        "critical_low": 0.05,
        "critical_high": 15.0,
        "category": "Endocrine",
        "significance": "Pituitary hormone controlling thyroid gland metabolism."
    }
]

def clean_ocr_line(line: str) -> str:
    """Corrects common OCR artifacts in medical lab lines."""
    # Normalize OCR spaced numbers: e.g. "1 50000" -> "150000"
    line = re.sub(r'\b(\d)\s+(\d{4,5})\b', r'\1\2', line)
    # Normalize OCR 'ooo' for '000': e.g. "4000-11 ooo" -> "4000-11000"
    line = re.sub(r'(\d+)\s*ooo\b', r'\g<1>000', line, flags=re.IGNORECASE)
    # Normalize OCR 'oo-' for '00-': e.g. "oo- 10" -> "00 - 10"
    line = re.sub(r'\boo\s*-\s*', '00 - ', line, flags=re.IGNORECASE)
    return line

def parse_reference_range(range_str: str) -> Tuple[Optional[float], Optional[float]]:
    """
    Parses strings like '70-100', '70 - 100', '< 200', '> 50', '12.0 to 16.0'.
    """
    if not range_str:
        return None, None

    clean = range_str.strip().replace("–", "-").replace("—", "-")

    # Match interval "low - high" or "low to high"
    interval_match = re.search(r"([0-9]+(?:\.[0-9]+)?)\s*(?:-|to)\s*([0-9]+(?:\.[0-9]+)?)", clean, re.IGNORECASE)
    if interval_match:
        try:
            return float(interval_match.group(1)), float(interval_match.group(2))
        except ValueError:
            pass

    # Match upper limit "< high" or "<= high"
    upper_match = re.search(r"(?:<|<=|less than|up to|upto)\s*([0-9]+(?:\.[0-9]+)?)", clean, re.IGNORECASE)
    if upper_match:
        try:
            return None, float(upper_match.group(1))
        except ValueError:
            pass

    # Match lower limit "> low" or ">= low"
    lower_match = re.search(r"(?:>|>=|greater than)\s*([0-9]+(?:\.[0-9]+)?)", clean, re.IGNORECASE)
    if lower_match:
        try:
            return float(lower_match.group(1)), None
        except ValueError:
            pass

    return None, None

def extract_date_from_text(text: str) -> Optional[str]:
    """Finds date patterns like 16 Sep 2026, 2026-09-16, 16/09/2026."""
    date_patterns = [
        r"\b(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4})\b",
        r"\b(\d{4}-\d{2}-\d{2})\b",
        r"\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\b"
    ]
    for pattern in date_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return match.group(1)
    return None

def extract_medical_tests(text: str) -> List[MedicalTestResult]:
    """
    Scans the extracted report text line by line and with regex patterns
    to identify known medical biomarkers, observed values, units, and reference ranges.
    """
    found_tests: List[MedicalTestResult] = []
    seen_canonical = set()

    raw_lines = [line.strip() for line in text.splitlines() if line.strip()]
    lines = [clean_ocr_line(l) for l in raw_lines]

    for bio in BIOMARKER_CATALOG:
        canonical = bio["canonical"]
        if canonical in seen_canonical:
            continue

        # Sort aliases by length descending so longer aliases match first
        aliases = sorted([canonical.lower()] + [a.lower() for a in bio["aliases"]], key=len, reverse=True)

        for line in lines:
            line_lower = line.lower()

            # Disambiguation guardrails
            if canonical == "Hemoglobin":
                if any(k in line_lower for k in ["corpuscular", "mch", "mchc", "hba1c", "con."]):
                    continue
            elif canonical == "Mean Corpuscular Hemoglobin (MCH)":
                if any(k in line_lower for k in ["volume", "mcv", "con.", "mchc", "concentration"]):
                    continue

            matched_alias = None
            for alias in aliases:
                pattern = rf"\b{re.escape(alias)}\b"
                if re.search(pattern, line_lower):
                    matched_alias = alias
                    break

            if matched_alias and canonical not in seen_canonical:
                pos = line_lower.find(matched_alias) + len(matched_alias)
                subsequent_text = line[pos:]

                # Strip trailing parenthesized abbreviations e.g. " (Hb)" or " (PCV)"
                subsequent_text = re.sub(r"^\s*\([a-zA-Z0-9\s]+\)", "", subsequent_text)
                # Strip leading colon e.g. ": 20.9" -> "20.9"
                subsequent_text = re.sub(r"^\s*:\s*", " ", subsequent_text)

                # Search for reference range pattern in subsequent text
                range_match = re.search(r"([0-9]+(?:\.[0-9]+)?)\s*(?:-|to)\s*([0-9]+(?:\.[0-9]+)?)", subsequent_text)
                
                val = None
                extracted_low, extracted_high = None, None
                range_raw = ""

                if range_match:
                    try:
                        extracted_low = float(range_match.group(1))
                        extracted_high = float(range_match.group(2))
                        range_raw = f"{extracted_low} - {extracted_high}"
                    except ValueError:
                        pass
                    
                    # The test value appears BEFORE the reference range
                    text_before_range = subsequent_text[:range_match.start()]
                    val_matches = re.findall(r"[-+]?[0-9]*\.?[0-9]+", text_before_range)
                    if val_matches:
                        try:
                            val = float(val_matches[0])
                        except ValueError:
                            pass

                # If value not found before range, look anywhere in subsequent text
                if val is None:
                    val_matches = re.findall(r"[-+]?[0-9]*\.?[0-9]+", subsequent_text)
                    if not val_matches:
                        continue
                    try:
                        val = float(val_matches[0])
                    except ValueError:
                        continue

                # Percentage sanity check for differential and hematocrit values (0-100%)
                if bio.get("unit") == "%" or bio.get("category") == "Differential Count":
                    if val >= 100.0 and val < 1000.0:
                        val = round(val / 10.0, 1)

                # Finalize reference range
                final_low = extracted_low if extracted_low is not None else bio["default_low"]
                final_high = extracted_high if extracted_high is not None else bio["default_high"]
                if not range_raw:
                    if final_low is not None and final_high is not None:
                        range_raw = f"{final_low} - {final_high}"
                    elif final_high is not None:
                        range_raw = f"< {final_high}"

                # Extract unit from line if present, else catalog standard
                unit = bio["unit"]
                unit_match = re.search(r"\b(mg/dL|g/dL|gm/dl|mil/cmm|mill/cumm|cu micron|picograms|cumm|/cmm|fL|pg|%|/uL|cells/mcL|mmol/L|U/L|mEq/L|uIU/mL|ng/mL|mm/hr)\b", line, re.IGNORECASE)
                if unit_match:
                    unit = unit_match.group(1)

                # Determine status
                status = "NORMAL"
                crit_low = bio.get("critical_low")
                crit_high = bio.get("critical_high")

                # Check printed keywords in line first
                if re.search(r"\b(critical|urgent|panic)\b", subsequent_text, re.IGNORECASE):
                    status = "CRITICAL"
                elif re.search(r"\b(high|elevated)\b", subsequent_text, re.IGNORECASE):
                    status = "HIGH"
                elif re.search(r"\b(low|decreased)\b", subsequent_text, re.IGNORECASE):
                    status = "LOW"
                elif re.search(r"\b(borderline|normal)\b", subsequent_text, re.IGNORECASE):
                    status = "NORMAL"
                else:
                    # Compare to numeric range
                    if final_low is not None and val < final_low:
                        if crit_low is not None and val <= crit_low:
                            status = "CRITICAL"
                        else:
                            status = "LOW"
                    elif final_high is not None and val > final_high:
                        if crit_high is not None and val >= crit_high:
                            status = "CRITICAL"
                        else:
                            status = "HIGH"
                    else:
                        status = "NORMAL"

                found_tests.append(
                    MedicalTestResult(
                        test_name=canonical,
                        normalized_name=canonical.lower(),
                        value=val,
                        unit=unit,
                        reference_range=ReferenceRange(low=final_low, high=final_high, raw=range_raw),
                        status=status,
                        category=bio["category"],
                        clinical_significance=bio["significance"]
                    )
                )
                seen_canonical.add(canonical)
                break

    return found_tests
