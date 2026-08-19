import React from 'react';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export interface MonthComparisonPoint {
  month: string;
  expenses: number;
}

interface MonthComparisonProps {
  data: MonthComparisonPoint[];
}

export const MonthComparison: React.FC<MonthComparisonProps> = ({ data }) => (
  <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 mb-6">
    <h3 className="text-white font-semibold mb-4">Month Comparison</h3>
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <XAxis dataKey="month" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis hide />
          <Tooltip
            contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
            labelStyle={{ color: '#9ca3af' }}
          />
          <Bar dataKey="expenses" fill="#ef4444" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  </div>
);
