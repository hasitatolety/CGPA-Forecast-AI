import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { UploadCloud, FileText, CheckCircle, BarChart2, BrainCircuit, User, LayoutDashboard, Settings, TrendingUp, ChevronDown, LogIn } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import Home from './components/Home';
import Setup from './components/Setup';
import SubjectReview from './components/SubjectReview';
import SemesterInput from './components/SemesterInput';
import Dashboard from './components/Dashboard';
import AcademicResults from './components/AcademicResults';
import Profile from './components/Profile';
import Login from './components/Login';
import { firebaseService } from './firebase';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Firebase auth listener
    const unsubscribe = firebaseService.subscribeAuth((u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <BrainCircuit className="w-16 h-16 text-blue-400 animate-pulse" />
    </div>
  );

  return (
    <Router>
      <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans overflow-x-hidden">
        {user && <Navbar user={user} />}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-8">
          <Routes>
            <Route path="/login" element={<Login />} />
            {!user ? (
              <Route path="*" element={<Login />} />
            ) : (
              <>
                <Route path="/" element={<Home />} />
                <Route path="/setup" element={<Setup />} />
                <Route path="/review" element={<SubjectReview user={user} />} />
                <Route path="/semester-input" element={<SemesterInput user={user} />} />
                <Route path="/dashboard" element={<Dashboard user={user} />} />
                <Route path="/results" element={<AcademicResults user={user} />} />
                <Route path="/profile" element={<Profile user={user} />} />
              </>
            )}
          </Routes>
        </main>
        <footer className="py-6 text-center text-slate-500 border-t border-slate-800">
          <p>{new Date().getFullYear()} CGPA Forecast AI</p>
        </footer>
      </div>
    </Router>
  );
}

function Navbar({ user }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navTo = (path) => {
    navigate(path);
    setIsOpen(false);
  };

  const handleLogout = async () => {
    await firebaseService.logout();
    navigate('/login');
  };

  return (
    <nav className="glass sticky top-0 z-50 px-6 py-4 flex items-center justify-between shadow-md">
      <Link to="/" className="flex items-center gap-2 text-xl font-bold tracking-tight">
        <BrainCircuit className="text-blue-400 w-8 h-8" />
        <span className="gradient-text">CGPA Forecast AI</span>
      </Link>

      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-3 px-4 py-2 rounded-2xl transition-all duration-300 ${isOpen ? 'bg-slate-800 ring-2 ring-blue-500/50' : 'hover:bg-slate-800 border border-transparent'
            }`}
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg font-bold text-sm">
            {user.email.charAt(0).toUpperCase()}
          </div>
          <span className="hidden md:block font-medium text-slate-200">User Profile</span>
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-3 w-64 glass-card rounded-2xl border border-slate-700/50 shadow-2xl p-2 animate-in fade-in zoom-in duration-200">
            <div className="px-4 py-3 border-b border-white/5 mb-2">
              <p className="text-xs font-semibold text-blue-400 tracking-wider uppercase">Active Session</p>
              <p className="text-sm font-medium text-slate-100 truncate mt-1">{user.email}</p>
            </div>

            <button
              onClick={() => navTo('/dashboard')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-colors group text-left"
            >
              <LayoutDashboard className="w-5 h-5 text-slate-400 group-hover:text-blue-400" />
              <span className="font-medium">Dashboard</span>
            </button>

            <button
              onClick={() => navTo('/profile')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-colors group text-left"
            >
              <Settings className="w-5 h-5 text-slate-400 group-hover:text-purple-400" />
              <span className="font-medium">Your Account</span>
            </button>

            <button
              onClick={() => navTo('/results')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-colors group text-left"
            >
              <TrendingUp className="w-5 h-5 text-slate-400 group-hover:text-green-400" />
              <span className="font-medium">Overall Results</span>
            </button>

            <div className="mt-2 pt-2 border-t border-white/5">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-rose-500/10 text-rose-400 transition-colors group text-left"
              >
                <LogIn className="w-5 h-5 group-hover:rotate-180 transition-transform" />
                <span className="font-medium">Log Out</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

export default App;
