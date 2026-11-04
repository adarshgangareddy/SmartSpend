import React from 'react';
import {
  AreaChart,
  Area,
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
  // Filter transactions for the active currency
  const activeCurrencyTx = transactions.filter(
    (tx) => (tx.currency || 'INR').toUpperCase() === currency.toUpperCase()
  );

  // Group by month dynamically from actual transaction data
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  // Collect actual dates from transactions
  const monthMap: { [key: string]: { month: string; income: number; expense: number; timestamp: number } } = {};

  activeCurrencyTx.forEach((tx) => {
    const d = new Date(tx.transaction_date);
    if (!isNaN(d.getTime())) {
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const monthLabel = monthNames[d.getMonth()];
      if (!monthMap[key]) {
        monthMap[key] = {
          month: monthLabel,
          income: 0,
          expense: 0,
          timestamp: new Date(d.getFullYear(), d.getMonth(), 1).getTime(),
        };
      }
      if (tx.type === 'income') {
        monthMap[key].income += tx.amount;
      } else {
        monthMap[key].expense += tx.amount;
      }
    }
  });

  const chartData = Object.values(monthMap).sort((a, b) => a.timestamp - b.timestamp);

  return (
    <div className="glass-box rounded-[28px] p-6 h-full flex flex-col justify-between">
      {/* Header & Legend matching reference */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="text-xl font-extrabold text-text-primary tracking-tight">
            Monthly Overview
          </h2>
          <p className="text-xs text-text-secondary font-medium mt-0.5">
            Income vs expenses
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs font-bold">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-income inline-block shadow-2xs" />
            <span className="text-text-secondary font-semibold">Income</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-expense inline-block shadow-2xs" />
            <span className="text-text-secondary font-semibold">Expenses</span>
          </div>
        </div>
      </div>

      {/* Chart container */}
      <div className="h-64 sm:h-72 w-full">
        {chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-sm font-semibold text-text-muted">
            No transactions recorded yet to display trend.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 12, right: 12, left: -10, bottom: 0 }}
            >
              <defs>
                <linearGradient id="incomeArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7A9B72" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#7A9B72" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="2 2"
                vertical={true}
                stroke="rgba(149, 137, 173, 0.16)"
              />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={{ stroke: 'rgba(149, 137, 173, 0.25)' }}
                tick={{ fontSize: 11, fill: '#77718B', fontWeight: 600 }}
                dy={6}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: '#77718B', fontWeight: 600 }}
                tickFormatter={(val) => (val >= 1000 ? `${val.toLocaleString()}` : val)}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="glass-modal rounded-2xl p-3 shadow-glass border border-white text-xs">
                        <p className="font-extrabold text-text-primary mb-1">{label}</p>
                        {payload.map((entry: any, index: number) => (
                          <div
                            key={index}
                            className="flex items-center justify-between gap-4 py-0.5"
                          >
                            <span
                              className="font-bold"
                              style={{ color: entry.stroke || entry.color }}
                            >
                              {entry.name === 'income' ? 'Income' : 'Expenses'}:
                            </span>
                            <span className="font-extrabold text-text-primary">
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
              <Area
                type="monotone"
                dataKey="income"
                stroke="#7A9B72"
                strokeWidth={2.2}
                fillOpacity={1}
                fill="url(#incomeArea)"
                dot={{
                  r: 4.5,
                  fill: '#7A9B72',
                  stroke: '#FFFFFF',
                  strokeWidth: 2,
                }}
                activeDot={{
                  r: 6,
                  fill: '#7A9B72',
                  stroke: '#FFFFFF',
                  strokeWidth: 2.5,
                }}
              />
              <Line
                type="monotone"
                dataKey="expense"
                stroke="#C96F70"
                strokeWidth={2.2}
                dot={{
                  r: 4.5,
                  fill: '#C96F70',
                  stroke: '#FFFFFF',
                  strokeWidth: 2,
                }}
                activeDot={{
                  r: 6,
                  fill: '#C96F70',
                  stroke: '#FFFFFF',
                  strokeWidth: 2.5,
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
