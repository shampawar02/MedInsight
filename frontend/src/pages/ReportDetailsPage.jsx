import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import LoadingSpinner from '../components/common/LoadingSpinner';
import SafetyNotice from '../components/common/SafetyNotice';
import MedicalTable from '../components/report/MedicalTable';
import AISummaryCard from '../components/report/AISummaryCard';
import RiskScreeningCard from '../components/report/RiskScreeningCard';
import HistoricalTrendChart from '../components/report/HistoricalTrendChart';
import ReportChat from '../components/report/ReportChat';
import TermExplanationModal from '../components/report/TermExplanationModal';
import api from '../api/axios';
import {
  FileText,
  Calendar,
  Layers,
  BrainCircuit,
  TrendingUp,
  MessageSquare,
  ArrowLeft,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Download,
} from 'lucide-react';

const ReportDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState(null);
  const [tests, setTests] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState(null);

  // Tab State: 'overview', 'screening', 'chat', 'history'
  const [activeTab, setActiveTab] = useState('overview');

  // Term explanation modal state
  const [explainingTest, setExplainingTest] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchReportDetails = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/reports/${id}`);
        setReport(res.data?.report);
        setTests(res.data?.tests || []);
        setAnalysis(res.data?.analysis);
      } catch (err) {
        console.error('Failed to fetch report:', err);
        setError(err.response?.data?.message || 'Failed to load report details.');
      } finally {
        setLoading(false);
      }
    };

    fetchReportDetails();
  }, [id]);

  const handleOpenExplain = (test) => {
    setExplainingTest(test);
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this report? This cannot be undone.')) return;
    try {
      await api.delete(`/reports/${id}`);
      navigate('/dashboard');
    } catch (err) {
      alert('Failed to delete report.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner message="Loading comprehensive report analysis..." size="lg" />
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar />
        <main className="flex-1 max-w-4xl mx-auto w-full p-6 text-center space-y-4 my-auto">
          <div className="p-6 bg-white rounded-2xl border border-rose-200 text-rose-800 text-xs sm:text-sm max-w-md mx-auto space-y-3">
            <AlertCircle className="w-8 h-8 text-rose-600 mx-auto" />
            <h3 className="font-bold text-base text-rose-950">Report Not Found</h3>
            <p>{error || 'This medical report could not be found or you do not have permission to view it.'}</p>
            <Link
              to="/dashboard"
              className="inline-block px-4 py-2 bg-rose-600 text-white rounded-lg text-xs font-semibold"
            >
              Back to Dashboard
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const abnormalCount = tests.filter((t) => t.status !== 'NORMAL').length;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 selection:bg-brand-100 selection:text-brand-900">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Navigation Breadcrumbs */}
        <div className="flex items-center justify-between">
          <Link
            to="/dashboard"
            className="text-xs font-medium text-slate-500 hover:text-slate-800 flex items-center space-x-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Reports</span>
          </Link>
        </div>

        {/* Report Overview Header Card (Matching Mockup Screen 4) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 flex-shrink-0">
              <FileText className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                Lab Report - {report.originalName?.replace(/\.[^/.]+$/, '') || 'Diagnostic Panel'}
              </h1>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="px-2 py-0.5 rounded-md bg-slate-100 font-mono text-slate-600 uppercase text-[11px] font-semibold">
                  {report.fileType || 'PDF'}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[11px]">
                  {report.fileSize ? `${(report.fileSize / (1024 * 1024)).toFixed(1)} MB` : '1.2 MB'}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[11px]">
                  {new Date(report.reportDate || report.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
                  Processed
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2.5">
            <button
              onClick={() => window.open(`/api/reports/${id}/download`, '_blank')}
              className="px-3.5 py-2 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center space-x-1.5"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Download Report</span>
            </button>
            <button
              onClick={handleDelete}
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors border border-transparent hover:border-rose-100"
              title="Delete Report"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Two-Column Analysis Layout (Matching Mockup Screen 4) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column (approx 60%): Extracted Biomarkers Table */}
          <div className="lg:col-span-7 xl:col-span-7 space-y-6">
            <MedicalTable tests={tests} onExplainTest={handleOpenExplain} />
          </div>

          {/* Right Column (approx 40%): AI Summary, Risk Screening, Ask AI */}
          <div className="lg:col-span-5 xl:col-span-5 space-y-6">
            {/* Card 1: AI Summary */}
            <AISummaryCard
              summary={analysis?.summary}
              abnormalities={analysis?.abnormalities || []}
            />

            {/* Card 2: Risk Screening */}
            <RiskScreeningCard
              riskPrediction={analysis?.riskPrediction}
              shapValues={analysis?.shapValues || []}
              tests={tests}
            />

            {/* Card 3: Ask AI About Your Report */}
            <ReportChat reportId={report._id} />
          </div>
        </div>

        {/* Safety Notice */}
        <SafetyNotice />
      </main>

      {/* Term explanation modal */}
      <TermExplanationModal
        test={explainingTest}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setExplainingTest(null);
        }}
      />

      <Footer />
    </div>
  );
};

export default ReportDetailsPage;
