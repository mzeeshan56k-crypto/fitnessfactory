"use client";

import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, RadialBarChart, RadialBar,
} from "recharts";

const tooltipStyle = {
  borderRadius: 12,
  border: "1px solid #eceef2",
  boxShadow: "0 8px 30px -8px rgba(16,24,40,0.2)",
  fontSize: 12,
};

export function RevenueChart({ data }: { data: { month: string; mrr: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data} margin={{ left: -16, right: 8, top: 8 }}>
        <defs>
          <linearGradient id="mrr" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1b82f5" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#1b82f5" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#eceef2" vertical={false} />
        <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} stroke="#828fa6" />
        <YAxis tickLine={false} axisLine={false} fontSize={12} stroke="#828fa6" tickFormatter={(v) => `$${v / 1000}k`} />
        <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`$${v.toLocaleString()}`, "MRR"]} />
        <Area type="monotone" dataKey="mrr" stroke="#1b82f5" strokeWidth={2.5} fill="url(#mrr)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function ActivityChart({ data }: { data: { day: string; workouts: number; sessions: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ left: -16, right: 8, top: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eceef2" vertical={false} />
        <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={12} stroke="#828fa6" />
        <YAxis tickLine={false} axisLine={false} fontSize={12} stroke="#828fa6" />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "#f6f7f9" }} />
        <Bar dataKey="workouts" fill="#1b82f5" radius={[6, 6, 0, 0]} />
        <Bar dataKey="sessions" fill="#34d399" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function WeightChart({ data }: { data: { week: string; weight: number; target: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ left: -16, right: 8, top: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eceef2" vertical={false} />
        <XAxis dataKey="week" tickLine={false} axisLine={false} fontSize={12} stroke="#828fa6" />
        <YAxis tickLine={false} axisLine={false} fontSize={12} stroke="#828fa6" domain={["dataMin - 4", "dataMax + 4"]} />
        <Tooltip contentStyle={tooltipStyle} />
        <Line type="monotone" dataKey="weight" stroke="#1b82f5" strokeWidth={2.5} dot={{ r: 3 }} name="Actual" />
        <Line type="monotone" dataKey="target" stroke="#aeb7c7" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Target" />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function StrengthChart({ data }: { data: { month: string; squat: number; bench: number; deadlift: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ left: -16, right: 8, top: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eceef2" vertical={false} />
        <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} stroke="#828fa6" />
        <YAxis tickLine={false} axisLine={false} fontSize={12} stroke="#828fa6" />
        <Tooltip contentStyle={tooltipStyle} />
        <Line type="monotone" dataKey="squat" stroke="#1b82f5" strokeWidth={2.5} dot={{ r: 3 }} />
        <Line type="monotone" dataKey="bench" stroke="#34d399" strokeWidth={2.5} dot={{ r: 3 }} />
        <Line type="monotone" dataKey="deadlift" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function SleepChart({ data }: { data: { day: string; rem: number; deep: number; light: number; awake: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ left: -16, right: 8, top: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eceef2" vertical={false} />
        <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={12} stroke="#828fa6" />
        <YAxis tickLine={false} axisLine={false} fontSize={12} stroke="#828fa6" tickFormatter={(v) => `${v}h`} />
        <Tooltip contentStyle={tooltipStyle} />
        <Bar dataKey="deep" stackId="s" fill="#194b8f" radius={[0, 0, 0, 0]} name="Deep" />
        <Bar dataKey="rem" stackId="s" fill="#1b82f5" name="REM" />
        <Bar dataKey="light" stackId="s" fill="#8ed8ff" name="Light" />
        <Bar dataKey="awake" stackId="s" fill="#eceef2" radius={[6, 6, 0, 0]} name="Awake" />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function EnrollmentChart({ data }: { data: { month: string; clients: number; trainers: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ left: 4, right: 8, top: 8 }}>
        <defs>
          <linearGradient id="cl" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#eceef2" vertical={false} />
        <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} stroke="#828fa6" />
        <YAxis tickLine={false} axisLine={false} fontSize={12} stroke="#828fa6" tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
        <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => v.toLocaleString()} />
        <Area type="monotone" dataKey="clients" stroke="#10b981" strokeWidth={2.5} fill="url(#cl)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function ComplianceBars({ workout, diet, habits }: { workout: number; diet: number; habits: number }) {
  const rows = [
    { label: "Workout", value: workout, color: "bg-brand-500" },
    { label: "Diet", value: diet, color: "bg-accent-500" },
    { label: "Habits", value: habits, color: "bg-amber-500" },
  ];
  return (
    <div className="space-y-4">
      {rows.map((r) => (
        <div key={r.label}>
          <div className="mb-1.5 flex justify-between text-sm">
            <span className="font-medium text-ink-700">{r.label}</span>
            <span className="font-semibold text-ink-900">{r.value}%</span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-ink-100">
            <div className={`h-full rounded-full ${r.color}`} style={{ width: `${r.value}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function AdherenceRing({ value }: { value: number }) {
  const data = [{ name: "adherence", value, fill: "#10b981" }];
  return (
    <ResponsiveContainer width="100%" height={180}>
      <RadialBarChart innerRadius="70%" outerRadius="100%" data={data} startAngle={90} endAngle={90 - (value / 100) * 360}>
        <RadialBar background dataKey="value" cornerRadius={20} />
        <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="fill-ink-900 text-2xl font-bold">
          {value}%
        </text>
      </RadialBarChart>
    </ResponsiveContainer>
  );
}
