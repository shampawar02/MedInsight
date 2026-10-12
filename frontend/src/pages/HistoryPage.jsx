import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import SafetyNotice from '../components/common/SafetyNotice';
import HistoricalTrendChart from '../components/report/HistoricalTrendChart';

const HistoryPage = () => (
  <div className="min-h-screen flex flex-col bg-slate-50">
    <Navbar />
    <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center space-x-2 text-xs font-medium text-slate-500">
        <Link to="/dashboard" className="hover:text-slate-800 flex items-center space-x-1">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Dashboard</span>
        </Link>
        <span>/</span>
        <span className="text-slate-800">Biomarker Trends</span>
      </div>
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Biomarker Trends</h1>
        <p className="text-sm text-slate-500 mt-1">
          Compare measurements extracted from your processed reports.
        </p>
      </header>
      <HistoricalTrendChart />
      <SafetyNotice />
    </main>
    <Footer />
  </div>
);

export default HistoryPage;
