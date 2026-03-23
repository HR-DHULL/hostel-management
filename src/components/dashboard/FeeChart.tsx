'use client'

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'

interface DataPoint {
  month:     string
  hostel:    number
  library:   number
  mess:      number
}

interface FeeChartProps {
  data: DataPoint[]
}

const fmt = (v: number) =>
  v >= 100000
    ? `₹${(v / 100000).toFixed(1)}L`
    : v >= 1000
    ? `₹${(v / 1000).toFixed(0)}K`
    : `₹${v}`

export function FeeChart({ data }: FeeChartProps) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="gradHostel" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#2563EB" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gradLibrary" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#16a34a" stopOpacity={0.12} />
            <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gradMess" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#d97706" stopOpacity={0.12} />
            <stop offset="95%" stopColor="#d97706" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={fmt}
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          axisLine={false}
          tickLine={false}
          width={52}
        />
        <Tooltip
          formatter={(v: number, name: string) => [
            `₹${Number(v).toLocaleString('en-IN')}`,
            name.charAt(0).toUpperCase() + name.slice(1),
          ]}
          contentStyle={{
            background: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: '6px',
            fontSize: '12px',
          }}
        />
        <Area type="monotone" dataKey="hostel"  stroke="#2563EB" strokeWidth={2} fill="url(#gradHostel)"  />
        <Area type="monotone" dataKey="library" stroke="#16a34a" strokeWidth={2} fill="url(#gradLibrary)" />
        <Area type="monotone" dataKey="mess"    stroke="#d97706" strokeWidth={2} fill="url(#gradMess)"    />
      </AreaChart>
    </ResponsiveContainer>
  )
}
