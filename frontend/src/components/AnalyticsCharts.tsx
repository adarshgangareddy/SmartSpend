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
    <div className="glass-card rounded-3xl p-6 lg:p-7 transition-all duration-200">
      {/* Top Header & Legend matching reference */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h2 className="text-2xl font-bold text-text-primary tracking-tight">
          All Transactions
        </h2>

        {/* Legend centered or aligned like reference */}
        <div className="flex items-center gap-4 text-xs font-semibold">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-2.5 rounded-xs bg-income inline-block" />
            <span className="text-text-secondary">Income</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-2.5 rounded-xs bg-expense inline-block" />
            <span className="text-text-secondary">Expenses</span>
          </div>
        </div>
      </div>

      {/* Chart container */}
      <div className="h-68 w-full">
        {timelineData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-sm text-text-muted font-medium">
            No transactions recorded yet to display timeline.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={timelineData}
              margin={{ top: 10, right: 15, left: -15, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="2 2"
                vertical={true}
                stroke="rgba(138, 131, 172, 0.18)"
              />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={{ stroke: 'rgba(138, 131, 172, 0.25)' }}
                tick={{ fontSize: 11, fill: '#77758F', fontWeight: 500 }}
                dy={6}
              />
              <YAxis
                tickLine={false}
                axisLine={{ stroke: 'rgba(138, 131, 172, 0.25)' }}
                tick={{ fontSize: 11, fill: '#77758F', fontWeight: 500 }}
                tickFormatter={(val) =>
                  val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val
                }
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.92)',
                  backdropFilter: 'blur(16px)',
                  borderRadius: '16px',
                  border: '1px solid rgba(255, 255, 255, 0.9)',
                  boxShadow: '0 8px 24px rgba(70, 55, 100, 0.08)',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#252344',
                }}
                formatter={(val: any, name: any) => [
                  formatAmount(Number(val), currency),
                  name === 'income' ? 'Income' : 'Expense',
                ]}
              />
              <Line
                type="monotone"
                dataKey="income"
                stroke="#75A65A"
                strokeWidth={2}
                dot={{ fill: '#75A65A', strokeWidth: 0, r: 4 }}
                activeDot={{ r: 6, fill: '#75A65A' }}
              />
              <Line
                type="monotone"
                dataKey="expense"
                stroke="#C95C54"
                strokeWidth={2}
                dot={{ fill: '#C95C54', strokeWidth: 0, r: 4 }}
                activeDot={{ r: 6, fill: '#C95C54' }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
