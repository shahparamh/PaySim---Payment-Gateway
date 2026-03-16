import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardHeader, CardTitle } from "../ui/Card";

const data = [
  { day: "Sat", amount: 4000000 }, { day: "Sun", amount: 1000000 }, { day: "Mon", amount: 20000 },
  { day: "Tue", amount: 10000 }, { day: "Wed", amount: 5000 }, { day: "Thu", amount: 8000 }, { day: "Fri", amount: 10000000 }
];
export const SpendingTrends = () => (
  <Card className="col-span-1 lg:col-span-2">
    <CardHeader className="flex flex-row items-center justify-between space-y-0"><CardTitle>Spending Trends</CardTitle></CardHeader>
    <div className="h-[300px] w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
          <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} tickFormatter={(value) => `₹${value / 100000}L`} />
          <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f1f5f9' }} />
          <Bar dataKey="amount" radius={[6, 6, 0, 0]} barSize={40}>
            {data.map((entry, index) => <Cell key={`cell-${index}`} fill={index === data.length - 1 ? '#6366f1' : '#334155'} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  </Card>
);
