import {
    LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white p-3 border border-slate-200 shadow-lg rounded-lg">
                <p className="text-xs font-medium text-slate-500 mb-1">{`Interaction ${label}`}</p>
                {payload.map((entry, index) => (
                    <p key={index} className="text-sm font-bold" style={{ color: entry.color }}>
                        {entry.name}: {entry.value}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

export function PerformanceLineChart({ data, dataKey, color, name, yDomain = ['auto', 'auto'] }) {
    // Add numerical tracking index for x-axis if timestamp isn't formatted nicely
    const chartData = data.map((d, i) => ({ ...d, index: i + 1 }));

    return (
        <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis
                        dataKey="index"
                        stroke="#94a3b8"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                    />
                    <YAxis
                        stroke="#94a3b8"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        domain={yDomain}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Line
                        type="monotone"
                        dataKey={dataKey}
                        name={name}
                        stroke={color}
                        strokeWidth={3}
                        dot={{ r: 4, fill: color, strokeWidth: 2, stroke: '#fff' }}
                        activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff' }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}

export function DistributionBarChart({ data, dataKey, xAxisKey, color, name }) {
    return (
        <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis
                        dataKey={xAxisKey}
                        stroke="#94a3b8"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                    />
                    <YAxis
                        stroke="#94a3b8"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                    <Bar dataKey={dataKey} name={name} fill={color} radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
