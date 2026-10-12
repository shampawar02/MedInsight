import React, { useState, useEffect } from 'react';
import { X, BookOpen, HeartPulse, Apple, AlertCircle, Loader2 } from 'lucide-react';
import api from '../../api/axios';
import StatusBadge from './StatusBadge';

const TermExplanationModal = ({ test, isOpen, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && test) {
      setLoading(true);
      setError(null);
      setData(null);

      api.post('/reports/explain-term', {
        testName: test.testName,
        value: test.value,
        unit: test.unit,
        status: test.status,
      })
        .then((res) => {
          setData(res.data?.data);
          setLoading(false);
        })
        .catch((err) => {
          setError(err.message || 'Failed to fetch medical explanation.');
          setLoading(false);
        });
    }
  }, [isOpen, test]);

  if (!isOpen || !test) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 relative space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-brand-600 uppercase tracking-wider mb-1">
            <BookOpen className="w-4 h-4" />
            <span>Educational Biomarker Guide</span>
          </div>
          <h3 className="text-xl font-bold text-slate-900">{test.testName}</h3>
          <div className="flex items-center space-x-3 mt-2">
            <span className="text-xs text-slate-500">
              Report Value: <strong className="text-slate-800">{test.value} {test.unit}</strong>
            </span>
            <StatusBadge status={test.status} />
          </div>
        </div>

        {/* Content Body */}
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
            <p className="text-xs text-slate-500 font-medium">
              Generating educational summary for {test.testName}...
            </p>
          </div>
        ) : error ? (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl">
            {error}
          </div>
        ) : data ? (
          <div className="space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed">
            {/* Section 1: Explanation */}
            <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1">
              <h4 className="font-bold text-slate-900 flex items-center space-x-1.5">
                <HeartPulse className="w-4 h-4 text-brand-600" />
                <span>What is this test?</span>
              </h4>
              <p className="text-slate-600 text-xs">{data.explanation}</p>
            </div>

            {/* Section 2: Clinical Status Context */}
            {data.general_context && (
              <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1">
                <h4 className="font-bold text-slate-900 flex items-center space-x-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <span>Understanding your result ({test.status})</span>
                </h4>
                <p className="text-slate-600 text-xs">{data.general_context}</p>
              </div>
            )}

            {/* Section 3: Lifestyle & Wellness */}
            {data.dietary_lifestyle_context && (
              <div className="p-3.5 bg-emerald-50/60 border border-emerald-200/80 rounded-xl space-y-1">
                <h4 className="font-bold text-emerald-950 flex items-center space-x-1.5">
                  <Apple className="w-4 h-4 text-emerald-600" />
                  <span>General Lifestyle & Nutrition Context</span>
                </h4>
                <p className="text-emerald-900 text-xs">{data.dietary_lifestyle_context}</p>
              </div>
            )}
          </div>
        ) : null}

        {/* Modal Footer Note */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <span>Non-diagnostic educational reference</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default TermExplanationModal;
