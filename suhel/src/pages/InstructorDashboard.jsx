import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { getRiskClassification, getRiskColor } from '../lib/driftCalculator';
import Navbar from '../components/Navbar';
import StudentTable from '../components/StudentTable';
import { PerformanceLineChart } from '../components/Charts';
import { Users, AlertTriangle, ArrowLeft } from 'lucide-react';

export default function InstructorDashboard() {
    const [profile, setProfile] = useState(null);
    const [studentsData, setStudentsData] = useState([]);
    const [loading, setLoading] = useState(true);

    // Drill-down states
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [studentInteractions, setStudentInteractions] = useState([]);
    const [drillLoading, setDrillLoading] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();
                setProfile(profileData);

                // Fetch profiles that are students
                const { data: profilesList } = await supabase
                    .from('profiles')
                    .select('id, name')
                    .eq('role', 'student');

                // NEW: Fetch students assigned ONLY to this instructor
                let studentsQuery = supabase
                    .from('students')
                    .select('id, user_id, instructor_id');

                if (profileData.role === 'instructor') {
                    studentsQuery = studentsQuery.eq('instructor_id', user.id);
                }

                const { data: studentsList } = await studentsQuery;

                const { data: driftScores } = await supabase
                    .from('drift_scores')
                    .select('student_id, drift_score, accuracy, updated_at')
                    .order('updated_at', { ascending: false });

                // Map them together
                if (profilesList && studentsList && driftScores) {
                    const combined = studentsList.map(st => {
                        const prof = profilesList.find(p => p.id === st.user_id) || {};
                        // Get latest score
                        const scoreObj = driftScores.find(d => d.student_id === st.id) || { drift_score: 0, accuracy: 0 };
                        return {
                            id: st.id,
                            name: prof.name || 'Unknown Student',
                            accuracy: scoreObj.accuracy,
                            drift_score: scoreObj.drift_score
                        };
                    }).filter(c => c.name !== 'Unknown Student');

                    setStudentsData(combined);
                }
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadStudentAnalytics = async (student) => {
        setSelectedStudent(student);
        setDrillLoading(true);
        try {
            const { data: interactionData } = await supabase
                .from('interactions')
                .select('*')
                .eq('student_id', student.id)
                .order('timestamp', { ascending: true });

            setStudentInteractions(interactionData || []);
        } catch (err) {
            console.error('Error loading student details:', err);
        } finally {
            setDrillLoading(false);
        }
    };

    const interventionList = studentsData.filter(s => s.drift_score > 60);

    if (loading) return (
        <div className="min-h-screen bg-slate-50 flex justify-center items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 pb-12">
            <Navbar userRole={profile?.role} userName={profile?.name} />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
                {!selectedStudent ? (
                    <>
                        {/* Class Overview Header */}
                        <div>
                            <h2 className="text-2xl font-bold text-slate-800">Class Overview</h2>
                            <p className="text-slate-500 text-sm mt-1">Monitor learning progress and identify concept drift</p>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

                            {/* Intervention Alerts Panel */}
                            <div className="lg:col-span-1 space-y-6">
                                <div className="glass-card p-6 border-rose-200 bg-rose-50 shadow-sm">
                                    <div className="flex items-center gap-3 mb-4 text-rose-600">
                                        <AlertTriangle className="w-5 h-5" />
                                        <h3 className="font-bold">Needs Intervention</h3>
                                    </div>
                                    <div className="space-y-3 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                                        {interventionList.length > 0 ? interventionList.map(student => (
                                            <div
                                                key={student.id}
                                                className="p-3 rounded-lg bg-white border border-rose-100 cursor-pointer hover:bg-rose-100/50 transition-colors shadow-sm"
                                                onClick={() => loadStudentAnalytics(student)}
                                            >
                                                <p className="text-slate-800 font-medium text-sm">{student.name}</p>
                                                <div className="flex justify-between items-center mt-2">
                                                    <span className="text-xs text-rose-600 font-semibold">Drift: {Math.round(student.drift_score)}</span>
                                                    <span className="text-xs text-slate-500">Acc: {(student.accuracy * 100).toFixed(0)}%</span>
                                                </div>
                                            </div>
                                        )) : (
                                            <p className="text-slate-500 text-sm italic">No students currently at high risk.</p>
                                        )}
                                    </div>
                                </div>

                                <div className="glass-card p-6 flex flex-col items-center justify-center text-center">
                                    <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mb-3 text-blue-600">
                                        <Users className="w-6 h-6" />
                                    </div>
                                    <p className="text-3xl font-bold text-slate-800 mb-1">{studentsData.length}</p>
                                    <p className="text-xs font-medium text-slate-500 uppercase tracking-widest">Total Students</p>
                                </div>
                            </div>

                            {/* Main Class List */}
                            <div className="lg:col-span-3">
                                <StudentTable students={studentsData} onRowClick={loadStudentAnalytics} />
                            </div>
                        </div>
                    </>
                ) : (
                    /* Student Drill-Down View */
                    <div className="space-y-6">
                        <button
                            onClick={() => setSelectedStudent(null)}
                            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors text-sm font-medium"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Class Overview
                        </button>

                        <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-800">{selectedStudent.name}</h2>
                                <p className="text-slate-500 text-sm mt-1">Detailed concept drift analysis</p>
                            </div>
                            <div className={`px-4 py-1.5 rounded-full border ${getRiskColor(getRiskClassification(selectedStudent.drift_score))}`}>
                                <span className="font-bold tracking-wide uppercase text-sm">{getRiskClassification(selectedStudent.drift_score)}</span>
                            </div>
                        </div>

                        {drillLoading ? (
                            <div className="py-20 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="glass-card p-6">
                                    <h3 className="text-lg font-bold text-slate-800 mb-4">Accuracy Trend</h3>
                                    <PerformanceLineChart
                                        data={studentInteractions.map(d => ({ ...d, Accuracy: d.correct ? 100 : 0 }))}
                                        dataKey="Accuracy" color="#2563eb" name="Accuracy (%)" yDomain={[0, 100]}
                                    />
                                </div>
                                <div className="glass-card p-6">
                                    <h3 className="text-lg font-bold text-slate-800 mb-4">Solving Time Evolution</h3>
                                    <PerformanceLineChart
                                        data={studentInteractions.map(d => ({ ...d, 'Time (s)': d.time_taken }))}
                                        dataKey="Time (s)" color="#0891b2" name="Time (s)"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
