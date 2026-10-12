import re
from typing import List, Optional, Dict, Any
from app.config import settings
from app.models.schemas import MedicalTestResult, AbnormalityItem

def call_gemini(prompt: str) -> Optional[str]:
    """Helper to query Gemini API with model fallback."""
    if not settings.GEMINI_API_KEY:
        return None
    try:
        import google.generativeai as genai
        genai.configure(api_key=settings.GEMINI_API_KEY)
        candidate_models = ["gemini-1.5-flash", "gemini-2.0-flash", "gemini-1.5-pro", "gemini-pro"]
        for model_name in candidate_models:
            try:
                model = genai.GenerativeModel(model_name)
                response = model.generate_content(prompt)
                if response and response.text:
                    return response.text.strip()
            except Exception as me:
                print(f"[LLM] Model {model_name} failed: {me}")
                continue
    except Exception as e:
        print(f"[LLM] Gemini call error: {e}")
    return None

KNOWLEDGE_BASE: Dict[str, Dict[str, Any]] = {
    "hemoglobin": {
        "canonical": "Hemoglobin",
        "aliases": ["hemoglobin", "haemoglobin", "hb", "hgb"],
        "exp": "Hemoglobin is an iron-rich protein inside red blood cells responsible for binding and transporting oxygen from your lungs to tissues throughout your body, and returning carbon dioxide back to the lungs.",
        "high_ctx": "Elevated hemoglobin (> 16.5 gm/dl in men, > 15.5 gm/dl in women) can occur with hemoconcentration/dehydration, chronic smoking, high altitude acclimatization, sleep apnea, or primary bone marrow conditions such as polycythemia. A level significantly above 20.0 gm/dl is considered a critical finding requiring prompt clinical review by a physician.",
        "low_ctx": "Low hemoglobin signals anemia (due to iron, B12, or folate deficiency, chronic blood loss, or bone marrow disorders), commonly causing fatigue, pallor, and reduced exercise tolerance.",
        "normal_ctx": "Your hemoglobin level is within the expected physiological reference interval for healthy oxygen delivery.",
        "diet": "To support healthy hemoglobin: consume iron-rich foods (lentils, spinach, beans, fortified cereals, lean poultry) paired with Vitamin C (citrus fruits, bell peppers) to maximize absorption."
    },
    "rbc": {
        "canonical": "Red Blood Cell Count (RBC)",
        "aliases": ["rbc", "red blood cell", "red blood cell count", "erythrocyte", "total rbc"],
        "exp": "Red Blood Cells are the circulating cellular carriers that contain hemoglobin and deliver oxygen to organs and muscles.",
        "high_ctx": "Elevated RBC count (erythrocytosis) often reflects dehydration, chronic hypoxia, or bone marrow overproduction.",
        "low_ctx": "Decreased RBC counts indicate anemia, acute hemorrhage, or decreased bone marrow synthesis.",
        "normal_ctx": "Your red blood cell count is within expected physiological bounds.",
        "diet": "Support red cell production with adequate folate, Vitamin B12, iron, and proper daily hydration."
    },
    "wbc": {
        "canonical": "Total Leukocyte Count (WBC)",
        "aliases": ["wbc", "white blood", "leukocyte", "total wbc", "tlc"],
        "exp": "White Blood Cells are vital immune defense cells that defend your body against bacteria, viruses, fungi, and foreign pathogens.",
        "high_ctx": "Elevated counts (leukocytosis) most commonly occur during acute bacterial infections, systemic inflammation, severe tissue injury, or intense physical stress.",
        "low_ctx": "Low counts (leukopenia) can indicate acute viral infection, autoimmune activity, medication effects, or bone marrow suppression.",
        "normal_ctx": "Your overall white blood cell count is within the healthy reference range.",
        "diet": "Support immune resilience with adequate sleep, balanced micronutrients (Zinc, Vitamin C, Vitamin D), and hygienic food preparation."
    },
    "platelets": {
        "canonical": "Platelet Count",
        "aliases": ["platelet", "platelets", "plt", "thrombocyte"],
        "exp": "Platelets (thrombocytes) are specialized cellular fragments essential for normal blood clotting and blood vessel repair.",
        "high_ctx": "Elevated platelets (thrombocytosis) can occur reactively following acute infection, inflammation, iron deficiency, or primary myeloproliferative disorders. Severely elevated counts increase clotting risks.",
        "low_ctx": "Low platelets (thrombocytopenia) impair clotting and increase bleeding tendencies (easy bruising, petechiae, prolonged bleeding).",
        "normal_ctx": "Your platelet count is within the safe reference range for normal hemostasis and clotting.",
        "diet": "Maintain balanced nutrition with Vitamin K (leafy greens) and folate; avoid unprescribed blood thinners."
    },
    "pcv": {
        "canonical": "Packed Cell Volume (PCV)",
        "aliases": ["pcv", "hematocrit", "packed cell volume", "hct"],
        "exp": "Packed Cell Volume (Hematocrit) measures the percentage of total blood volume made up by red blood cells.",
        "high_ctx": "Elevated PCV indicates dehydration (decreased plasma volume) or polycythemia.",
        "low_ctx": "Decreased PCV indicates anemia, blood loss, or overhydration.",
        "normal_ctx": "Your PCV/hematocrit proportion is in a healthy equilibrium.",
        "diet": "Maintain optimal hydration with water and electrolytes."
    },
    "mcv": {
        "canonical": "Mean Corpuscular Volume (MCV)",
        "aliases": ["mcv", "mean corpuscular volume"],
        "exp": "MCV measures the average physical size and volume of an individual red blood cell.",
        "high_ctx": "High MCV (> 96 fL, macrocytosis) is typically linked to Vitamin B12 deficiency, folate deficiency, thyroid conditions, or liver disease.",
        "low_ctx": "Low MCV (< 76-80 fL, microcytosis) is classic for iron deficiency anemia or thalassemia trait.",
        "normal_ctx": "Your red blood cells have a normal average volume (normocytic).",
        "diet": "If microcytic, check iron and ferritin; if macrocytic, evaluate Vitamin B12 and folate levels."
    },
    "mch": {
        "canonical": "Mean Corpuscular Hemoglobin (MCH)",
        "aliases": ["mch", "mean corpuscular hemoglobin"],
        "exp": "MCH measures the average mass of hemoglobin contained inside a single red blood cell.",
        "high_ctx": "Elevated MCH is often seen in macrocytic anemias where red cells are unusually large.",
        "low_ctx": "Low MCH (hypochromia) reflects insufficient hemoglobin packaging per cell, typical of iron deficiency.",
        "normal_ctx": "Your red blood cells contain an expected concentration of hemoglobin per cell.",
        "diet": "Ensure adequate dietary intake of iron and B vitamins."
    },
    "mchc": {
        "canonical": "Mean Corpuscular Hemoglobin Concentration (MCHC)",
        "aliases": ["mchc", "mean corpuscular hemoglobin conc"],
        "exp": "MCHC calculates the average concentration of hemoglobin in a given volume of packed red blood cells.",
        "high_ctx": "High MCHC can indicate hereditary spherocytosis, severe dehydration, or cold agglutinin interference.",
        "low_ctx": "Low MCHC indicates true hypochromic anemia (microcytic hypochromic).",
        "normal_ctx": "Your MCHC is within the standard reference interval.",
        "diet": "Support cellular structure with balanced hydration and minerals."
    },
    "neutrophils": {
        "canonical": "Neutrophils",
        "aliases": ["neutrophil", "neutrophils", "anc"],
        "exp": "Neutrophils are the most abundant circulating white blood cells and act as the body's frontline defense against bacterial infections.",
        "high_ctx": "Elevated neutrophils (neutrophilia) commonly indicate bacterial infection, acute inflammation, physical trauma, or steroid medication.",
        "low_ctx": "Low neutrophils (neutropenia) increase susceptibility to bacterial infections.",
        "normal_ctx": "Your neutrophil differential percentage is normal.",
        "diet": "Focus on anti-inflammatory whole foods, stress management, and adequate rest."
    },
    "lymphocytes": {
        "canonical": "Lymphocytes",
        "aliases": ["lymphocyte", "lymphocytes"],
        "exp": "Lymphocytes (T-cells, B-cells, NK cells) coordinate adaptive immunity, antibody production, and antiviral defense.",
        "high_ctx": "Elevated lymphocytes (lymphocytosis) commonly arise during viral infections (e.g. Epstein-Barr, influenza, respiratory viruses).",
        "low_ctx": "Low lymphocytes (lymphopenia) may occur with corticosteroid use, acute stress, or immune deficiencies.",
        "normal_ctx": "Your lymphocyte count is within normal immunological parameters.",
        "diet": "Support cellular immunity with antioxidant-rich fruits, berries, and omega-3 fatty acids."
    },
    "eosinophils": {
        "canonical": "Eosinophils",
        "aliases": ["eosinophil", "eosinophils", "eos"],
        "exp": "Eosinophils are granulocytes that modulate allergic responses and fight parasitic infections.",
        "high_ctx": "Elevated eosinophils (eosinophilia) typically point to allergic conditions (asthma, eczema, food allergies), drug hypersensitivity, or parasites.",
        "low_ctx": "Low eosinophil levels are generally not clinically significant on routine screening.",
        "normal_ctx": "Your eosinophil differential is within expected baseline limits.",
        "diet": "Identify and avoid known allergens or dietary sensitivities."
    },
    "monocytes": {
        "canonical": "Monocytes",
        "aliases": ["monocyte", "monocytes"],
        "exp": "Monocytes are large circulating phagocytes that mature into tissue macrophages to clean up cellular debris and respond to chronic inflammation.",
        "high_ctx": "Elevated monocytes (monocytosis) can reflect chronic inflammatory disorders, recovery from acute infections, or granulomatous conditions.",
        "low_ctx": "Isolated low monocytes are rarely of independent clinical significance.",
        "normal_ctx": "Your monocyte count is normal.",
        "diet": "Emphasize an anti-inflammatory diet rich in leafy greens, nuts, and polyphenols."
    },
    "basophils": {
        "canonical": "Basophils",
        "aliases": ["basophil", "basophils"],
        "exp": "Basophils are specialized granulocytes containing histamine and heparin that participate in allergic and inflammatory reactions.",
        "high_ctx": "Elevated basophils (basophilia) can occur in allergic inflammation or myeloproliferative disorders.",
        "low_ctx": "Low or zero basophils is completely normal on routine differential counts.",
        "normal_ctx": "Your basophil count is within standard healthy bounds (0 - 1%).",
        "diet": "Standard balanced nutritional support."
    },
    "glucose": {
        "canonical": "Fasting Blood Glucose",
        "aliases": ["glucose", "fasting blood glucose", "fasting glucose", "blood sugar", "sugar", "fbs"],
        "exp": "Fasting Blood Glucose measures circulating glucose (sugar) after an 8 to 12 hour fast, serving as the frontline test for diabetes and insulin resistance.",
        "high_ctx": "Levels from 100-125 mg/dL suggest impaired fasting glucose (prediabetes); levels >= 126 mg/dL on multiple occasions indicate diabetes mellitus.",
        "low_ctx": "Levels below 70 mg/dL indicate hypoglycemia, which can cause lightheadedness, tremors, sweating, or confusion.",
        "normal_ctx": "Your fasting glucose is within the normal healthy range (70 - 99 mg/dL).",
        "diet": "Prioritize complex carbohydrates with high fiber, moderate portions, regular physical activity, and limit sugary drinks."
    },
    "lipid": {
        "canonical": "Lipid Panel",
        "aliases": ["lipid", "lipid panel", "cholesterol", "triglyceride", "triglycerides", "hdl", "ldl", "lipid profile"],
        "exp": "A Lipid Panel measures circulating fats and lipoproteins (Total Cholesterol, HDL 'good' cholesterol, LDL 'bad' cholesterol, and Triglycerides) to evaluate cardiovascular and atherosclerotic risk.",
        "high_ctx": "High total cholesterol, LDL, or triglycerides contribute to arterial plaque buildup over time.",
        "low_ctx": "Very low cholesterol may occur in severe malnutrition or hyperthyroidism.",
        "normal_ctx": "Your lipid levels support cardiovascular health.",
        "diet": "Adopt a Mediterranean-style dietary pattern: extra virgin olive oil, nuts, seeds, fatty fish, and soluble fiber."
    }
}

