import React from 'react';
import { ShieldAlert } from 'lucide-react';

const SafetyNotice = ({ className = '' }) => {
  return (
    <div
      className={`bg-amber-50/80 border border-amber-200/90 rounded-xl p-3.5 flex items-start space-x-3 text-amber-900 text-xs leading-relaxed ${className}`}
    >
      <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
      <div>
        <span className="font-semibold text-amber-950 block mb-0.5">Important Safety Notice</span>
        MedInsight AI provides informational and decision-support insights based strictly on the uploaded report. AI explanations and machine learning risk predictions should not be treated as a medical diagnosis or a replacement for professional clinical care.
      </div>
    </div>
  );
};

export default SafetyNotice;
