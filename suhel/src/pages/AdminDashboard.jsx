import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { put } from '@vercel/blob';
import Navbar from '../components/Navbar';
import { DistributionBarChart } from '../components/Charts';
import { getRiskClassification } from '../lib/driftCalculator';
import { DownloadCloud, Loader2, Database, TrendingUp, ShieldCheck, AlertOctagon, Activity } from 'lucide-react';

export default function AdminDashboard() {
    const [profile, setProfile] = useState(null);
    const [globalStats, setGlobalStats] = useState({
        totalStudents: 0,
        avgAccuracy: 0,
        avgDrift: 0,
        atRiskCount: 0,
        highMasteryList: [],
        atRiskList: [],
        distributionData: []
    });
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    const [exportUrl, setExportUrl] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single();
                setProfile(profileData);

                const { data: profilesList } = await supabase.from('profiles').select('id, name').eq('role', 'student');
                const { data: studentsList } = await supabase.from('students').select('id, user_id');
                const { data: driftScores } = await supabase.from('drift_scores').select('student_id, drift_score, accuracy');

                if (profilesList && studentsList && driftScores) {
                    const combined = studentsList.map(st => {
                        const prof = profilesList.find(p => p.id === st.user_id) || {};
                        const scoreObj = driftScores.find(d => d.student_id === st.id) || { drift_score: 0, accuracy: 0 };
                        return {
                            id: st.id,
                            name: prof.name || 'Unknown',
                            accuracy: scoreObj.accuracy,
                            drift_score: scoreObj.drift_score,
                            risk: getRiskClassification(scoreObj.drift_score)
                        };
                    }).filter(c => c.name !== 'Unknown');

                    const totalStats = combined.reduce((acc, curr) => ({
                        accTot: acc.accTot + curr.accuracy,
                        driftTot: acc.driftTot + curr.drift_score
                    }), { accTot: 0, driftTot: 0 });

                    const distribution = [
                        { range: '0-20', count: combined.filter(c => c.drift_score <= 20).length },
                        { range: '21-40', count: combined.filter(c => c.drift_score > 20 && c.drift_score <= 40).length },
                        { range: '41-60', count: combined.filter(c => c.drift_score > 40 && c.drift_score <= 60).length },
                        { range: '61-80', count: combined.filter(c => c.drift_score > 60 && c.drift_score <= 80).length },
                        { range: '81-100', count: combined.filter(c => c.drift_score > 80).length },
                    ];

                    setGlobalStats({
                        totalStudents: combined.length,
                        avgAccuracy: combined.length ? totalStats.accTot / combined.length : 0,
                        avgDrift: combined.length ? totalStats.driftTot / combined.length : 0,
                        atRiskCount: combined.filter(c => c.drift_score > 60).length,
                        highMasteryList: combined.filter(c => c.accuracy > 0.8 && c.drift_score < 30),
                        atRiskList: combined.filter(c => c.drift_score > 60),
                        distributionData: distribution,
                        rawData: combined // storing for export
                    });
                }
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        setExporting(true);
        setExportUrl(null);
        try {
            const csvContent = [
                ['Student Name', 'Accuracy', 'Drift Score', 'Risk Level'],
                ...globalStats.rawData.map(row => [
                    row.name,
                    `${(row.accuracy * 100).toFixed(1)}%`,
                    row.drift_score.toFixed(1),
                    row.risk
                ])
            ].map(e => e.join(",")).join("\n");

            const blob = new Blob([csvContent], { type: 'text/csv' });
            const file = new File([blob], `analytics_export_${Date.now()}.csv`, { type: 'text/csv' });

            const { url } = await put(file.name, file, {
                access: 'public',
                token: import.meta.env.VITE_BLOB_READ_WRITE_TOKEN,
            });

            setExportUrl(url);
        } catch (error) {
            console.error("Error exporting to blob:", error);
            alert("Failed to export analytics. Please check access token.");
        } finally {
            setExporting(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-slate-50 flex justify-center items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 pb-12">
            <Navbar userRole={profile?.role} userName={profile?.name} />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">Global Analytics</h2>
                        <p className="text-slate-500 text-sm mt-1">Platform-wide concept drift metrics</p>
                    </div>

                    <div className="flex items-center gap-3">
                        {exportUrl && (
                            <a href={exportUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:text-blue-700 underline font-medium mr-2">
                                Download Latest Export
                            </a>
                        )}
                        <button
                            onClick={handleExport}
                            disabled={exporting}
                            className="flex items-center gap-2 py-2 px-4 shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors disabled:opacity-50"
                        >
                            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <DownloadCloud className="w-4 h-4 text-blue-600" />}
                            {exporting ? 'Exporting...' : 'Export Analytics Report'}
                        </button>
                    </div>
                </div>

                {/* Global KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="glass-card p-6 flex items-center gap-4">
                        <div className="p-3 bg-blue-50 rounded-xl text-blue-600 transition-colors">
                            <Database className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500">Total Students</p>
                            <p className="text-2xl font-bold text-slate-800">{globalStats.totalStudents}</p>
                        </div>
                    </div>

                    <div className="glass-card p-6 flex items-center gap-4">
                        <div className="p-3 bg-cyan-50 rounded-xl text-cyan-600 transition-colors">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500">Avg Accuracy</p>
                            <p className="text-2xl font-bold text-slate-800">{(globalStats.avgAccuracy * 100).toFixed(1)}%</p>
                        </div>
                    </div>

                    <div className="glass-card p-6 flex items-center gap-4">
                        <div className="p-3 bg-fuchsia-50 rounded-xl text-fuchsia-600 transition-colors">
                            <Activity className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500">Avg Drift Score</p>
                            <p className="text-2xl font-bold text-slate-800">{globalStats.avgDrift.toFixed(1)}</p>
                        </div>
                    </div>

                    <div className="glass-card p-6 flex items-center gap-4 border-rose-100 bg-rose-50/50">
                        <div className="p-3 bg-rose-50 rounded-xl text-rose-600 transition-colors">
                            <AlertOctagon className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500 mb-0.5">Students at Risk</p>
                            <div className="flex items-baseline gap-2">
                                <p className="text-2xl font-bold text-rose-600">{globalStats.atRiskCount}</p>
                                <p className="text-xs font-medium text-rose-500">
                                    ({globalStats.totalStudents ? Math.round((globalStats.atRiskCount / globalStats.totalStudents) * 100) : 0}%)
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Distribution Charts */}
                <div className="grid grid-cols-1 gap-6">
                    <div className="glass-card p-6">
                        <h3 className="text-lg font-bold text-slate-800 mb-4">Drift Score Distribution</h3>
                        <DistributionBarChart
                            data={globalStats.distributionData}
                            xAxisKey="range"
                            dataKey="count"
                            color="#3b82f6"
                            name="Students"
                        />
                    </div>
                </div>

                {/* Master & Intervention Lists */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="glass-card overflow-hidden flex flex-col h-96">
                        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center gap-2 h-16 shrink-0">
                            <ShieldCheck className="w-5 h-5 text-emerald-600" />
                            <h3 className="font-bold text-slate-800 content-center">High Mastery Benchmark Group</h3>
                        </div>
                        <div className="p-0 overflow-y-auto custom-scrollbar flex-1">
                            <table className="w-full text-left">
                                <thead className="sticky top-0 bg-white/95 backdrop-blur z-10 border-b border-slate-100">
                                    <tr>
                                        <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Student Name</th>
                                        <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Accuracy</th>
                                        <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Drift</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {globalStats.highMasteryList.map(st => (
                                        <tr key={st.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="py-3 px-4 text-sm font-medium text-slate-700">{st.name}</td>
                                            <td className="py-3 px-4 text-sm text-emerald-600 font-semibold">{(st.accuracy * 100).toFixed(0)}%</td>
                                            <td className="py-3 px-4 text-sm text-slate-500">{Math.round(st.drift_score)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {globalStats.highMasteryList.length === 0 && (
                                <div className="p-8 text-center text-slate-500 text-sm h-full flex items-center justify-center italic">No high mastery benchmark profiles.</div>
                            )}
                        </div>
                    </div>

                    <div className="glass-card overflow-hidden flex flex-col h-96 border-rose-200">
                        <div className="p-4 border-b border-rose-100 bg-rose-50/50 flex items-center gap-2 h-16 shrink-0">
                            <AlertOctagon className="w-5 h-5 text-rose-600" />
                            <h3 className="font-bold text-rose-600 content-center">Critical Intervention Required</h3>
                        </div>
                        <div className="p-0 overflow-y-auto custom-scrollbar flex-1">
                            <table className="w-full text-left">
                                <thead className="sticky top-0 bg-white/95 backdrop-blur z-10 border-b border-rose-100 text-rose-600/70">
                                    <tr>
                                        <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider">Student Name</th>
                                        <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider">Accuracy</th>
                                        <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider">Drift Score</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-rose-50">
                                    {globalStats.atRiskList.map(st => (
                                        <tr key={st.id} className="hover:bg-rose-50/50 transition-colors">
                                            <td className="py-3 px-4 text-sm font-medium text-slate-700">{st.name}</td>
                                            <td className="py-3 px-4 text-sm text-slate-500">{(st.accuracy * 100).toFixed(0)}%</td>
                                            <td className="py-3 px-4 text-sm font-bold text-rose-600">{Math.round(st.drift_score)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {globalStats.atRiskList.length === 0 && (
                                <div className="p-8 text-center text-slate-500 text-sm h-full flex items-center justify-center italic">No students present in at-risk category.</div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
