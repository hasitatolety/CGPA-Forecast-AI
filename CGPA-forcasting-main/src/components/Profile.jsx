import React from 'react';
import { User, Mail, Shield, LogOut, Settings, Award } from 'lucide-react';
import { firebaseService } from '../firebase';
import { useNavigate } from 'react-router-dom';

export default function Profile({ user }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await firebaseService.logout();
    navigate('/login');
  };

  return (
    <div className="max-w-4xl mx-auto py-20 animate-in slide-in-from-bottom duration-700">
      <div className="flex flex-col items-center mb-16 text-center">
        <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-full blur opacity-40 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
            <div className="relative w-32 h-32 rounded-full bg-slate-800 flex items-center justify-center border-4 border-slate-700 shadow-2xl overflow-hidden group-hover:scale-105 transition-transform duration-500">
                <span className="text-5xl font-black text-white">{user.email.charAt(0).toUpperCase()}</span>
            </div>
            <div className="absolute bottom-0 right-0 bg-blue-500 p-2 rounded-full border-2 border-slate-900 shadow-lg">
                <Award className="w-5 h-5 text-white" />
            </div>
        </div>
        
        <h2 className="text-4xl font-extrabold mt-8 text-white uppercase tracking-tight">{user.email.split('@')[0]}</h2>
        <div className="flex items-center gap-2 text-slate-400 mt-2 font-medium bg-slate-800/50 px-4 py-1.5 rounded-full border border-white/5">
            <Mail className="w-4 h-4" />
            <span>{user.email}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="glass-card p-10 rounded-[2.5rem] border border-white/5 hover:border-blue-500/20 transition-all group hover:shadow-[0_0_30px_rgba(59,130,246,0.1)]">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                <Shield className="text-blue-400" />
                Security & Verification
            </h3>
            <p className="text-slate-400 mb-8 leading-relaxed">Your account is secured via Firebase Authentication. Your academic data is private and encrypted at rest in our Firestore Academic Vault.</p>
            <div className="flex items-center gap-3 bg-green-500/10 text-green-400 px-5 py-3 rounded-2xl border border-green-500/20 font-bold self-start w-fit">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-ping"></div>
                Secure Session Active
            </div>
        </div>

        <div className="glass-card p-10 rounded-[2.5rem] border border-white/5 hover:border-purple-500/20 transition-all hover:shadow-[0_0_30px_rgba(168,85,247,0.1)]">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                <Settings className="text-purple-400" />
                Account Actions
            </h3>
            <div className="space-y-4">
                <button 
                  onClick={() => navigate('/setup')} 
                  className="w-full flex items-center justify-between px-6 py-4 bg-slate-800 hover:bg-slate-700/80 border border-slate-700/50 rounded-2xl transition-all group"
                >
                    <span className="font-bold text-slate-300">Re-run Analysis Flow</span>
                    <div className="p-2 bg-slate-700 rounded-lg group-hover:bg-purple-500/20 group-hover:text-purple-400 text-slate-500 transition-colors">
                        <User className="w-4 h-4" />
                    </div>
                </button>
                
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center justify-between px-6 py-4 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-2xl transition-all group"
                >
                    <span className="font-bold text-rose-400">Sign Out Safely</span>
                    <div className="p-2 bg-rose-500/20 rounded-lg text-rose-400">
                        <LogOut className="w-4 h-4" />
                    </div>
                </button>
            </div>
        </div>
      </div>
    </div>
  );
}
