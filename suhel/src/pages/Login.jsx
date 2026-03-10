import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Activity, Lock, Mail, Loader2, AlertCircle, User, Briefcase } from 'lucide-react';

export default function Login() {
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [role, setRole] = useState('student');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const handleAuth = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (isSignUp) {
                // Sign Up
                const { data, error: signUpError } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            name,
                            role
                        }
                    }
                });

                if (signUpError) throw signUpError;

                // After signup, we can try to fetch role and redirect or just redirect based on selected role
                // Sometimes signup requires email confirmation, but assuming it auto-logs in here for prototype
                if (role === 'admin') navigate('/admin-dashboard');
                else if (role === 'instructor') navigate('/instructor-dashboard');
                else navigate('/student-dashboard');

            } else {
                // Sign In
                const { data, error: signInError } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });

                if (signInError) throw signInError;

                // Fetch user profile to get role
                const { data: profileData, error: profileError } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', data.user.id)
                    .single();

                if (profileError) throw profileError;

                const userRole = profileData.role;

                // Redirect based on role
                if (userRole === 'admin') navigate('/admin-dashboard');
                else if (userRole === 'instructor') navigate('/instructor-dashboard');
                else navigate('/student-dashboard');
            }

        } catch (err) {
            setError(err.message || 'Authentication failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 relative overflow-hidden">
            {/* Decorative background blobs */}
            <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-500/10 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px]" />

            <div className="w-full max-w-md glass-card p-8 relative z-10 transition-all duration-300">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-4 border border-slate-100 shadow-sm">
                        <Activity className="w-8 h-8 text-blue-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
                        {isSignUp ? 'Create an Account' : 'Welcome Back'}
                    </h2>
                    <p className="text-slate-500 text-sm mt-2 text-center">
                        {isSignUp ? 'Join the Concept Drift Detection System' : 'Log in to the Concept Drift Detection System'}
                    </p>
                </div>

                {error && (
                    <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-100 flex items-start gap-3 shadow-sm">
                        <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-rose-800">{error}</p>
                    </div>
                )}

                <form onSubmit={handleAuth} className="space-y-4">

                    {isSignUp && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor="name">
                                    Full Name
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <User className="h-5 w-5 text-slate-400" />
                                    </div>
                                    <input
                                        id="name"
                                        type="text"
                                        required
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="block w-full pl-10 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-slate-800 placeholder-slate-400 transition-colors"
                                        placeholder="John Doe"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor="role">
                                    Account Role
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Briefcase className="h-5 w-5 text-slate-400" />
                                    </div>
                                    <select
                                        id="role"
                                        value={role}
                                        onChange={(e) => setRole(e.target.value)}
                                        className="block w-full pl-10 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-slate-800 transition-colors appearance-none cursor-pointer"
                                    >
                                        <option className="bg-white text-slate-800" value="student">Student</option>
                                        <option className="bg-white text-slate-800" value="instructor">Instructor</option>
                                        <option className="bg-white text-slate-800" value="admin">Admin</option>
                                    </select>
                                </div>
                            </div>
                        </>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor="email">
                            Email Address
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Mail className="h-5 w-5 text-slate-400" />
                            </div>
                            <input
                                id="email"
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="block w-full pl-10 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-slate-800 placeholder-slate-400 transition-colors"
                                placeholder="you@university.edu"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor="password">
                            Password
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-slate-400" />
                            </div>
                            <input
                                id="password"
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="block w-full pl-10 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-slate-800 placeholder-slate-400 transition-colors"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex justify-center items-center py-2.5 px-4 mt-2 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {loading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            isSignUp ? 'Sign Up' : 'Sign In'
                        )}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm">
                    <p className="text-slate-600">
                        {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                        <button
                            type="button"
                            onClick={() => {
                                setIsSignUp(!isSignUp);
                                setError(null);
                            }}
                            className="text-blue-600 hover:text-blue-700 font-medium transition-colors focus:outline-none"
                        >
                            {isSignUp ? 'Sign In' : 'Sign Up'}
                        </button>
                    </p>
                </div>

                <div className="mt-8 text-center text-xs text-slate-400 font-medium">
                    <p>Educational Analytics Platform</p>
                </div>
            </div>
        </div>
    );
}
