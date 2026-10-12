import React from 'react';
import { Brain, AlertCircle, CheckCircle2, Sparkles } from 'lucide-react';
import StatusBadge from './StatusBadge';

const AISummaryCard = ({ summary, abnormalities = [] }) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">AI Summary</h3>
            <p className="text-[11px] text-slate-400">Clinical synthesis of test parameters</p>
          </div>
        </div>
        <span className="text-[10px] font-semibold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200">
          AI Generated
        </span>
      </div>

      {/* Summary Narrative */}
      <div className="bg-slate-50/70 border border-slate-200/70 rounded-xl p-4 text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
        {summary || 'AI Summary is currently unavailable for this document.'}
      </div>

      {/* Abnormal Findings Quick Cards */}
      {abnormalities.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
            <span>Parameters Outside Reference Intervals ({abnormalities.length})</span>
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {abnormalities.map((item, idx) => (
              <div
                key={idx}
                className="bg-white border border-slate-200/90 rounded-xl p-3.5 flex flex-col justify-between hover:border-slate-300 transition-colors"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-semibold text-slate-800 text-xs">
                    {item.testName}
                  </span>
                  <StatusBadge status={item.status} />
                </div>
                <div className="text-xs text-slate-600 mb-2">
                  <span className="font-bold text-slate-900">{item.value}</span> {item.unit}{' '}
                  <span className="text-slate-400">
                    (Standard: {item.referenceRange || 'Reference'})
                  </span>
                </div>
                {item.clinicalSignificance && (
                  <p className="text-[11px] text-slate-500 leading-snug bg-slate-50 p-2 rounded-lg border border-slate-100">
                    {item.clinicalSignificance}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AISummaryCard;
