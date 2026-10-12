import os
import sys
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    KeepTogether,
    HRFlowable,
    PageBreak
)
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    """
    Two-pass canvas to dynamically compute and render exact total page count
    and elegant running headers and footers.
    """
    def __init__(self, *args, **kwargs):
        super(NumberedCanvas, self).__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super(NumberedCanvas, self).showPage()
        super(NumberedCanvas, self).save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748b"))

        # Header (pages > 1)
        if self._pageNumber > 1:
            self.drawString(54, 750, "MedInsight AI — Theory, Architectural Blueprint & System Monograph")
            self.setStrokeColor(colors.HexColor("#cbd5e1"))
            self.setLineWidth(0.5)
            self.line(54, 742, 558, 742)

        # Footer (all pages)
        self.setStrokeColor(colors.HexColor("#cbd5e1"))
        self.setLineWidth(0.5)
        self.line(54, 45, 558, 45)
        self.drawString(54, 32, "Confidential & Educational • MedInsight AI Platform Documentation")
        self.drawRightString(558, 32, f"Page {self._pageNumber} of {page_count}")
        self.restoreState()

def build_pdf():
    output_filename = "MedInsight_AI_Project_Documentation.pdf"
    doc = SimpleDocTemplate(
        output_filename,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )

    styles = getSampleStyleSheet()

    # Color Palette
    primary = colors.HexColor("#0284c7")       # Medical Blue
    primary_dark = colors.HexColor("#0369a1")  # Darker Blue
    navy = colors.HexColor("#0f172a")          # Deep Navy
    dark_slate = colors.HexColor("#334155")    # Body Text
    muted_slate = colors.HexColor("#64748b")   # Secondary Text
    bg_light = colors.HexColor("#f8fafc")      # Table Header Light
    border_color = colors.HexColor("#e2e8f0")  # Table Border Light
    callout_bg = colors.HexColor("#f0f9ff")    # Info Box Background
    callout_border = colors.HexColor("#bae6fd")# Info Box Border
    notice_bg = colors.HexColor("#fefce8")     # Notice Background
    notice_border = colors.HexColor("#fde047") # Notice Border

    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=19,
        leading=23,
        textColor=navy,
        spaceAfter=3
    )

    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13.5,
        textColor=primary,
        spaceAfter=7
    )

    h1_style = ParagraphStyle(
        'Header1',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=15,
        textColor=navy,
        spaceBefore=9,
        spaceAfter=4,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'Header2',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9.5,
        leading=13,
        textColor=primary_dark,
        spaceBefore=6,
        spaceAfter=2.5,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'Body',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12,
        textColor=dark_slate,
        spaceAfter=4
    )

    bullet_style = ParagraphStyle(
        'Bullet',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=11.5,
        textColor=dark_slate,
        spaceAfter=2.5,
        leftIndent=8
    )

    callout_style = ParagraphStyle(
        'Callout',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=11.5,
        textColor=colors.HexColor("#075985")
    )

    code_style = ParagraphStyle(
        'FormulaCode',
        parent=styles['Normal'],
        fontName='Courier-Bold',
        fontSize=8,
        leading=11,
        textColor=colors.HexColor("#1e293b")
    )

    story = []

    # =========================================================================
    # COVER / HEADER BLOCK
    # =========================================================================
    story.append(Paragraph("MedInsight AI: Theoretical Foundations & Architecture", title_style))
    story.append(Paragraph("Comprehensive Technical Monograph: LLM, RAG, Machine Learning & Explainable AI (SHAP)", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=primary, spaceBefore=0, spaceAfter=8))

    # =========================================================================
    # SECTION 1: WHAT IS THIS PROJECT?
    # =========================================================================
    story.append(Paragraph("1. Project Definition: What is MedInsight AI?", h1_style))
    story.append(Paragraph(
        "<b>MedInsight AI</b> is an intelligent, full-stack medical report analysis and health literacy platform designed to bridge the critical information gap between complex diagnostic laboratory reports and patient comprehension. In contemporary clinical healthcare, patients receive diagnostic reports containing dense numerical values, specialized biochemical nomenclature, and reference intervals without immediate context. This results in patient anxiety, misinterpretation, and delayed follow-ups.",
        body_style
    ))
    story.append(Paragraph(
        "MedInsight AI solves this challenge by ingesting unstructured diagnostic documents (digital PDFs and scanned photos), extracting clinical parameters deterministically, flagging abnormal values, generating educational explanations via large language models (LLMs), estimating cardiometabolic disease risk via machine learning, explaining model decisions with Shapley Additive exPlanations (SHAP), and allowing grounded interactive report question-answering via Retrieval-Augmented Generation (RAG).",
        body_style
    ))

    story.append(Paragraph("The Tripartite Clinical Separation Paradigm", h2_style))
    story.append(Paragraph(
        "A core theoretical imperative of MedInsight AI is the strict epistemological separation of three distinct data tiers to ensure patient safety and prevent AI hallucination:",
        body_style
    ))
    story.append(Paragraph("1. <b>Extracted Clinical Facts (Ground Truth):</b> Pure mathematical numbers, canonical biomarker identities, observed units, and laboratory reference ranges parsed directly from the document with zero AI modification.", bullet_style))
    story.append(Paragraph("2. <b>Educational AI Explanations:</b> Non-diagnostic descriptions generated by an LLM explaining what each biomarker does in human physiology, potential lifestyle factors influencing abnormal levels, and suggested questions for a physician.", bullet_style))
    story.append(Paragraph("3. <b>Machine Learning Risk Estimates:</b> Statistical screening scores accompanied by SHAP mathematical attributions that indicate population-level risk indicators without presuming a formal clinical diagnosis.", bullet_style))

    story.append(Spacer(1, 4))

    # =========================================================================
    # SECTION 2: THEORY OF DOCUMENT INGESTION & MEDICAL NER
    # =========================================================================
    story.append(Paragraph("2. Theory of Document Ingestion & Clinical Extraction", h1_style))
    story.append(Paragraph(
        "Medical reports arrive in highly heterogeneous formats: digital vector PDFs from modern hospital management systems, rasterized scans, photographs, and multipage tables. Extracting structured data reliably requires a dual-engine architecture combining Document Object Model (DOM) extraction with Optical Character Recognition (OCR).",
        body_style
    ))

    story.append(Paragraph("Digital Text Extraction vs. OCR Fallback", h2_style))
    story.append(Paragraph(
        "• <b>PyMuPDF (fitz) Direct Parsing:</b> For digital PDFs, PyMuPDF accesses the underlying PDF page streams directly. Unlike naive text extractors that lose spatial relationships, PyMuPDF parses text spans with positional coordinates, preserving tabular column integrity and avoiding font rasterization artifacts.<br/>"
        "• <b>Tesseract OCR Engine Fallback:</b> When a file is an image (PNG, JPG) or a scanned PDF lacking embedded text, the system invokes Tesseract OCR. The image undergoes grayscale transformation, Otsu adaptive thresholding to maximize foreground/background contrast, and LSTM neural character recognition to convert visual glyphs into UTF-8 text.",
        bullet_style
    ))

    story.append(Paragraph("Theoretical Foundation of Clinical Named Entity Recognition (NER)", h2_style))
    story.append(Paragraph(
        "In medical informatics, Named Entity Recognition (NER) identifies biomedical concepts from unstructured text. While probabilistic NLP models (e.g., ClinicalBERT) excel at semantic classification, they carry non-zero hallucination risks when extracting exact clinical quantities. MedInsight AI employs a <b>deterministic clinical regex and alias ontology</b> over a curated medical lexicon containing over 30 canonical biomarkers across hematology, metabolic panels, lipid profiles, renal function, liver function, and electrolytes.",
        body_style
    ))
    story.append(Paragraph(
        "Each biomarker entry contains a canonical name, synonym aliases (e.g., 'Fasting Blood Sugar', 'FBS', 'Plasma Glucose' -&gt; 'Glucose'), units, and standard adult reference intervals. The regex engine uses boundary-aware lookaheads and multi-pattern matching to capture the test name, numerical value, unit, and printed reference range without token alteration.",
        body_style
    ))

    story.append(Paragraph("Reference Intervals and Abnormality Detection Theory", h2_style))
    story.append(Paragraph(
        "In clinical pathology, a <i>Reference Interval</i> represents the range of values encompassing 95% of a healthy reference population (typically mean +/- 1.96 standard deviations). MedInsight AI parses two-sided intervals [L, H], upper limits &lt; H, and lower limits &gt; L. Values are classified into deterministic partitions:",
        body_style
    ))
    story.append(Paragraph("• <b>LOW:</b> Value &lt; Low Limit (below physiological normal baseline).", bullet_style))
    story.append(Paragraph("• <b>NORMAL:</b> Low Limit &lt;= Value &lt;= High Limit (within standard reference boundaries).", bullet_style))
    story.append(Paragraph("• <b>HIGH:</b> Value &gt; High Limit (above physiological normal baseline).", bullet_style))
    story.append(Paragraph("• <b>CRITICAL:</b> Extreme deviations crossing acute clinical danger thresholds (e.g. Glucose &gt; 400 mg/dL, Platelets &lt; 50,000 /uL, Potassium &gt; 6.0 mmol/L).", bullet_style))

    story.append(Spacer(1, 4))

    # =========================================================================
    # SECTION 3: THEORY OF RAG & EMBEDDING VECTOR SPACES
    # =========================================================================
    story.append(Paragraph("3. Theory of Retrieval-Augmented Generation (RAG) & Vector Spaces", h1_style))
    story.append(Paragraph(
        "Large Language Models (LLMs) are parameterized generative systems trained on internet-scale corpora. In healthcare applications, pure zero-shot LLMs present a dangerous failure mode known as <b>stochastic hallucination</b>—confidently asserting incorrect medical facts or fabricating lab results not present in the patient's record. MedInsight AI eliminates this vulnerability through <b>Retrieval-Augmented Generation (RAG)</b>.",
        body_style
    ))

    story.append(Paragraph("Mathematical Foundations of Dense Vector Embeddings", h2_style))
    story.append(Paragraph(
        "Text chunks extracted from the patient's report are projected into a continuous high-dimensional semantic vector space R^d (d = 384) using the sentence-transformers/all-MiniLM-L6-v2 model. The transformer encoder maps semantic meaning into vector directions: sentences with similar clinical meaning reside close together in Euclidean/cosine space.",
        body_style
    ))
    story.append(Paragraph(
        "Given a query vector q in R^d and document chunk vectors d_i in R^d, semantic similarity is computed via the Inner Product / Cosine Similarity:",
        body_style
    ))
    story.append(Paragraph("Sim(q, d_i) = (q . d_i) / (||q|| * ||d_i||) = sum(q_j * d_ij)", code_style))

    story.append(Paragraph("FAISS (Facebook AI Similarity Search) Indexing Mechanics", h2_style))
    story.append(Paragraph(
        "MedInsight AI constructs an isolated IndexFlatIP vector database for each medical report using FAISS. When the user asks a natural language question (e.g., <i>'Why is my creatinine flagged?'</i>), the query is embedded into vector q, FAISS performs an exact nearest-neighbor search, retrieves the Top-K relevant text passages from the patient's actual document, and injects them into an engineered LLM prompt equipped with negative constraints:",
        body_style
    ))
    story.append(Paragraph("<i>'You are a clinical educational assistant. Answer ONLY based on the provided report context. If the report does not contain the answer, explicitly state that the information is not present in the document. Never fabricate diagnoses.'</i>", callout_style))

    story.append(PageBreak())

    # =========================================================================
    # SECTION 4: THEORY OF MACHINE LEARNING RISK SCREENING & SHAP
    # =========================================================================
    story.append(Paragraph("4. Theory of Machine Learning Risk Screening & SHAP Explainability", h1_style))
    story.append(Paragraph(
        "Traditional automated clinical systems either rely on naive cutoff rules or unexplainable deep neural networks ('black boxes'). In clinical settings, a prediction without explanation cannot be evaluated or trusted. MedInsight AI bridges this by coupling a Random Forest risk screening classifier with <b>Shapley Additive exPlanations (SHAP)</b> based on cooperative game theory.",
        body_style
    ))

    story.append(Paragraph("Random Forest Ensemble Theory for Screening", h2_style))
    story.append(Paragraph(
        "The risk screening engine assesses cardiometabolic disease risk using a Random Forest classifier consisting of B bootstrap-aggregated decision trees. Random Forests prevent overfitting by combining bagging (sampling with replacement) with random feature subspace selection at each split. The ensemble probability prediction P(Y=1 | x) is the average of all trees:",
        body_style
    ))
    story.append(Paragraph("P(Y=1 | x) = (1 / B) * sum_{b=1}^{B} T_b(x)", code_style))
    story.append(Paragraph(
        "Features include core cardiometabolic biomarkers: Fasting Glucose, HbA1c, Total Cholesterol, Triglycerides, HDL, and Creatinine. If the document does not contain the necessary clinical features, the model safely halts and reports: <i>'Risk prediction unavailable: There is not enough structured information available to generate this screening estimate.'</i>",
        body_style
    ))

    story.append(Paragraph("Cooperative Game Theory & The Mathematics of SHAP", h2_style))
    story.append(Paragraph(
        "SHAP unifies game theory with machine learning interpretability. In 1953, Lloyd Shapley introduced Shapley values to fairly distribute payouts among players in a cooperative game based on their marginal contributions. In MedInsight AI, the <b>'game'</b> is the model's prediction of disease risk, and the <b>'players'</b> are the patient's observed laboratory biomarkers.",
        body_style
    ))
    story.append(Paragraph(
        "The Shapley value phi_i of biomarker i represents its contribution across all possible coalitions of biomarkers S in F \\ {i}:",
        body_style
    ))
    story.append(Paragraph("phi_i(f, x) = sum_{S in F \\ {i}} [ |S|! * (|F| - |S| - 1)! / |F|! ] * [ f(S U {i}) - f(S) ]", code_style))
    story.append(Paragraph(
        "where F is the total set of features, S is a subset of features excluding i, and f(S) is the conditional expectation of the model output given the features in S.",
        body_style
    ))

    story.append(Paragraph("The Four Foundational Axioms Satisfied by SHAP", h2_style))
    story.append(Paragraph("1. <b>Efficiency (Local Accuracy):</b> The sum of all feature attributions plus the expected base rate equals the model prediction: f(x) = phi_0 + sum(phi_i).", bullet_style))
    story.append(Paragraph("2. <b>Symmetry:</b> If two biomarkers contribute equally to all possible coalitions, their SHAP values are identical.", bullet_style))
    story.append(Paragraph("3. <b>Dummy (Null Player):</b> If a biomarker has no effect on any coalition, its SHAP value is strictly zero (phi_i = 0).", bullet_style))
    story.append(Paragraph("4. <b>Additivity:</b> For ensemble models, the overall SHAP value equals the sum of the individual tree contributions.", bullet_style))

    story.append(Paragraph("Clinical Impact of SHAP Visualizations", h2_style))
    story.append(Paragraph(
        "By implementing shap.TreeExplainer, MedInsight AI computes exact Shapley values in polynomial time O(TLD^2). On the user dashboard, this is rendered as an intuitive horizontal bar chart: biomarkers pushing risk upward appear in red/coral with positive values, while protective biomarkers appear in blue/teal with negative values, allowing users and clinicians to immediately understand <i>why</i> a score was assigned.",
        body_style
    ))

    story.append(Spacer(1, 4))

    # =========================================================================
    # SECTION 5: THEORY OF LONGITUDINAL TEMPORAL TRACKING
    # =========================================================================
    story.append(Paragraph("5. Theory of Longitudinal Tracking & Trend Analysis", h1_style))
    story.append(Paragraph(
        "A single laboratory test is merely a static snapshot in time. In preventive healthcare and chronic disease management (e.g., diabetes, dyslipidemia, kidney disease), <b>temporal trajectory</b> provides far superior diagnostic and prognostic insight than any single isolated test.",
        body_style
    ))
    story.append(Paragraph(
        "MedInsight AI aggregates a patient's historical test records chronologically and computes the delta change percentage between consecutive measurements t-1 and t:",
        body_style
    ))
    story.append(Paragraph("Delta_relative = [ (V_t - V_{t-1}) / V_{t-1} ] * 100%", code_style))
    story.append(Paragraph(
        "Trends are automatically classified into clinical trajectory categories: <b>Increased</b> (Delta &gt; +2%), <b>Decreased</b> (Delta &lt; -2%), or <b>Stable</b> (|Delta| &lt;= 2%). Interactive multi-point line charts render the trajectory alongside physiological reference boundaries, enabling users to visually track whether therapeutic interventions or lifestyle changes are moving biomarkers in a healthy direction.",
        body_style
    ))

    story.append(Spacer(1, 4))

    # =========================================================================
    # SECTION 6: FULL-STACK SYSTEM ARCHITECTURE
    # =========================================================================
    story.append(Paragraph("6. Full-Stack System Architecture & Engineering", h1_style))
    story.append(Paragraph(
        "MedInsight AI is built upon an enterprise-grade three-tier decoupled microservice architecture ensuring operational modularity, high availability, and defense-in-depth security:",
        body_style
    ))

    # Architecture Table
    arch_data = [
        [Paragraph("<b>Layer</b>", body_style), Paragraph("<b>Tech Stack</b>", body_style), Paragraph("<b>Theoretical & Practical Role</b>", body_style)],
        [
            Paragraph("<b>Frontend UI</b>", body_style),
            Paragraph("React 18, Vite, Tailwind CSS, Recharts, Lucide", body_style),
            Paragraph("Single-page application (SPA) providing intuitive health dashboards, drag & drop uploader, live processing timelines, SHAP impact charts, and interactive RAG chat.", body_style)
        ],
        [
            Paragraph("<b>Backend API</b>", body_style),
            Paragraph("Node.js, Express, JWT, Multer, Axios", body_style),
            Paragraph("Gateway orchestrator handling user identity, bcrypt password encryption, stateless JWT auth, file validation, database persistence, and proxying to AI microservices.", body_style)
        ],
        [
            Paragraph("<b>AI Microservice</b>", body_style),
            Paragraph("Python 3.12, FastAPI, PyMuPDF, Scikit-Learn, SHAP, FAISS", body_style),
            Paragraph("High-performance computational microservice executing PDF parsing, OCR, clinical regex NER, vector embeddings, FAISS indexing, LLM prompting, and SHAP calculations.", body_style)
        ],
        [
            Paragraph("<b>Database</b>", body_style),
            Paragraph("MongoDB, Mongoose ORM", body_style),
            Paragraph("Document store persisting User records, MedicalReports, individual MedicalTests (biomarkers), and complete Analysis documents with strict multi-tenant isolation.", body_style)
        ]
    ]

    arch_table = Table(arch_data, colWidths=[1.1 * inch, 1.8 * inch, 4.1 * inch])
    arch_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), bg_light),
        ('GRID', (0, 0), (-1, -1), 0.5, border_color),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
    ]))
    story.append(arch_table)

    story.append(PageBreak())

    # =========================================================================
    # SECTION 7: SAFETY, ETHICS & NON-DIAGNOSTIC GUARDRAILS
    # =========================================================================
    story.append(Paragraph("7. Medical Ethics, Clinical Safety & Guardrails", h1_style))
    story.append(Paragraph(
        "Deploying artificial intelligence in medical domains introduces significant ethical responsibilities. MedInsight AI implements strict clinical safety architecture to protect patient well-being:",
        body_style
    ))
    story.append(Paragraph("• <b>Non-Diagnostic Intent:</b> The platform functions strictly as a health literacy and educational decision-support tool. It does not issue diagnostic declarations or prescribe medications.", bullet_style))
    story.append(Paragraph("• <b>Doctor-in-the-Loop Paradigm:</b> Every explanation generated by the platform includes suggested questions for the patient to present to their qualified medical provider.", bullet_style))
    story.append(Paragraph("• <b>Deterministic Fallbacks:</b> If an AI component (LLM API or embedding service) experiences latency or failure, the platform's deterministic rules ensure extracted lab values and abnormality flags remain fully visible.", bullet_style))
    story.append(Paragraph("• <b>Data Privacy & Security:</b> User passwords are encrypted with bcrypt (10 salt rounds). JWT authentication ensures patients can access only their own medical records.", bullet_style))

    story.append(Spacer(1, 6))

    # =========================================================================
    # SECTION 8: SHORT INFO FOR QUICK & EASY UNDERSTANDING
    # =========================================================================
    story.append(HRFlowable(width="100%", thickness=1.5, color=navy, spaceBefore=4, spaceAfter=8))
    story.append(Paragraph("8. Short Info for Quick & Easy Understanding", h1_style))
    story.append(Paragraph(
        "A distilled, quick-reference guide designed for students, developers, evaluators, and end-users to understand the platform in under 2 minutes:",
        body_style
    ))

    # Elevator Pitch Box
    pitch_data = [
        [
            Paragraph(
                "<b>THE 30-SECOND ELEVATOR PITCH:</b><br/>"
                "<b>MedInsight AI</b> is an AI-powered personal health report assistant. A user uploads a medical laboratory report (PDF or scanned image), and the platform instantly extracts all medical test values, flags what is <b>Normal</b> or <b>Abnormal</b>, explains what the results mean in plain English, calculates disease screening risk using machine learning, explains the risk using <b>SHAP</b> charts, allows the user to chat directly with their report via <b>RAG</b>, and tracks biomarker trends across multiple visits over time.",
                callout_style
            )
        ]
    ]
    pitch_table = Table(pitch_data, colWidths=[7.0 * inch])
    pitch_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), callout_bg),
        ('BOX', (0, 0), (-1, -1), 1, callout_border),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
    ]))
    story.append(pitch_table)
    story.append(Spacer(1, 6))

    # Terminology Cheat Sheet
    story.append(Paragraph("Terminology Cheat Sheet", h2_style))
    glossary_data = [
        [Paragraph("<b>Term</b>", body_style), Paragraph("<b>Simple Meaning</b>", body_style), Paragraph("<b>Role in MedInsight AI</b>", body_style)],
        [
            Paragraph("<b>PyMuPDF</b>", body_style),
            Paragraph("Fast Python library for PDF files.", body_style),
            Paragraph("Extracts text and tabular columns from digital PDFs without losing spatial formatting.", body_style)
        ],
        [
            Paragraph("<b>OCR</b>", body_style),
            Paragraph("Optical Character Recognition.", body_style),
            Paragraph("Reads text from scanned images and photos when digital text is not embedded.", body_style)
        ],
        [
            Paragraph("<b>NER</b>", body_style),
            Paragraph("Named Entity Recognition.", body_style),
            Paragraph("Identifies test names (e.g. Glucose), observed numerical values, units, and ranges.", body_style)
        ],
        [
            Paragraph("<b>FAISS</b>", body_style),
            Paragraph("Vector database library by Meta.", body_style),
            Paragraph("Stores document text chunks as mathematical vectors for instant semantic retrieval.", body_style)
        ],
        [
            Paragraph("<b>RAG</b>", body_style),
            Paragraph("Retrieval-Augmented Generation.", body_style),
            Paragraph("Feeds relevant report passages into the LLM so it answers questions without hallucinating.", body_style)
        ],
        [
            Paragraph("<b>Random Forest</b>", body_style),
            Paragraph("Ensemble machine learning model.", body_style),
            Paragraph("Combines multiple decision trees to screen cardiometabolic disease risk.", body_style)
        ],
        [
            Paragraph("<b>SHAP</b>", body_style),
            Paragraph("Explainable AI (Shapley Values).", body_style),
            Paragraph("Shows exactly which test values pushed screening risk up (red) or down (blue).", body_style)
        ]
    ]

    glossary_table = Table(glossary_data, colWidths=[1.1 * inch, 2.3 * inch, 3.6 * inch])
    glossary_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), bg_light),
        ('GRID', (0, 0), (-1, -1), 0.5, border_color),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
    ]))
    story.append(glossary_table)
    story.append(Spacer(1, 6))

    # User Journey
    story.append(Paragraph("Step-by-Step User Journey", h2_style))
    steps = [
        "<b>1. Sign Up / Sign In:</b> User accesses their personal account secured with encrypted credentials.",
        "<b>2. Upload Report:</b> User drags & drops any lab document (PDF, PNG, JPG) onto the dashboard.",
        "<b>3. Automated Ingestion:</b> Fast pipeline parses text via PyMuPDF/OCR, extracts tests, and detects ranges.",
        "<b>4. View Dashboard:</b> Structured results appear with clear badges (Normal, High, Low, Critical).",
        "<b>5. Read AI Explanations:</b> Plain-English explanations clarify the biological role of each test.",
        "<b>6. Inspect Risk & SHAP:</b> Visual bars reveal which biomarkers drove the statistical risk screening.",
        "<b>7. Interactive Q&A:</b> User chats with their report using grounded RAG without medical hallucinations.",
        "<b>8. Track Trends Over Time:</b> Multi-report line charts illustrate health trajectory across checkups."
    ]
    for s in steps:
        story.append(Paragraph(s, bullet_style))

    story.append(Spacer(1, 6))

    # Safety Notice Box
    safety_data = [
        [
            Paragraph(
                "<b>SAFETY & REGULATORY NOTICE:</b><br/>"
                "MedInsight AI is an informational and health-literacy decision-support tool. "
                "It does NOT provide medical diagnoses, treatment plans, or prescriptions. "
                "Users must always consult licensed medical professionals for clinical diagnoses and treatment decisions.",
                ParagraphStyle('NoticeStyle', parent=body_style, textColor=colors.HexColor("#854d0e"))
            )
        ]
    ]
    safety_table = Table(safety_data, colWidths=[7.0 * inch])
    safety_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), notice_bg),
        ('BOX', (0, 0), (-1, -1), 1, notice_border),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
    ]))
    story.append(safety_table)

    # Build Document
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Generated {output_filename} successfully!")

if __name__ == "__main__":
    build_pdf()
