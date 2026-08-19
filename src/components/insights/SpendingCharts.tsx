import React from 'react';
import {
  Bar,
  BarChart,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { HapticService } from '../../services/hapticService';

export interface CategorySlice {
  name: string;
  value: number;
  color: string;
}

export interface TrendPoint {
  day: string;
  amount: number;
}

interface SpendingChartsProps {
  categoryData: CategorySlice[];
  trendData: TrendPoint[];
  chartType: 'pie' | 'bar';
  selectedCategory: string | null;
  onChartTypeChange: (type: 'pie' | 'bar') => void;
  onCategorySelect: (name: string) => void;
}

export const SpendingCharts: React.FC<SpendingChartsProps> = ({
  categoryData,
  trendData,
  chartType,
  selectedCategory,
  onChartTypeChange,
  onCategorySelect,
}) => {
  const handleSelect = (name: string) => {
    HapticService.medium();
    onCategorySelect(name);
  };

  return (
    <div className="grid grid-cols-1 gap-6 mb-6">
      <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-white font-semibold">Spending by Category</h3>
          <div className="flex gap-2">
            <button
              onClick={() => {
                HapticService.light();
                onChartTypeChange('pie');
              }}
              className={`p-1.5 rounded ${chartType === 'pie' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400'} transition-colors`}
              title="Pie Chart"
            >
              Pie
            </button>
            <button
              onClick={() => {
                HapticService.light();
                onChartTypeChange('bar');
              }}
              className={`p-1.5 rounded ${chartType === 'bar' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400'} transition-colors`}
              title="Bar Chart"
            >
              Bar
            </button>
          </div>
        </div>
        <p className="text-xs text-gray-400 mb-3">💡 Tap a slice/bar to filter transactions</p>
        <div className="h-48 w-full cursor-pointer">
          {categoryData.length > 0 ? (
            chartType === 'pie' ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                    onClick={(data) => handleSelect(data.name)}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        stroke={selectedCategory === entry.name ? '#fff' : 'none'}
                        strokeWidth={selectedCategory === entry.name ? 3 : 0}
                        opacity={selectedCategory && selectedCategory !== entry.name ? 0.3 : 1}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData}>
                  <XAxis dataKey="name" stroke="#6b7280" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                    labelStyle={{ color: '#9ca3af' }}
                  />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]} onClick={(data) => handleSelect(data.name)}>
                    {categoryData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        opacity={selectedCategory && selectedCategory !== entry.name ? 0.3 : 1}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">No data yet</div>
          )}
        </div>
        <div className="flex flex-wrap gap-2 mt-2 justify-center">
          {categoryData.slice(0, 4).map((cat) => (
            <button
              key={cat.name}
              onClick={() => handleSelect(cat.name)}
              className={`flex items-center text-xs transition-all ${
                selectedCategory === cat.name
                  ? 'text-white font-bold'
                  : selectedCategory
                    ? 'text-gray-500'
                    : 'text-gray-300'
              }`}
            >
              <div className="w-2 h-2 rounded-full mr-1" style={{ backgroundColor: cat.color }}></div>
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
        <h3 className="text-white font-semibold mb-4">Weekly Trend</h3>
        <div className="h-40 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData}>
              <XAxis dataKey="day" stroke="#6b7280" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis hide />
              <Tooltip
                contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                labelStyle={{ color: '#9ca3af' }}
              />
              <Line type="monotone" dataKey="amount" stroke="#60A5FA" strokeWidth={3} dot={{ r: 3, fill: '#60A5FA' }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
