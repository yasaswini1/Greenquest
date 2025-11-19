import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { day: 'Mon', co2: 12.5, points: 125 },
  { day: 'Tue', co2: 18.3, points: 215 },
  { day: 'Wed', co2: 25.2, points: 340 },
  { day: 'Thu', co2: 16.8, points: 180 },
  { day: 'Fri', co2: 22.4, points: 280 },
  { day: 'Sat', co2: 31.2, points: 425 },
  { day: 'Sun', co2: 19.1, points: 235 },
];

export function ImpactChart() {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="co2Gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="day" stroke="#9ca3af" />
          <YAxis stroke="#9ca3af" />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'white', 
              border: '1px solid #e5e7eb',
              borderRadius: '8px'
            }}
          />
          <Area 
            type="monotone" 
            dataKey="co2" 
            stroke="#10b981" 
            fill="url(#co2Gradient)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
