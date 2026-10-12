const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const config = require('../config/config');

const aiClient = axios.create({
  baseURL: config.aiServiceUrl,
  timeout: 120000, // 2 minutes timeout for AI/RAG operations
  headers: {
    'X-Internal-Token': config.aiServiceInternalToken,
  },
});

/**
 * Sends a medical document file path to Python AI service for full extraction,
 * abnormality detection, RAG index creation, ML screening, and SHAP attribution.
 */
const processDocument = async (filePath, reportId) => {
  try {
    const formData = new FormData();
    formData.append('file_path', filePath);
    formData.append('report_id', reportId.toString());

    const response = await aiClient.post('/process-document', formData, {
      headers: {
        ...formData.getHeaders(),
      },
    });

    return response.data;
  } catch (error) {
    console.error('[AI Service Client Error - processDocument]:', error.message);
    if (error.response) {
      console.error('[AI Service Response Error]:', error.response.data);
    }
    throw new Error(
      error.response?.data?.detail ||
      'AI analysis is temporarily unavailable. Your uploaded report has been saved.'
    );
  }
};

/**
 * Ask a question about a report grounded in the FAISS vector index.
 */
const askQuestion = async (reportId, question, extractedText = '', tests = []) => {
  try {
    const formattedTests = Array.isArray(tests)
      ? tests.map((t) => ({
          test_name: t.testName || t.test_name || '',
          value: t.value,
          unit: t.unit || '',
          reference_range:
            t.referenceRange?.raw ||
            (t.referenceRange?.low !== undefined && t.referenceRange?.high !== undefined
              ? `${t.referenceRange.low} - ${t.referenceRange.high}`
              : t.reference_range || ''),
          status: t.status || 'NORMAL',
          category: t.category || '',
          clinical_significance: t.clinicalSignificance || t.clinical_significance || '',
        }))
      : [];

    const response = await aiClient.post('/ask', {
      report_id: reportId.toString(),
      question,
      extracted_text: extractedText,
      tests: formattedTests,
    });

    return response.data;
  } catch (error) {
    console.error('[AI Service Client Error - askQuestion]:', error.message);
    throw new Error('We could not retrieve relevant information from this report.');
  }
};

/**
 * Request an educational medical explanation for a biomarker.
 */
const explainTerm = async (testName, value, unit, status) => {
  try {
    const response = await aiClient.post('/explain-term', {
      test_name: testName,
      value: value ? Number(value) : null,
      unit: unit || '',
      status: status || 'NORMAL',
    });

    return response.data;
  } catch (error) {
    console.error('[AI Service Client Error - explainTerm]:', error.message);
    return {
      test_name: testName,
      explanation: `${testName} is a clinical biomarker evaluated in routine laboratory testing.`,
      general_context: `Observed value is marked as ${status}. Consult your physician for individualized medical advice.`,
      dietary_lifestyle_context: 'Maintain balanced hydration and standard nutritional wellness.',
    };
  }
};

const deleteReportIndex = async (reportId) => {
  try {
    const response = await aiClient.delete(`/reports/${reportId}/index`);
    return response.data;
  } catch (error) {
    console.error('[AI Service Client Error - deleteReportIndex]:', error.message);
    throw new Error('Could not securely remove the report search index. The report was not deleted.');
  }
};

module.exports = {
  processDocument,
  askQuestion,
  explainTerm,
  deleteReportIndex,
};
