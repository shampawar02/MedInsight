import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { TrendingUp, ArrowUpRight, ArrowDownRight, Minus, Calendar } from 'lucide-react';
import api from '../../api/axios';
import LoadingSpinner from '../common/LoadingSpinner';

const HistoricalTrendChart = () => {
  const [loading, setLoading] = useState(true);
  const [comparisonData, setComparisonData] = useState(null);
  const [biomarkers, setBiomarkers] = useState([]);
  const [selectedBiomarker, setSelectedBiomarker] = useState('Glucose');
  const [trendData, setTrendData] = useState([]);
  const [trendLoading, setTrendLoading] = useState(false);

  // 1. Fetch comparison summary & available biomarkers
  useEffect(() => {
    const fetchComparisonAndBiomarkers = async () => {
      setLoading(true);
      try {
        const [compRes, bioRes] = await Promise.all([
          api.get('/history/comparison'),
          api.get('/history/biomarkers'),
        ]);

        setComparisonData(compRes.data);
        const bioList = bioRes.data?.biomarkers || [];
        setBiomarkers(bioList);

        // Pick default biomarker
        if (bioList.length > 0) {
          const defaultChoice = bioList.find((b) => b.toLowerCase().includes('glucose')) || bioList[0];
          setSelectedBiomarker(defaultChoice);
        }
      } catch (err) {
        console.error('Failed to load historical comparison:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchComparisonAndBiomarkers();
  }, []);

  // 2. Fetch specific biomarker time series when selection changes
  useEffect(() => {
    if (!selectedBiomarker) return;

    const fetchTrend = async () => {
      setTrendLoading(true);
      try {
        const res = await api.get(`/history/trend/${encodeURIComponent(selectedBiomarker)}`);
        setTrendData(res.data?.history || []);
      } catch (err) {
        console.error('Failed to fetch biomarker trend:', err);
        setTrendData([]);
      } finally {
        setTrendLoading(false);
      }
    };

    fetchTrend();
  }, [selectedBiomarker]);

  if (loading) {
    return <LoadingSpinner message="Analyzing historical reports..." />;
  }

  // If user only has 1 report or none
  if (!comparisonData?.hasMultipleReports) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3 shadow-sm">
        <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto">
          <TrendingUp className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-800">Historical Comparison</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
          Historical comparison will appear when multiple reports are available. Upload your subsequent laboratory tests over time to track longitudinal trends and biomarker fluctuations.
        </p>
      </div>
    );
  }

  const { comparisons = [], latestReportDate, previousReportDate } = comparisonData;

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white p-3 rounded-xl text-xs shadow-lg space-y-1 border border-slate-800">
          <p className="font-semibold text-sky-400">{d.testName}</p>
          <p className="text-slate-300">Date: <span className="text-white font-medium">{d.date}</span></p>
          <p className="text-slate-300">Value: <span className="text-white font-bold text-sm">{d.value} {d.unit}</span></p>
          {d.referenceRange && (
            <p className="text-slate-400 text-[10px]">Reference: {d.referenceRange}</p>
          )}
          <p className="text-slate-300">Status: <span className="font-medium">{d.status}</span></p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Latest vs Previous Comparison Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50/50">
          <div>
            <h3 className="text-base font-bold text-slate-900">Historical Comparison</h3>
            <p className="text-xs text-slate-500">
              Comparative analysis between your two most recent clinical reports
            </p>
          </div>
          <div className="flex items-center space-x-2 text-xs text-slate-500">
            <Calendar className="w-3.5 h-3.5" />
            <span>
              {new Date(previousReportDate).toLocaleDateString()} &rarr;{' '}
              {new Date(latestReportDate).toLocaleDateString()}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4 sm:px-6">Test</th>
                <th className="py-3 px-4">Previous</th>
                <th className="py-3 px-4">Latest</th>
                <th className="py-3 px-4">Change</th>
                <th className="py-3 px-4">Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {comparisons.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 px-4 text-center text-slate-500">
                    No matching biomarkers with compatible units were found in both reports.
                  </td>
                </tr>
              ) : comparisons.map((c, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 sm:px-6 font-medium text-slate-800">
                    {c.testName}
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    {c.previousValue} {c.unit}
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-900">
                    {c.latestValue} {c.unit}
                  </td>
                  <td className="py-3 px-4 text-slate-500">
                    {c.difference > 0 ? `+${c.difference}` : c.difference} {c.unit}
                  </td>
                  <td className="py-3 px-4">
                    {c.trend === 'Increased' ? (
                      <span className="inline-flex items-center text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full font-medium">
                        <ArrowUpRight className="w-3 h-3 mr-1" /> Increased
                      </span>
                    ) : c.trend === 'Decreased' ? (
                      <span className="inline-flex items-center text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full font-medium">
                        <ArrowDownRight className="w-3 h-3 mr-1" /> Decreased
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full font-medium">
                        <Minus className="w-3 h-3 mr-1" /> Stable
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive Trend Chart Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-base font-bold text-slate-900">Biomarker Trajectory Chart</h4>
            <p className="text-xs text-slate-500">Select a test to visualize values across report dates</p>
          </div>

          {/* Biomarker Selector */}
          <div className="flex flex-wrap gap-1.5">
            {biomarkers.map((bio) => (
              <button
                key={bio}
                onClick={() => setSelectedBiomarker(bio)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  selectedBiomarker === bio
                    ? 'bg-brand-600 text-white shadow-sm shadow-brand-500/30'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {bio}
              </button>
            ))}
          </div>
        </div>

        {trendLoading ? (
          <div className="h-64 flex items-center justify-center">
            <LoadingSpinner message={`Loading trajectory for ${selectedBiomarker}...`} />
          </div>
        ) : trendData.length > 1 ? (
          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} dy={10} />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  domain={['dataMin - 10', 'dataMax + 10']}
                />
                <Tooltip content={<CustomTooltip />} />
                {trendData[0]?.low && (
                  <ReferenceLine
                    y={trendData[0].low}
                    stroke="#38bdf8"
                    strokeDasharray="4 4"
                    label={{ value: 'Lower Bound', fill: '#0284c7', fontSize: 10, position: 'insideBottomRight' }}
                  />
                )}
                {trendData[0]?.high && (
                  <ReferenceLine
                    y={trendData[0].high}
                    stroke="#f59e0b"
                    strokeDasharray="4 4"
                    label={{ value: 'Upper Bound', fill: '#d97706', fontSize: 10, position: 'insideTopRight' }}
                  />
                )}
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#0284c7"
                  strokeWidth={2.5}
                  dot={{ r: 5, fill: '#0284c7', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 7, fill: '#0369a1' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-slate-400">
            Not enough measurements are available to show a trend for {selectedBiomarker} yet.
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoricalTrendChart;
