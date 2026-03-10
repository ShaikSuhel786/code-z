import { getRiskColor, getRiskClassification } from '../lib/driftCalculator';

export default function StudentTable({ students, onRowClick }) {
    return (
        <div className="w-full overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                        <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Student Name</th>
                        <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Accuracy</th>
                        <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Drift Score</th>
                        <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Risk Level</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {students.map((student) => {
                        const riskLevel = getRiskClassification(student.drift_score);
                        const riskColors = getRiskColor(riskLevel);

                        return (
                            <tr
                                key={student.id}
                                onClick={() => onRowClick && onRowClick(student)}
                                className={`group ${onRowClick ? 'cursor-pointer hover:bg-slate-50 transition-colors' : ''}`}
                            >
                                <td className="py-4 px-6 text-sm font-medium text-slate-800 group-hover:text-blue-600">
                                    {student.name}
                                </td>
                                <td className="py-4 px-6 text-sm text-slate-600">
                                    <div className="flex items-center gap-2">
                                        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-blue-500 rounded-full"
                                                style={{ width: `${student.accuracy * 100}%` }}
                                            />
                                        </div>
                                        {(student.accuracy * 100).toFixed(1)}%
                                    </div>
                                </td>
                                <td className="py-4 px-6 text-sm text-slate-700 font-medium">
                                    {Math.round(student.drift_score)}
                                </td>
                                <td className="py-4 px-6">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${riskColors}`}>
                                        {riskLevel}
                                    </span>
                                </td>
                            </tr>
                        );
                    })}
                    {students.length === 0 && (
                        <tr>
                            <td colSpan="4" className="py-8 text-center text-sm text-slate-500">
                                No students found.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
