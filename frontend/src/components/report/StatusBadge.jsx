import React from 'react';
import { ArrowUp, ArrowDown, Check, AlertTriangle } from 'lucide-react';

const StatusBadge = ({ status }) => {
  const normalized = (status || 'NORMAL').toUpperCase();

  const configs = {
    NORMAL: {
      bg: 'bg-emerald-50 border-emerald-200/80 text-emerald-700',
      icon: <Check className="w-3 h-3 text-emerald-600 mr-1" />,
      label: 'Normal',
    },
    HIGH: {
      bg: 'bg-amber-50 border-amber-200/80 text-amber-700',
      icon: <ArrowUp className="w-3 h-3 text-amber-600 mr-1" />,
      label: 'High',
    },
    LOW: {
      bg: 'bg-sky-50 border-sky-200/80 text-sky-700',
      icon: <ArrowDown className="w-3 h-3 text-sky-600 mr-1" />,
      label: 'Low',
    },
    CRITICAL: {
      bg: 'bg-rose-50 border-rose-200/80 text-rose-700',
      icon: <AlertTriangle className="w-3 h-3 text-rose-600 mr-1" />,
      label: 'Critical',
    },
  };

  const current = configs[normalized] || configs.NORMAL;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${current.bg}`}
    >
      {current.icon}
      {current.label}
    </span>
  );
};

export default StatusBadge;
