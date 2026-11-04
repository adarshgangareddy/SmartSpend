import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Transaction } from '../types';
import { formatAmount } from '../utils/formatters';

interface AnalyticsChartsProps {
  transactions: Transaction[];
  currency?: string;
}

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({
  transactions,
  currency = 'INR',
}) => {
  // Filter transactions for the selected currency
  const activeCurrencyTx = transactions.filter(
    (tx) => (tx.currency || 'INR').toUpperCase() === currency.toUpperCase()
  );

  // Group by date for chart timeline
  const timelineMap: { [dateStr: string]: { date: string; income: number; expense: number } } = {};

  const sortedTx = [...activeCurrencyTx].sort(
    (a, b) => new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime()
  );

  sortedTx.forEach((tx) => {
    const d = new Date(tx.transaction_date);
    const label = !isNaN(d.getTime())
      ? `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`
      : tx.transaction_date;

    if (!timelineMap[label]) {
      timelineMap[label] = { date: label, income: 0, expense: 0 };
    }

    if (tx.type === 'income') {
      timelineMap[label].income += tx.amount;
    } else {
      timelineMap[label].expense += tx.amount;
    }
  });

  const timelineData = Object.values(timelineMap);

  return (
    <div className="glass-box rounded-[28px] p-6 sm:p-7">
      {/* Top Header & Centered Legend matching Image 2 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h2 className="text-2xl font-bold text-text-primary tracking-tight">
          All Transactions
        </h2>

        {/* Legend centered or aligned with header as in reference image */}
        <div className="flex items-center gap-5 text-xs font-semibold">
          <div className="flex items-center gap-2">
            <span className="w-4 h-2.5 rounded-xs bg-[#75A65A] inline-block shadow-2xs" />
            <span className="text-text-secondary font-medium">Income</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-2.5 rounded-xs bg-[#C95C54] inline-block shadow-2xs" />
            <span className="text-text-secondary font-medium">Expenses</span>
          </div>
        </div>
      </div>

      {/* Chart container */}
      <div className="h-68 w-full">
        {timelineData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-sm text-text-muted font-medium">
            No transactions recorded yet to display trend.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={timelineData}
              margin={{ top: 10, right: 15, left: -10, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="2 2"
                vertical={true}
                stroke="rgba(138, 131, 172, 0.16)"
              />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={{ stroke: 'rgba(138, 131, 172, 0.22)' }}
                tick={{ fontSize: 11, fill: '#77758F', fontWeight: 500 }}
                dy={6}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: '#77758F', fontWeight: 500 }}
                tickFormatter={(value) => (value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value)}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="glass-modal rounded-2xl p-3 shadow-lg border border-white text-xs">
                        <p className="font-bold text-text-primary mb-1.5">{label}</p>
                        {payload.map((entry: any, index: number) => (
                          <div
                            key={index}
                            className="flex items-center justify-between gap-4 py-0.5"
                          >
                            <span
                              className="font-medium"
                              style={{ color: entry.stroke }}
                            >
                              {entry.name === 'income' ? 'Income' : 'Expense'}:
                            </span>
                            <span className="font-bold text-text-primary">
                              {formatAmount(entry.value, currency)}
                            </span>
                          </div>
                        ))}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Line
                type="monotone"
                dataKey="income"
                name="income"
                stroke="#B8B2C8"
                strokeWidth={2}
                dot={{
                  r: 4.5,
                  fill: '#75A65A',
                  stroke: '#FFFFFF',
                  strokeWidth: 2,
                }}
                activeDot={{
                  r: 6,
                  fill: '#75A65A',
                  stroke: '#FFFFFF',
                  strokeWidth: 2.5,
                }}
              />
              <Line
                type="monotone"
                dataKey="expense"
                name="expense"
                stroke="#CFC8DB"
                strokeWidth={2}
                dot={{
                  r: 4.5,
                  fill: '#C95C54',
                  stroke: '#FFFFFF',
                  strokeWidth: 2,
                }}
                activeDot={{
                  r: 6,
                  fill: '#C95C54',
                  stroke: '#FFFFFF',
                  strokeWidth: 2.5,
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
