import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';
import { Info } from 'lucide-react';

const ShapChart = ({ shapValues = [] }) => {
  if (!shapValues || shapValues.length === 0) {
    return null;
  }

  // Format data for chart
  const data = shapValues.map((item) => ({
    feature: item.feature,
    impact: Number(item.impact.toFixed(4)),
    value: item.value,
    direction: item.impact >= 0 ? 'Increases Risk' : 'Reduces Risk',
  }));

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white p-2.5 rounded-lg text-xs shadow-lg space-y-1">
          <p className="font-semibold">{d.feature}</p>
          <p className="text-slate-300">Observed Value: <span className="text-white font-medium">{d.value}</span></p>
          <p className="text-slate-300">
            SHAP Attribution: <span className={d.impact >= 0 ? 'text-rose-400' : 'text-emerald-400 font-medium'}>
              {d.impact > 0 ? `+${d.impact}` : d.impact}
            </span>
          </p>
          <p className="text-[10px] text-slate-400">{d.direction}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-bold text-slate-900">SHAP Feature Attribution</h4>
          <p className="text-xs text-slate-500">
            Shows which patient biomarkers pushed the screening estimate higher or lower
          </p>
        </div>
        <div className="flex items-center space-x-3 text-[11px]">
          <span className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 inline-block"></span>
            <span className="text-slate-600">Pushes Risk Higher</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block"></span>
            <span className="text-slate-600">Pushes Risk Lower</span>
          </span>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 5, right: 20, left: 40, bottom: 5 }}
          >
            <XAxis type="number" domain={['dataMin - 0.05', 'dataMax + 0.05']} tick={{ fontSize: 10 }} />
            <YAxis
              dataKey="feature"
              type="category"
              tick={{ fontSize: 11, fill: '#475569' }}
              width={110}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine x={0} stroke="#94a3b8" strokeDasharray="3 3" />
            <Bar dataKey="impact" radius={[4, 4, 4, 4]}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.impact >= 0 ? '#f43f5e' : '#10b981'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center space-x-2 text-[11px] text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100">
        <Info className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
        <span>
          SHAP values explain how individual clinical lab parameters contributed to this model's probability estimate.
        </span>
      </div>
    </div>
  );
};

export default ShapChart;
