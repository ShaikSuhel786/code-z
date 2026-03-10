import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { calculateDriftScore, getRiskClassification, getRiskColor } from '../lib/driftCalculator';
import Navbar from '../components/Navbar';
import { PerformanceLineChart } from '../components/Charts';
import { Target, Clock, RotateCcw } from 'lucide-react';

export default function StudentDashboard() {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [interactions, setInteractions] = useState([]);
    const [loading, setLoading] = useState(true);

    // Metrics state
    const [metrics, setMetrics] = useState({
        accuracy: 0,
        avgTime: 0,
        avgRetries: 0,
        driftScore: 0,
        riskLevel: 'Stable'
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);

            if (user) {
                // Fetch Profile
                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();
                setProfile(profileData);

                // Fetch Student ID
                const { data: studentData } = await supabase
                    .from('students')
                    .select('id')
                    .eq('user_id', user.id)
                    .single();

                if (studentData) {
                    // Fetch Interactions
                    const { data: interactionData } = await supabase
                        .from('interactions')
                        .select('*')
                        .eq('student_id', studentData.id)
                        .order('timestamp', { ascending: true });

                    setInteractions(interactionData || []);
                    calculateMetrics(interactionData || []);
                }
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateMetrics = (data) => {
        if (!data.length) return;

        const totalAnswers = data.length;
        const correctAnswers = data.filter(i => i.correct).length;
        const accuracy = correctAnswers / totalAnswers;
        const avgTime = data.reduce((acc, curr) => acc + curr.time_taken, 0) / totalAnswers;
        const avgRetries = data.reduce((acc, curr) => acc + curr.retries, 0) / totalAnswers;

        const driftScore = calculateDriftScore(accuracy, avgTime, avgRetries);
        const riskLevel = getRiskClassification(driftScore);

        setMetrics({
            accuracy,
            avgTime,
            avgRetries,
            driftScore,
            riskLevel
        });
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

                {/* Header Section */}
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Your Learning Analytics</h2>
                    <p className="text-slate-500 text-sm mt-1">Real-time performance metrics</p>
                </div>

                {/* Top KPI Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                    <div className="glass-card p-6 flex flex-col justify-between items-start cursor-default glass-card-hover group">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                                <Target className="w-5 h-5 text-blue-600" />
                            </div>
                            <h3 className="text-slate-500 font-medium text-sm">Accuracy</h3>
                        </div>
                        <p className="text-3xl font-bold text-slate-800">{(metrics.accuracy * 100).toFixed(1)}%</p>
                    </div>

                    <div className="glass-card p-6 flex flex-col justify-between items-start cursor-default glass-card-hover group">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-cyan-50 rounded-lg group-hover:bg-cyan-100 transition-colors">
                                <Clock className="w-5 h-5 text-cyan-600" />
                            </div>
                            <h3 className="text-slate-500 font-medium text-sm">Avg Solving Time</h3>
                        </div>
                        <p className="text-3xl font-bold text-slate-800">{metrics.avgTime.toFixed(1)}s</p>
                    </div>

                    <div className="glass-card p-6 flex flex-col justify-between items-start cursor-default glass-card-hover group">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-fuchsia-50 rounded-lg group-hover:bg-fuchsia-100 transition-colors">
                                <RotateCcw className="w-5 h-5 text-fuchsia-600" />
                            </div>
                            <h3 className="text-slate-500 font-medium text-sm">Avg Retries</h3>
                        </div>
                        <p className="text-3xl font-bold text-slate-800">{metrics.avgRetries.toFixed(1)}</p>
                    </div>

                </div>

                {/* Main Info Grid - Charts */}
                <div className="grid grid-cols-1 gap-6">
                    <div className="glass-card p-6 space-y-8">
                        <div>
                            <h3 className="text-lg font-bold text-slate-800 mb-4">Knowledge Retention Trend</h3>
                            <PerformanceLineChart
                                data={interactions.map(d => ({ ...d, Accuracy: d.correct ? 100 : 0 }))}
                                dataKey="Accuracy"
                                color="#2563eb"
                                name="Accuracy (%)"
                                yDomain={[0, 100]}
                            />
                        </div>
                        <div className="h-px w-full bg-slate-100" />
                        <div>
                            <h3 className="text-lg font-bold text-slate-800 mb-4">Solving Time Evolution</h3>
                            <PerformanceLineChart
                                data={interactions.map(d => ({ ...d, 'Time (s)': d.time_taken }))}
                                dataKey="Time (s)"
                                color="#0891b2"
                                name="Time (Seconds)"
                            />
                        </div>
                    </div>
                </div>

                {/* History Table */}
                <div className="glass-card overflow-hidden">
                    <div className="p-6 border-b border-slate-200 bg-slate-50/50">
                        <h3 className="text-lg font-bold text-slate-800">Recent Interactions</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Question #</th>
                                    <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Outcome</th>
                                    <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Time Taken</th>
                                    <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Retries</th>
                                    <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {interactions.slice().reverse().slice(0, 5).map((inter, i) => (
                                    <tr key={inter.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="py-4 px-6 text-sm text-slate-700 font-medium">Q-{inter.question_id.split('-')[0]}</td>
                                        <td className="py-4 px-6 text-sm">
                                            {inter.correct
                                                ? <span className="text-emerald-600 font-medium">Correct</span>
                                                : <span className="text-rose-600 font-medium">Incorrect</span>}
                                        </td>
                                        <td className="py-4 px-6 text-sm text-slate-600">{inter.time_taken}s</td>
                                        <td className="py-4 px-6 text-sm text-slate-600">{inter.retries}</td>
                                        <td className="py-4 px-6 text-sm text-slate-400">
                                            {new Date(inter.timestamp).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                                {interactions.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="py-8 text-center text-sm text-slate-500">
                                            No recent interactions.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
}
