import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, ArrowRight, BrainCircuit } from 'lucide-react';

export default function Setup() {
  const [currentSem, setCurrentSem] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleStart = () => {
    const sem = parseInt(currentSem);
    if (!sem || sem < 1 || sem > 8) {
      setError('Please enter a valid semester (1-8).');
      return;
    }
    if (sem === 1) {
      setError('You need at least 1 past semester (Select 2-8).');
      return;
    }

    // Initialize the flow
    localStorage.setItem('targetCurrentSemester', sem.toString());
    localStorage.removeItem('pastSemesters'); // Reset previous data
    
    // Start manual entry for semester 1
    navigate(`/review`, { state: { subjects: [], semester: 1 } });
  };

  return (
    <div className="max-w-xl mx-auto py-20 animate-in slide-in-from-bottom flex flex-col items-center">
      <div className="p-6 bg-slate-800 rounded-full mb-8">
        <Settings className="w-12 h-12 text-blue-400" />
      </div>
      
      <h2 className="text-4xl font-bold mb-4 text-white text-center">Let's Get Started</h2>
      <p className="text-slate-400 text-center mb-10">We need to understand your academic timeline to dynamically collect your past grade cards.</p>
      
      <div className="glass-card w-full p-8 rounded-3xl flex flex-col gap-6">
        <div>
          <label className="block text-slate-300 font-medium mb-2">What is your current or upcoming semester?</label>
          <input 
            type="number" 
            placeholder="e.g. 5"
            value={currentSem}
            onChange={(e) => setCurrentSem(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 focus:border-blue-500 rounded-xl px-4 py-3 text-white outline-none"
            min="2"
            max="8"
          />
        </div>

        {error && (
          <p className="text-rose-400 text-sm">{error}</p>
        )}

        <button 
          onClick={handleStart}
          className="w-full py-4 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold text-white transition flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(37,99,235,0.4)]"
        >
          Begin Analysis Flow <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