def generate_report_summary(
    extracted_text: str,
    tests: List[MedicalTestResult],
    abnormalities: List[AbnormalityItem]
) -> str:
    """
    Generates a concise, structured educational report summary.
    Uses Gemini API if configured; otherwise uses deterministic dynamic report summarization.
    """
    if settings.GEMINI_API_KEY:
        try:
            import google.generativeai as genai
            genai.configure(api_key=settings.GEMINI_API_KEY)
            model = genai.GenerativeModel("gemini-1.5-flash")

            abnormal_lines = "\n".join([f"- {a.test_name}: {a.value} {a.unit} (Ref: {a.reference_range}) - {a.status}" for a in abnormalities])
            prompt = f"""
You are an expert AI clinical health educator.
Analyze the following extracted medical report facts and generate a clear, modern, educational summary for the patient.

RULES:
1. Clearly distinguish extracted facts from general educational explanations.
2. DO NOT claim a medical diagnosis or prescribe treatment.
3. Keep the tone calm, objective, and supportive.
4. If there are abnormal values, list them clearly with plain-English context.
5. Remind the patient to discuss their findings with a licensed physician.

EXTRACTED ABNORMAL FINDINGS:
{abnormal_lines if abnormal_lines else "None. All detected biomarkers are within normal reference limits."}

TOTAL BIOMARKERS DETECTED: {len(tests)}

Provide a concise, nicely bulleted educational summary.
"""
            response = model.generate_content(prompt)
            if response and response.text:
                return response.text.strip()
        except Exception as e:
            print(f"[LLM] Gemini API error: {e}. Falling back to dynamic summary.")

    # Dynamic Report Summarizer (always grounded strictly in extracted report facts)
    if not tests:
        return (
            "No structured clinical lab biomarkers could be reliably identified in the uploaded document. "
            "Please ensure the document contains clear printed laboratory panels such as blood glucose, complete blood count, or lipid profiles."
        )

    if not abnormalities:
        return (
            f"Good news: All {len(tests)} identified clinical biomarkers in this report are currently within their displayed laboratory reference intervals.\n\n"
            "• Routine checkups and healthy lifestyle habits remain the cornerstone of preventive health.\n"
            "• Please review these results with your healthcare provider during your next routine consultation."
        )

    abnormal_bullets = []
    for ab in abnormalities:
        direction = "above" if ab.status in ["HIGH", "CRITICAL"] else "below"
        abnormal_bullets.append(
            f"• {ab.test_name} ({ab.value} {ab.unit}) is {direction} the displayed reference interval of {ab.reference_range}."
        )

    summary_text = (
        f"Your uploaded report contains {len(tests)} detected test parameters, of which {len(abnormalities)} "
        f"{'value is' if len(abnormalities) == 1 else 'values are'} outside standard reference ranges:\n\n"
        + "\n".join(abnormal_bullets) + "\n\n"
        "Key Context:\n"
        "• Reference intervals represent standard statistical expectations for healthy populations; deviations may reflect temporary physiological states, diet, hydration, or metabolic factors.\n"
        "• These insights are informational and based strictly on the uploaded report. Please share these findings with your doctor for clinical correlation."
    )
    return summary_text

