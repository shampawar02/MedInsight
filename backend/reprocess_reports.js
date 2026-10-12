const mongoose = require('mongoose');
const path = require('path');
const MedicalReport = require('./models/MedicalReport');
const MedicalTest = require('./models/MedicalTest');
const Analysis = require('./models/Analysis');
const aiService = require('./services/aiService');

async function reprocessAll() {
  try {
    await mongoose.connect('mongodb://localhost:27017/medinsight');
    console.log('Connected to MongoDB');

    const reports = await MedicalReport.find({}).sort({ createdAt: -1 });
    console.log(`Found ${reports.length} reports in total.`);

    const targetId = process.argv[2];
    const force = process.argv.includes('--force');

    for (const report of reports) {
      if (targetId && !report._id.toString().includes(targetId) && !targetId.startsWith('--')) {
        continue;
      }
      const testCount = await MedicalTest.countDocuments({ reportId: report._id });
      console.log(`\nChecking Report ${report._id} (${report.fileName}): current test count = ${testCount}`);

      if (testCount === 0 || force || (targetId && !targetId.startsWith('--'))) {
        console.log(`Reprocessing ${report.fileName}...`);
        const fullPath = path.resolve(report.filePath);
        console.log(`Full path: ${fullPath}`);

        try {
          const aiResult = await aiService.processDocument(fullPath, report._id);
          console.log(`AI Processing success: ${aiResult.success}, tests extracted: ${aiResult.tests?.length || 0}`);

          if (aiResult.success) {
            report.extractedText = aiResult.extracted_text || '';
            if (aiResult.report_date) {
              const parsedDate = new Date(aiResult.report_date);
              if (!isNaN(parsedDate.getTime())) {
                report.reportDate = parsedDate;
              }
            }
            report.status = 'PROCESSED';
            await report.save();

            // Clear any old tests
            await MedicalTest.deleteMany({ reportId: report._id });

            // Insert new tests
            const testDocs = [];
            if (Array.isArray(aiResult.tests)) {
              for (const t of aiResult.tests) {
                testDocs.push({
                  reportId: report._id,
                  userId: report.userId,
                  testName: t.test_name,
                  normalizedName: t.normalized_name || t.test_name.toLowerCase(),
                  value: t.value,
                  unit: t.unit || '',
                  referenceRange: {
                    low: t.reference_range?.low ?? null,
                    high: t.reference_range?.high ?? null,
                    raw: t.reference_range?.raw || '',
                  },
                  status: t.status || 'NORMAL',
                  category: t.category || 'General',
                });
              }
            }
            if (testDocs.length > 0) {
              await MedicalTest.insertMany(testDocs);
              console.log(`Inserted ${testDocs.length} tests into MedicalTest collection.`);
            }

            // Update or create Analysis
            await Analysis.deleteMany({ reportId: report._id });
            const riskPred = aiResult.risk_prediction || { available: false };
            await Analysis.create({
              reportId: report._id,
              userId: report.userId,
              summary: aiResult.summary || 'Summary generated from uploaded report.',
              abnormalities: (aiResult.abnormalities || []).map((a) => ({
                testName: a.test_name,
                value: a.value,
                unit: a.unit,
                referenceRange: a.reference_range,
                status: a.status,
                clinicalSignificance: a.clinical_significance,
              })),
              riskPrediction: {
                available: !!riskPred.available,
                riskScore: riskPred.risk_score ?? null,
                riskLevel: riskPred.risk_level || 'UNKNOWN',
                message: riskPred.message || '',
                shapValues: (riskPred.shap_values || []).map((s) => ({
                  featureName: s.feature_name,
                  value: s.value,
                  shapValue: s.shap_value,
                  impact: s.impact,
                })),
              },
            });
            console.log(`Saved Analysis for Report ${report._id}!`);
          }
        } catch (err) {
          console.error(`Error processing report ${report._id}:`, err.message);
        }
      }
    }

    console.log('\nAll reports checked and reprocessed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Reprocessing failed:', err);
    process.exit(1);
  }
}

reprocessAll();

