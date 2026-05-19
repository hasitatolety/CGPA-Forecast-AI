import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, LogIn, UserPlus, BrainCircuit, AlertCircle } from 'lucide-react';
import { firebaseService } from '../firebase';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      if (isLogin) {
        await firebaseService.login(email, password);
      } else {
        await firebaseService.signup(email, password);
      }
      navigate('/');
    } catch (err) {
      console.error("Auth error:", err);
      // Simplify common errors
      if (err.code === "auth/invalid-credential") setError("Invalid email or password.");
      else if (err.code === "auth/email-already-in-use") setError("This email is already registered.");
      else if (err.code === "auth/weak-password") setError("Password should be at least 6 characters.");
      else setError("Service temporarily unavailable. Please Check Firebase Config!");
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 animate-in fade-in zoom-in duration-500">
      <div className="max-w-md w-full space-y-8 glass-card p-10 rounded-3xl border border-white/5 shadow-2xl relative overflow-hidden group">
        
        {/* Decorative background blur */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all duration-1000"></div>
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl group-hover:bg-purple-500/20 transition-all duration-1000"></div>

        <div className="text-center">
            <div className="inline-flex items-center justify-center p-4 bg-slate-800 rounded-2xl mb-4">
                <BrainCircuit className="w-12 h-12 text-blue-400" />
            </div>
            <h2 className="text-3xl font-black gradient-text">
                {isLogin ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="mt-2 text-sm text-slate-400">
                {isLogin ? 'Access your academic performance predictive insights.' : 'Join hundreds of students forecasting their success.'}
            </p>
        </div>

        {error && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center gap-3 text-rose-400 text-sm animate-in fade-in slide-in-from-top duration-300">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{error}</span>
            </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors group-focus-within:text-blue-400 text-slate-500">
                <Mail className="w-5 h-5" />
              </div>
              <input
                id="email-address"
                name="email"
                type="email"
                required
                className="block w-full pl-10 pr-4 py-4 bg-slate-900/50 border border-slate-700/50 rounded-2xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors group-focus-within:text-blue-400 text-slate-500">
                <Lock className="w-5 h-5" />
              </div>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="block w-full pl-10 pr-4 py-4 bg-slate-900/50 border border-slate-700/50 rounded-2xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-blue-600 bg-slate-900 border-slate-700 rounded focus:ring-blue-500/50"
              />
              <label htmlFor="remember-me" className="ml-2 block text-slate-400">
                Remember me
              </label>
            </div>
            <div className="text-blue-400 hover:text-blue-300 transition-colors font-medium">
              Forgot password?
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-lg font-bold rounded-2xl text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:shadow-[0_0_30px_rgba(37,99,235,0.6)] active:scale-95"
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                {isLogin ? <LogIn className="w-5 h-5 text-blue-400 group-hover:text-blue-300" /> : <UserPlus className="w-5 h-5 text-blue-400 group-hover:text-blue-300" />}
              </span>
              {isLogin ? 'Sign In' : 'Sign Up'}
            </button>
          </div>
        </form>

        <div className="text-center mt-6">
            <button 
                onClick={() => setIsLogin(!isLogin)}
                className="text-slate-400 hover:text-blue-400 transition-colors text-sm font-medium"
            >
                {isLogin ? "Don't have an account? Create one" : "Already have an account? Sign in"}
            </button>
        </div>
      </div>
    </div>
  );
}
