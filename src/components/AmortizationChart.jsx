import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatCurrency } from '../lib/finance';

export default function AmortizationChart({ data, t }) {
  if (!data.length) return <p className="chart-unavailable">{t.amortizationUnavailable}</p>;
  return <div className="chart-frame"><ResponsiveContainer width="100%" height="100%"><LineChart data={data} margin={{ top: 12, right: 12, left: 4, bottom: 8 }}><CartesianGrid stroke="#e1e4ea" vertical={false} /><XAxis dataKey="month" tick={{ fill: '#7c8491', fontSize: 10 }} tickLine={false} axisLine={{ stroke: '#cfd3dd' }} /><YAxis tickFormatter={(value) => `₹${Math.round(value / 1000)}k`} tick={{ fill: '#7c8491', fontSize: 10 }} tickLine={false} axisLine={false} width={43} /><Tooltip formatter={(value, name) => [formatCurrency(value), name === 'cumulativePrincipal' ? t.principal : t.interest]} labelFormatter={(label) => `${t.months} ${label}`} contentStyle={{ border: '1px solid #cfd3dd', borderRadius: 0, fontSize: 11 }} /><Line type="monotone" dataKey="cumulativePrincipal" stroke="#1a237e" strokeWidth={2} dot={false} /><Line type="monotone" dataKey="cumulativeInterest" stroke="#ff9933" strokeWidth={2} dot={false} /></LineChart></ResponsiveContainer></div>;
}
