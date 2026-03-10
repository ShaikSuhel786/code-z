import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

export default function DriftGauge({ score }) {
    const normalizedScore = Math.min(Math.max(score, 0), 100);

    const data = [
        { name: 'Score', value: normalizedScore },
        { name: 'Remaining', value: 100 - normalizedScore }
    ];

    const getColor = (val) => {
        if (val <= 30) return '#34d399'; // emerald-400
        if (val <= 60) return '#fbbf24'; // amber-400
        return '#fb7185'; // rose-400
    };

    const getLabel = (val) => {
        if (val <= 30) return 'Stable';
        if (val <= 60) return 'Warning';
        return 'High Drift';
    };

    return (
        <div className="relative w-full h-48 sm:h-64 flex flex-col items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="100%"
                        startAngle={180}
                        endAngle={0}
                        innerRadius="60%"
                        outerRadius="80%"
                        paddingAngle={0}
                        dataKey="value"
                        stroke="none"
                        cornerRadius={4}
                    >
                        <Cell fill={getColor(normalizedScore)} />
                        <Cell fill="#f1f5f9" /> {/* slate-100 */}
                    </Pie>
                </PieChart>
            </ResponsiveContainer>
            <div className="absolute flex flex-col items-center justify-end bottom-4">
                <span className="text-3xl font-bold text-slate-800">
                    {Math.round(normalizedScore)}
                </span>
                <span className="text-sm font-medium text-slate-500 uppercase tracking-widest mt-1">
                    {getLabel(normalizedScore)}
                </span>
            </div>
        </div>
    );
}
