import React from 'react';
import { Activity, ShieldCheck, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-white border-t border-slate-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center text-white text-xs shadow-sm">
              <Activity className="w-4 h-4" />
            </div>
            <span className="font-bold text-slate-800 text-sm">MedInsight AI</span>
            <span className="text-slate-400 text-xs">&bull; Medical Report Analysis & RAG Platform</span>
          </div>

          <div className="flex items-center space-x-6 text-xs text-slate-500">
            <span className="flex items-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Non-Diagnostic Educational Support</span>
            </span>
            <span>&bull;</span>
            <span>Privacy Preserving</span>
            <span>&bull;</span>
            <span>&copy; {new Date().getFullYear()} MedInsight AI</span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100 text-center text-[11px] text-slate-400 leading-relaxed max-w-4xl mx-auto">
          MedInsight AI is designed solely for informational and educational health literacy purposes. The AI analysis, abnormality tags, and risk screening estimates provided by this application are not a clinical diagnosis, medical opinion, or treatment plan. Always consult a qualified medical doctor or laboratory pathologist for medical questions.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
