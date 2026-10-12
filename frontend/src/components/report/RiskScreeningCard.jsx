import React, { useState } from 'react';
import { Activity, ChevronDown, ChevronUp } from 'lucide-react';
import ShapChart from './ShapChart';

const RiskScreeningCard = ({ riskPrediction, shapValues = [] }) => {
  const [showShap, setShowShap] = useState(false);
  const hasPrediction = Boolean(riskPrediction?.available && riskPrediction?.riskScore !== null && riskPrediction?.riskScore !== undefined);
  const riskLevel = riskPrediction?.riskLevel || 'Unavailable';
  const riskScore = hasPrediction ? riskPrediction.riskScore : 0;

  const levelColorMap = {
    Low: { text: 'text-emerald-600', stroke: '#10b981', bg: 'bg-emerald-50', border: 'border-emerald-200' },
    Moderate: { text: 'text-amber-600', stroke: '#f59e0b', bg: 'bg-amber-50', border: 'border-amber-200' },
    Elevated: { text: 'text-rose-600', stroke: '#f43f5e', bg: 'bg-rose-50', border: 'border-rose-200' },
  };

  const currentTheme = levelColorMap[riskLevel] || {
    text: 'text-slate-500',
    stroke: '#cbd5e1',
    bg: 'bg-slate-50',
    border: 'border-slate-200',
  };

  // Gauge calculations
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * Math.min(100, Math.max(0, riskScore))) / 100;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Risk Screening</h3>
            <p className="text-[11px] text-slate-400">Statistical cardiometabolic screening</p>
          </div>
        </div>
        <span className="text-[10px] font-mono text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">
          {riskPrediction?.modelName || 'ML screening model'}
        </span>
      </div>

      {hasPrediction ? (
        <div className="flex items-center justify-center py-2">
          <div className="relative flex items-center justify-center w-36 h-36">
          <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
            {/* Background Circle */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              stroke="#f1f5f9"
              strokeWidth="9"
              fill="transparent"
            />
            {/* Animated Gauge Arc */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              stroke={currentTheme.stroke}
              strokeWidth="9"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          </svg>

          {/* Center Content */}
          <div className="absolute flex flex-col items-center justify-center text-center">
            <span className={`text-sm font-bold ${currentTheme.text}`}>
              {riskLevel} Risk
            </span>
            <span className="text-[11px] font-semibold text-slate-500">
              {riskScore}%
            </span>
          </div>
        </div>
        </div>
      ) : (
        <div className="py-4 text-center">
          <p className="text-sm font-semibold text-slate-700">Screening estimate unavailable</p>
          <p className="mt-1 text-xs text-slate-500">
            {riskPrediction?.message || 'There is not enough structured report data for this screening model.'}
          </p>
        </div>
      )}

      {hasPrediction && (
        <div className={`rounded-lg border p-3 text-xs ${currentTheme.bg} ${currentTheme.border}`}>
          <p className="font-semibold text-slate-800">Based on: {(riskPrediction.featuresUsed || []).join(', ') || 'report biomarkers'}</p>
          <p className="mt-1 text-slate-600">{riskPrediction.message}</p>
          <p className="mt-2 border-t border-slate-200 pt-2 text-slate-600">
            Screening only. This prototype model is not clinically validated and must not be used to diagnose or guide treatment. Missing inputs may be estimated by the model.
          </p>
        </div>
      )}

      {/* Expandable SHAP Explainability if available */}
      {hasPrediction && shapValues && shapValues.length > 0 && (
        <div className="pt-2 border-t border-slate-100">
          <button
            onClick={() => setShowShap(!showShap)}
            className="w-full flex items-center justify-between text-xs text-slate-500 hover:text-slate-800 transition-colors py-1"
          >
            <span className="font-medium">Model Feature Attributions (SHAP)</span>
            {showShap ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          {showShap && (
            <div className="mt-3">
              <ShapChart shapValues={shapValues} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RiskScreeningCard;
