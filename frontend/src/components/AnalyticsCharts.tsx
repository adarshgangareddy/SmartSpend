import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Transaction } from '../types';
import { formatAmount, getCurrencySymbol } from '../utils/formatters';

interface AnalyticsChartsProps {
  transactions: Transaction[];
  currency?: string;
}

const CATEGORY_COLORS = [
  '#00A896', // Teal
  '#3B82F6', // Blue
  '#F59E0B', // Amber
  '#EC4899', // Pink
  '#8B5CF6', // Purple
  '#10B981', // Emerald
  '#64748B', // Slate
];

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({
  transactions,
  currency = 'INR',
}) => {
  // Filter transactions for the selected currency to prevent combining different currencies
  const activeCurrencyTx = transactions.filter(
    (tx) => (tx.currency || 'INR').toUpperCase() === currency.toUpperCase()
  );

  // 1. Process Timeline (Income vs Expense over dates)
  const timelineMap: { [dateStr: string]: { date: string; income: number; expense: number } } = {};

  // Sort ascending by date for chart display
  const sortedTx = [...activeCurrencyTx].sort(
    (a, b) => new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime()
  );

  sortedTx.forEach((tx) => {
    // Format date as "DD/MM"
    const d = new Date(tx.transaction_date);
    const label = !isNaN(d.getTime())
      ? `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`
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

  // 2. Process Expenses by Category
  const expenseMap: { [cat: string]: number } = {};
  let totalExpenseAmount = 0;

  activeCurrencyTx
    .filter((tx) => tx.type === 'expense')
    .forEach((tx) => {
      const cat = tx.category || 'Other';
      expenseMap[cat] = (expenseMap[cat] || 0) + tx.amount;
      totalExpenseAmount += tx.amount;
    });

  const categoryData = Object.entries(expenseMap)
    .map(([name, value]) => ({
      name,
      value: Math.round(value * 100) / 100,
      percentage: totalExpenseAmount > 0 ? Math.round((value / totalExpenseAmount) * 100) : 0,
    }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      {/* 1. Income vs Expenses Area Chart (Takes 2 cols on lg) */}
      <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-charcoal-900">
              Income vs Expenses
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Cash flow comparison over time
            </p>
          </div>
          {/* Subtle legend */}
          <div className="flex items-center gap-4 text-xs font-medium">
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
              Income
            </span>
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
              Expenses
            </span>
          </div>
        </div>

        <div className="h-64 w-full">
          {timelineData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-slate-400">
              No transactions recorded yet to display trend.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={{ stroke: '#E2E8F0' }}
                  tick={{ fontSize: 11, fill: '#94A3B8' }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: '#94A3B8' }}
                  tickFormatter={(val) => (val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val)}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '12px',
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)',
                    fontSize: '12px',
                  }}
                  formatter={(val: any, name: any) => [
                    `${currency} ${Number(val).toLocaleString()}`,
                    name === 'income' ? 'Income' : 'Expense',
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="income"
                  stroke="#10B981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#incomeGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="expense"
                  stroke="#EF4444"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#expenseGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* 2. Spending Breakdown by Category (Donut + Clean list) */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
        <div>
          <h3 className="text-sm font-bold text-charcoal-900">
            Category Breakdown
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Spending distribution
          </p>
        </div>

        <div className="my-3">
          {categoryData.length === 0 ? (
            <div className="h-44 flex items-center justify-center text-xs text-slate-400">
              No expense categories recorded yet.
            </div>
          ) : (
            <>
              <div className="h-40 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={44}
                      outerRadius={68}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {categoryData.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#FFFFFF',
                        borderRadius: '10px',
                        border: '1px solid #E2E8F0',
                        fontSize: '11px',
                      }}
                      formatter={(val: any) => [`${currency} ${Number(val).toLocaleString()}`, 'Spent']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Compact Category List */}
              <div className="space-y-1.5 mt-2 max-h-32 overflow-y-auto pr-1">
                {categoryData.slice(0, 4).map((cat, idx) => (
                  <div key={cat.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: CATEGORY_COLORS[idx % CATEGORY_COLORS.length] }}
                      />
                      <span className="text-charcoal-700 font-medium truncate">
                        {cat.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-slate-400 font-normal">
                        {cat.percentage}%
                      </span>
                      <span className="text-charcoal-900 font-semibold">
                        {formatAmount(cat.value, currency)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