def answer_rag_question(
    question: str,
    retrieved_chunks: List[str],
    full_text: str,
    tests: Optional[List[dict]] = None
) -> str:
    """
    Answers a patient's question grounded strictly in their report findings,
    using Gemini API if available, or an intelligent Clinical Knowledge Engine fallback.
    """
    test_list = tests or []

    # 1. Format structured tests table
    formatted_tests = []
    for t in test_list:
        name = t.get("test_name", "")
        val = t.get("value", "")
        unit = t.get("unit", "")
        ref = t.get("reference_range", "")
        status = t.get("status", "NORMAL")
        formatted_tests.append(f"- {name}: {val} {unit} (Reference Range: {ref}) [Status: {status}]")
    test_summary_str = "\n".join(formatted_tests) if formatted_tests else "No structured tests extracted."

    context_str = "\n---\n".join(retrieved_chunks) if retrieved_chunks else full_text[:1200]

    # 2. Query Gemini API if configured
    prompt = f"""
You are MedInsight AI, an empathetic, evidence-based clinical health education assistant.
Answer the user's question clearly, helpfully, and accurately.

PATIENT'S EXTRACTED LAB RESULTS FROM UPLOADED REPORT:
{test_summary_str}

RELEVANT EXCERPTS FROM REPORT:
{context_str}

USER QUESTION:
{question}

INSTRUCTIONS FOR ANSWERING:
1. If the user asks about their specific lab values (e.g. "What is my hemoglobin level?", "Are my platelets high?"):
   - State their exact value, unit, reference range, and status from the lab results above.
2. If the user asks an educational or medical question (e.g. "What is hemoglobin?", "What causes low MCV?", "How does diet affect red cells?"):
   - Provide a clear, educational medical explanation of what that biomarker or term means.
   - If that biomarker is present in their report, also connect it to their actual result for personalized clarity!
3. If the user asks about a test or panel NOT in this report (e.g. asking "What is my fasting glucose?" or "Explain my lipid panel" on a CBC report):
   - Explicitly clarify that this specific test was not included in this uploaded report.
   - Mention what tests WERE conducted in this report (e.g. Complete Blood Count).
4. If the user asks about abnormal findings or concerns (e.g. "What values are abnormal in my report?"):
   - Clearly list the specific abnormal tests with their observed value, normal reference range, and clinical status.
5. Safety:
   - Provide helpful health education and lifestyle context.
   - Do NOT provide a definitive medical diagnosis or prescribe medications.
   - Remind the patient to discuss findings with their healthcare provider.
"""
    gemini_answer = call_gemini(prompt)
    if gemini_answer:
        return gemini_answer

    # 3. Intelligent Clinical Reasoning & Knowledge Engine Fallback
    q_lower = question.lower()

    # A. Check if asking about abnormalities or out-of-range findings
    if any(w in q_lower for w in ["abnormal", "high", "low", "critical", "concern", "problem", "issue", "out of range", "bad", "danger", "worry"]):
        abnormals = [t for t in test_list if t.get("status") in ["HIGH", "LOW", "CRITICAL"]]
        if abnormals:
            lines = [f"Based on your uploaded report, **{len(abnormals)} test parameters** fall outside standard reference intervals:\n"]
            for ab in abnormals:
                name = ab.get("test_name", "")
                val = ab.get("value", "")
                unit = ab.get("unit", "")
                ref = ab.get("reference_range", "")
                status = ab.get("status", "NORMAL")
                sig = ab.get("clinical_significance", "")
                lines.append(f"- **{name}**: **{val} {unit}** (Reference: `{ref}`) - **{status}**")
                if sig:
                    lines.append(f"  *Clinical Note*: {sig}")
            lines.append("\nAll other detected parameters in this report are within standard expected limits.")
            lines.append("Please share these results with your physician for clinical correlation.")
            return "\n".join(lines)
        elif test_list:
            return (
                f"Good news! All {len(test_list)} detected clinical parameters in your uploaded report "
                "are currently within their displayed laboratory reference intervals.\n\n"
                "Continue routine preventive checkups and maintain a healthy lifestyle."
            )

    # B. Check for Biomarker / Test Inquiries
    matched_kb_key = None
    for kb_key, kb_data in KNOWLEDGE_BASE.items():
        if any(alias in q_lower for alias in kb_data["aliases"]):
            matched_kb_key = kb_key
            break

    if matched_kb_key:
        kb = KNOWLEDGE_BASE[matched_kb_key]
        # Check if patient has this test in test_list
        patient_test = None
        for t in test_list:
            t_name = t.get("test_name", "").lower()
            if any(alias in t_name for alias in kb["aliases"]):
                patient_test = t
                break

        if patient_test:
            # The test IS present in report!
            val = patient_test.get("value")
            unit = patient_test.get("unit", "")
            ref = patient_test.get("reference_range", "")
            status = patient_test.get("status", "NORMAL")
            
            ctx_text = kb["normal_ctx"]
            if status in ["HIGH", "CRITICAL"]:
                ctx_text = kb["high_ctx"]
            elif status == "LOW":
                ctx_text = kb["low_ctx"]

            return (
                f"According to your uploaded report, your **{patient_test.get('test_name')}** is **{val} {unit}** "
                f"(Reference Range: `{ref}`), which is evaluated as **{status}**.\n\n"
                f"### What is {kb['canonical']}?\n"
                f"{kb['exp']}\n\n"
                f"### Clinical Context for This Result:\n"
                f"{ctx_text}\n\n"
                f"### Dietary & Lifestyle Considerations:\n"
                f"{kb['diet']}\n\n"
                "*(Note: This information is for educational guidance. Please consult your physician for individualized medical advice.)*"
            )
        else:
            # The test was NOT tested in this report!
            detected_names = [t.get("test_name") for t in test_list if t.get("test_name")]
            detected_summary = ", ".join(detected_names[:8]) if detected_names else "cellular blood parameters"
            return (
                f"Based on your uploaded report, **{kb['canonical']}** was **not tested or reported** in this document.\n\n"
                f"Your uploaded report appears to be a **Complete Blood Count (CBC)** panel containing parameters such as: {detected_summary}.\n\n"
                f"### What is {kb['canonical']}?\n"
                f"{kb['exp']}\n\n"
                f"If you have a separate laboratory report containing {kb['canonical']}, you can upload it to MedInsight AI to analyze your results."
            )

    # C. Check general inquiries (e.g. CBC, Anemia)
    if any(w in q_lower for w in ["cbc", "complete blood count", "blood test"]):
        detected_names = [f"• {t.get('test_name')}: {t.get('value')} {t.get('unit')} ({t.get('status')})" for t in test_list]
        return (
            "### Complete Blood Count (CBC) Overview\n"
            "A Complete Blood Count evaluates the cellular components of your blood:\n"
            "1. **Red Blood Cells & Hemoglobin**: Transport oxygen from your lungs to tissues.\n"
            "2. **White Blood Cells**: Immune cells that protect against infection and inflammation.\n"
            "3. **Platelets**: Essential for blood clotting and stopping bleeding.\n\n"
            f"**Your Extracted Parameters ({len(test_list)} tests):**\n"
            + "\n".join(detected_names[:10]) +
            "\n\nReview any flagged values with your healthcare provider."
        )

    # D. Semantic matching across report context
    if full_text:
        # Extract meaningful sentences containing query words
        q_words = [w for w in re.findall(r"\w+", q_lower) if len(w) > 3 and w not in ["what", "where", "which", "could", "would", "about", "this", "that"]]
        matched_sentences = []
        for line in full_text.splitlines():
            line_clean = line.strip()
            if any(w in line_clean.lower() for w in q_words) and len(line_clean) > 15:
                matched_sentences.append(line_clean)

        if matched_sentences:
            return (
                "Based on the contents of your uploaded medical report:\n\n"
                + "\n".join([f"• {s}" for s in matched_sentences[:4]]) +
                "\n\nIf you have a specific test parameter you would like to explore, feel free to ask!"
            )

    return (
        "Based on your uploaded report, this specific question is not directly covered in the extracted document text. "
        "You can ask about any detected biomarker (such as Hemoglobin, RBC, WBC, Platelets, MCV, etc.) or abnormal findings."
    )

