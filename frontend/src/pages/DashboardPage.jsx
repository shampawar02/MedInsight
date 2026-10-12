import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import LoadingSpinner from '../components/common/LoadingSpinner';
import api from '../api/axios';
import {
  FileText,
  AlertTriangle,
  Upload,
  Calendar,
  ChevronDown,
  Eye,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

const DashboardPage = () => {
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState({
    totalReports: 0,
    abnormalCount: 0,
    latestReport: null,
  });
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    try {
      const res = await api.get('/reports');
      const repList = res.data?.reports || [];
      setReports(repList);
      setStats(
        res.data?.stats || {
          totalReports: repList.length,
          abnormalCount: 0,
          latestReport: repList[0] || null,
        }
      );
    } catch (err) {
      console.error('Failed to load user reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Date unavailable';
    const d = new Date(dateStr);
    return isNaN(d.getTime())
      ? 'Date unavailable'
      : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getFileFormat = (fileName) => {
    if (!fileName) return 'PDF';
    const ext = fileName.split('.').pop().toUpperCase();
    return ext === 'JPEG' ? 'JPG' : ext;
  };

  const processedCount = reports.filter((report) => report.status === 'PROCESSED').length;
  const pendingCount = reports.filter((report) => ['PENDING', 'PROCESSING'].includes(report.status)).length;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Top Header Row matching mockup */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Overview of your medical reports and AI insights.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            {/* Date filter dropdown */}
            <div className="relative">
              <button className="flex items-center space-x-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 transition-colors">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>Last 30 days</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>

            {/* Upload Report Button */}
            <Link
              to="/upload"
              className="flex items-center space-x-1.5 px-4 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-medium shadow-sm shadow-brand-500/20 transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Report</span>
            </Link>
          </div>
        </div>

        {/* 4 Metric Stat Cards matching mockup */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Reports */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-sm space-y-2">
            <div className="flex items-center space-x-2 text-slate-600">
              <div className="w-6 h-6 rounded-md bg-sky-50 text-brand-600 flex items-center justify-center">
                <FileText className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-semibold text-slate-700">Total Reports</span>
            </div>
            <div className="text-2xl font-bold text-slate-900">
              {stats.totalReports}
            </div>
            <div className="text-[11px] text-slate-500">
              {processedCount} processed
            </div>
          </div>

          {/* Card 2: Abnormal Values */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-sm space-y-2">
            <div className="flex items-center space-x-2 text-slate-600">
              <div className="w-6 h-6 rounded-md bg-amber-50 text-amber-600 flex items-center justify-center">
                <AlertTriangle className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-semibold text-slate-700">Abnormal Values</span>
            </div>
            <div className="text-2xl font-bold text-slate-900">
              {stats.abnormalCount}
            </div>
            <div className="text-[11px] text-slate-500">
              Across uploaded reports
            </div>
          </div>

          {/* Card 3: Latest Report */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-sm space-y-2">
            <div className="flex items-center space-x-2 text-slate-600">
              <div className="w-6 h-6 rounded-md bg-sky-50 text-brand-600 flex items-center justify-center">
                <Calendar className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-semibold text-slate-700">Latest Report</span>
            </div>
            <div className="text-base font-bold text-slate-900 truncate">
              {formatDate(stats.latestReport?.reportDate || stats.latestReport?.createdAt)}
            </div>
            <div className="pt-0.5">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                {stats.latestReport?.status || 'No reports'}
              </span>
            </div>
          </div>

          {/* Card 4: AI Analysis Status */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-sm space-y-2">
            <div className="flex items-center space-x-2 text-slate-600">
              <div className="w-6 h-6 rounded-md bg-indigo-50 text-brand-600 flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-semibold text-slate-700">AI Analysis Status</span>
            </div>
            <div className="text-base font-bold text-slate-900 flex items-center space-x-1.5">
              <span>{processedCount} processed</span>
            </div>
            <div className="pt-0.5">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                {pendingCount} pending
              </span>
            </div>
          </div>
        </div>

        {/* Main Content: Two Columns matching mockup */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Recent Medical Reports Table (8 of 12 cols = 65%) */}
          <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200/90 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Recent Medical Reports</h3>
              <Link
                to="/dashboard"
                className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center space-x-1"
              >
                <span>View all reports</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {loading ? (
              <div className="py-12">
                <LoadingSpinner message="Loading reports..." />
              </div>
            ) : reports.length === 0 ? (
              <div className="p-8 text-center space-y-3">
                <FileText className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs text-slate-500">No reports found. Upload a report to begin analysis.</p>
                <Link
                  to="/upload"
                  className="inline-flex items-center space-x-1.5 px-4 py-2 bg-brand-600 text-white rounded-lg text-xs font-medium"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Report</span>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/70 border-b border-slate-100 text-slate-500 font-semibold">
                    <tr>
                      <th className="py-3 px-5">Report</th>
                      <th className="py-3 px-4">Report Date</th>
                      <th className="py-3 px-4">Format</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {reports.slice(0, 5).map((r) => (
                      <tr key={r._id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-5 font-medium text-slate-800">
                          Medical report
                        </td>
                        <td className="py-3 px-4 text-slate-500">
                          {formatDate(r.reportDate || r.createdAt)}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-medium text-slate-600">
                            {getFileFormat(r.fileName || r.originalName)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {r.status === 'PROCESSING' || r.status === 'PENDING' ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                              {r.status === 'PENDING' ? 'Pending' : 'Processing'}
                            </span>
                          ) : r.status === 'FAILED' ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                              Failed
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              &bull; Processed
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-5 text-right">
                          <Link
                            to={`/reports/${r._id}`}
                            className="inline-flex items-center justify-center p-1.5 text-slate-400 hover:text-brand-600 hover:bg-slate-100 rounded-lg transition-colors"
                            title="View Report Analysis"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200/90 shadow-sm p-5 flex flex-col justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Report comparisons</h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-500">
                Review measured biomarker changes across your processed reports. Trends appear only when matching results are available.
              </p>
            </div>
            <Link to="/trends" className="inline-flex items-center gap-2 text-xs font-semibold text-brand-700 hover:text-brand-900">
              View biomarker trends <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default DashboardPage;
