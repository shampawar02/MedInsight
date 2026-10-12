import React from 'react';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import UploadBox from '../components/upload/UploadBox';
import { ArrowLeft, ShieldCheck, Lock, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

const UploadPage = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center space-x-2 text-xs font-medium text-slate-500">
          <Link to="/dashboard" className="hover:text-slate-800 flex items-center space-x-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Dashboard</span>
          </Link>
          <span>/</span>
          <span className="text-slate-800">Upload Report</span>
        </div>

        {/* Page Title & Subtitle */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Upload Medical Report
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Upload your laboratory results, blood tests, or diagnostic reports for AI analysis.
          </p>
        </div>

        {/* Two-Column Layout (Matching Mockup Screen 3) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Drag & Drop Upload (approx 65%) */}
          <div className="lg:col-span-7 xl:col-span-8">
            <UploadBox />
          </div>

          {/* Right Column: 3 Security & Performance Features (approx 35%) */}
          <div className="lg:col-span-5 xl:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-7 space-y-6">
            {/* Feature 1 */}
            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 flex-shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900">Account-Scoped Access</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Reports are restricted to the signed-in account that uploaded them. Files are stored by this deployment.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 flex-shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900">AI Provider Data Handling</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  When Gemini is configured, report context may be sent to Google to generate summaries and answers. Check your deployment's data policy before uploading sensitive records.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 flex-shrink-0">
                <Zap className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900">Fast Processing</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Get complete analysis and insights in under 30 seconds.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Full-width Safety Notice (Matching Mockup Screen 3) */}
        <div className="bg-sky-50/70 border border-sky-200/90 rounded-2xl p-4 sm:p-5 flex items-start space-x-3.5 text-xs text-sky-900 leading-relaxed shadow-xs">
          <ShieldCheck className="w-5 h-5 text-sky-600 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-sky-950 block text-sm mb-0.5">
              Important Safety Notice
            </span>
            MedInsight is an informational tool, not a medical diagnosis or treatment service. This project does not by itself certify HIPAA compliance or end-to-end encryption. Use only with data and infrastructure approved for your deployment, and consult a qualified healthcare professional about medical decisions.
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default UploadPage;