def explain_medical_term(test_name: str, value: Optional[float], unit: str, status: str) -> dict:
    """Provides educational explanations for specific lab biomarkers."""
    prompt = f"""
Provide an educational explanation of the laboratory test: {test_name}.
Observed Value: {value} {unit} (Status: {status}).

Explain in 3 distinct short sections:
1. Explanation: What is this test measuring and why do doctors order it?
2. General Context: What does this observed status ({status}) generally indicate?
3. Dietary & Lifestyle Context: General evidence-based lifestyle/nutrition habits related to this biomarker.

Do NOT provide a diagnosis. Add an educational reminder.
"""
    gemini_resp = call_gemini(prompt)
    if gemini_resp:
        return {
            "test_name": test_name,
            "explanation": gemini_resp,
            "general_context": f"Status is {status}. Always consult your physician for individualized medical guidance.",
            "dietary_lifestyle_context": "Maintain a balanced whole-food diet, regular physical exercise, and adequate hydration."
        }

    # Knowledge base fallback
    t_key = test_name.lower()
    match = None
    for k, v in KNOWLEDGE_BASE.items():
        if any(alias in t_key for alias in v["aliases"]):
            match = v
            break

    if match:
        ctx = match["normal_ctx"]
        if status in ["HIGH", "CRITICAL"]:
            ctx = match["high_ctx"]
        elif status == "LOW":
            ctx = match["low_ctx"]

        return {
            "test_name": test_name,
            "explanation": match["exp"],
            "general_context": ctx,
            "dietary_lifestyle_context": match["diet"]
        }

    return {
        "test_name": test_name,
        "explanation": f"{test_name} is a diagnostic laboratory biomarker used by physicians to evaluate organ function and physiological homeostasis.",
        "general_context": f"The test yielded a value of {value} {unit}, categorized as {status} relative to standard population intervals.",
        "dietary_lifestyle_context": "Consult your healthcare provider for clinical interpretation customized to your overall health history."
    }
