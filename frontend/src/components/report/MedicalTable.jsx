import React, { useState } from 'react';
import StatusBadge from './StatusBadge';
import { HelpCircle, Search, Filter } from 'lucide-react';

const MedicalTable = ({ tests = [], onExplainTest }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const categories = ['ALL', ...new Set(tests.map((t) => t.category).filter(Boolean))];

  const filteredTests = tests.filter((t) => {
    const matchesSearch =
      t.testName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.category && t.category.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory =
      categoryFilter === 'ALL' || t.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header with Search & Filter */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
        <div>
          <h3 className="text-base font-bold text-slate-900">Extracted Biomarkers</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {tests.length} biomarkers detected from report
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Search box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search biomarkers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 w-36 sm:w-44"
            />
          </div>

          {/* Category Dropdown */}
          {categories.length > 2 && (
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c === 'ALL' ? 'All Panels' : c}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Table Content */}
      {filteredTests.length === 0 ? (
        <div className="p-8 text-center text-xs text-slate-500">
          No medical test parameters match your search criteria.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4 sm:px-6">Biomarker</th>
                <th className="py-3 px-4">Value</th>
                <th className="py-3 px-4">Reference Range</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Info</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTests.map((test, index) => (
                <tr
                  key={test._id || index}
                  className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                  onClick={() => onExplainTest && onExplainTest(test)}
                >
                  <td className="py-3.5 px-4 sm:px-6 font-medium text-slate-800">
                    <div>
                      <span className="font-semibold">{test.testName}</span>
                      {test.category && (
                        <span className="block text-[10px] text-slate-400 font-normal">
                          {test.category}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    {test.value} <span className="font-normal text-slate-500 text-[11px]">{test.unit || ''}</span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">
                    {test.referenceRange?.raw ||
                      (test.referenceRange?.low !== null && test.referenceRange?.high !== null
                        ? `${test.referenceRange.low} - ${test.referenceRange.high} ${test.unit || ''}`
                        : 'Standard')}
                  </td>
                  <td className="py-3.5 px-4">
                    <StatusBadge status={test.status} />
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onExplainTest && onExplainTest(test);
                      }}
                      className="inline-flex items-center space-x-1 text-sky-600 hover:text-sky-800 hover:bg-sky-50 px-2.5 py-1 rounded-md text-xs font-medium transition-colors"
                      title="What does this mean?"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>Explain</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer Info */}
      <div className="p-3 bg-slate-50/60 border-t border-slate-100 px-4 sm:px-6 text-[11px] text-slate-400 flex items-center justify-between">
        <span>Showing {filteredTests.length} of {tests.length} tests</span>
        <span>Click "Explain" on any biomarker for educational context</span>
      </div>
    </div>
  );
};

export default MedicalTable;
