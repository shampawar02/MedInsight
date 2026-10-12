import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import {
  ArrowRight,
  Clock,
  ShieldCheck,
  FileCheck,
  CheckCircle,
  FileText,
  AlertTriangle,
  Activity,
  MessageSquareText,
} from 'lucide-react';

const LandingPage = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 selection:bg-brand-100 selection:text-brand-900">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-12 pb-16 lg:pt-16 lg:pb-20 bg-white border-b border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              {/* Left Column: Headline and CTAs (7 cols) */}
              <div className="lg:col-span-7 space-y-6">
                <div className="text-[11px] font-bold text-brand-600 tracking-wider uppercase">
                  CLINICAL INTELLIGENCE PLATFORM
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-[52px] font-extrabold text-slate-900 tracking-tight leading-[1.12]">
                  Smarter Insights.
                  <br />
                  <span className="text-brand-600">Better Health Decisions.</span>
                </h1>

                <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-xl">
                  Upload your medical lab reports and get structured results, abnormal-value detection, AI-powered explanations, disease-risk screening, and report-based Q&A — all in one place.
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <Link
                    to={isAuthenticated ? '/upload' : '/upload'}
                    className="px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white font-medium text-sm rounded-lg shadow-sm shadow-brand-500/20 transition-all flex items-center space-x-2"
                  >
                    <span>Upload Report</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>

                  <a
                    href="#features"
                    className="px-6 py-3 bg-white hover:bg-slate-50 text-slate-700 font-medium text-sm rounded-lg border border-slate-200 transition-colors"
                  >
                    Explore Features
                  </a>
                </div>
              </div>

              {/* Right Column: Hero Graphic with Document & Orbital Feature Pills (5 cols) */}
              <div className="lg:col-span-5 relative flex justify-center lg:justify-end">
                <div className="relative w-full max-w-[400px] py-4">
                  {/* Glowing background gradient */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-sky-100/70 rounded-full blur-3xl opacity-70 -z-10" />

                  {/* Main Central Card Illustration */}
                  <div className="relative mx-auto w-[230px] bg-white rounded-2xl shadow-xl shadow-slate-200/80 border border-slate-100 p-5 space-y-3 z-10">
                    {/* Card Header with Red Cross */}
                    <div className="flex items-center space-x-2 pb-1 border-b border-slate-100">
                      <div className="w-6 h-6 rounded-md bg-rose-50 border border-rose-100 flex items-center justify-center">
                        <span className="text-rose-600 text-sm font-bold leading-none">+</span>
                      </div>
                      <div className="h-2 w-20 bg-slate-200 rounded-full" />
                    </div>

                    {/* Report Content Lines */}
                    <div className="space-y-2 pt-1">
                      <div className="h-1.5 w-full bg-slate-100 rounded-full" />
                      <div className="h-1.5 w-4/5 bg-slate-100 rounded-full" />
                      <div className="h-1.5 w-3/4 bg-slate-100 rounded-full" />
                      <div className="h-1.5 w-5/6 bg-slate-100 rounded-full" />
                    </div>

                    {/* AI Badge Pill at Bottom Right */}
                    <div className="pt-2 flex justify-end">
                      <div className="px-3 py-1 bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-sm shadow-emerald-500/30">
                        AI
                      </div>
                    </div>
                  </div>

                  {/* Orbital Action Badges */}
                  <div className="space-y-2.5 mt-5 lg:mt-0 lg:absolute lg:top-3 lg:right-0 flex flex-col items-end">
                    {/* Badge 1: Extract & Analyze */}
                    <div className="bg-white/95 backdrop-blur-sm px-3.5 py-1.5 rounded-full border border-slate-200/80 shadow-sm flex items-center space-x-2 text-xs text-slate-700 font-medium">
                      <FileText className="w-3.5 h-3.5 text-brand-600" />
                      <span>Extract & Analyze</span>
                    </div>

                    {/* Badge 2: Detect Abnormalities */}
                    <div className="bg-white/95 backdrop-blur-sm px-3.5 py-1.5 rounded-full border border-slate-200/80 shadow-sm flex items-center space-x-2 text-xs text-slate-700 font-medium lg:mr-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Detect Abnormalities</span>
                    </div>

                    {/* Badge 3: Risk Screening */}
                    <div className="bg-white/95 backdrop-blur-sm px-3.5 py-1.5 rounded-full border border-slate-200/80 shadow-sm flex items-center space-x-2 text-xs text-slate-700 font-medium">
                      <Activity className="w-3.5 h-3.5 text-brand-600" />
                      <span>Risk Screening</span>
                    </div>

                    {/* Badge 4: Q&A with AI */}
                    <div className="bg-white/95 backdrop-blur-sm px-3.5 py-1.5 rounded-full border border-slate-200/80 shadow-sm flex items-center space-x-2 text-xs text-slate-700 font-medium lg:mr-3">
                      <MessageSquareText className="w-3.5 h-3.5 text-brand-600" />
                      <span>Q&A with AI</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4 Feature Highlights Grid (Matches Mockup Bottom Row) */}
        <section id="features" className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Feature 1 */}
            <div className="bg-white rounded-xl border border-slate-200/80 p-5 flex items-start space-x-4 shadow-sm hover:border-slate-300 transition-colors">
              <div className="w-9 h-9 rounded-full bg-sky-50 border border-sky-100 text-brand-600 flex items-center justify-center flex-shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-sm font-bold text-slate-900">Fast & Accurate</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  AI-powered analysis in seconds
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="bg-white rounded-xl border border-slate-200/80 p-5 flex items-start space-x-4 shadow-sm hover:border-slate-300 transition-colors">
              <div className="w-9 h-9 rounded-full bg-sky-50 border border-sky-100 text-brand-600 flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-sm font-bold text-slate-900">Data Security</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Your data is always protected
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="bg-white rounded-xl border border-slate-200/80 p-5 flex items-start space-x-4 shadow-sm hover:border-slate-300 transition-colors">
              <div className="w-9 h-9 rounded-full bg-sky-50 border border-sky-100 text-brand-600 flex items-center justify-center flex-shrink-0">
                <FileCheck className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-sm font-bold text-slate-900">Evidence-Based</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Grounded in medical knowledge
                </p>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="bg-white rounded-xl border border-slate-200/80 p-5 flex items-start space-x-4 shadow-sm hover:border-slate-300 transition-colors">
              <div className="w-9 h-9 rounded-full bg-sky-50 border border-sky-100 text-brand-600 flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-sm font-bold text-slate-900">Easy to Use</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Simple, clean and intuitive
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default LandingPage;
