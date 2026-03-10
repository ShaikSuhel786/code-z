import { LogOut, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

export default function Navbar({ userRole, userName }) {
    const navigate = useNavigate();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/login');
    };

    return (
        <nav className="sticky top-0 z-50 bg-white border-b border-slate-200 px-6 py-4 mb-8 flex justify-between items-center shadow-sm">
            <div className="flex items-center gap-2">
                <Activity className="text-blue-600 w-6 h-6" />
                <h1 className="text-xl font-bold text-slate-800 tracking-tight">
                    Concept Drift <span className="text-blue-600">Detector</span>
                </h1>
            </div>

            <div className="flex items-center gap-6">
                {userRole && (
                    <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-full border border-slate-200">
                        <div className={`w-2 h-2 rounded-full ${userRole === 'admin' ? 'bg-fuchsia-500' : userRole === 'instructor' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                        <span className="text-sm font-medium text-slate-700 capitalize">
                            {userRole}
                        </span>
                        <span className="text-sm text-slate-400 mx-1">•</span>
                        <span className="text-sm font-medium text-slate-700">
                            {userName}
                        </span>
                    </div>
                )}

                <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors duration-200"
                >
                    <LogOut className="w-4 h-4" />
                    <span className="text-sm font-medium">Log Out</span>
                </button>
            </div>
        </nav>
    );
}
