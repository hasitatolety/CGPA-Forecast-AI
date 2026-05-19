import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Plus, Trash2, ArrowRight, RefreshCw, ShieldAlert } from 'lucide-react';
import { firebaseService } from '../firebase';

export default function SemesterInput({ user }) {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSimulating, setIsSimulating] = useState(false);
  const [pastTotals, setPastTotals] = useState({ points: 0, credits: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    const loadSession = async () => {
      try {
        // Load history totals for CGPA calculation
        const history = await firebaseService.getSemesterHistory(user.uid);
        const totals = history.reduce((acc, sem) => {
          const semCredits = sem.subjects?.reduce((sum, s) => sum + (parseFloat(s.credits) || 0), 0) || 20;
          const semPoints = sem.subjects?.reduce((sum, s) => sum + (parseFloat(s.credits) || 0) * (parseFloat(s.grade_point) || 0), 0) || (sem.sgpa * 20);
          return {
            credits: acc.credits + semCredits,
            points: acc.points + semPoints
          };
        }, { credits: 0, points: 0 });
        setPastTotals(totals);

        const stored = await firebaseService.getStoredPrediction(user.uid);
        if (stored && stored.predicted_subjects) {
          setSubjects(stored.predicted_subjects.map(s => ({
            ...s,
            grade: s.grade || "A",
            credits: s.credits || 3.0,
            grade_point: s.grade_point || 8.0
          })));
          setIsSimulating(true);
        } else {
          const configSubjects = await firebaseService.getTargetSubjects(user.uid);
          if (configSubjects.length > 0) {
              setSubjects(configSubjects.map(s => ({
                subject: s.subject,
                grade: "A",
                credits: s.credits || 3.0,
                grade_point: 8.0
              })));
          } else {
              setSubjects([
                { subject: "Prerequisite 1", credits: 4, grade: "A", grade_point: 8 },
                { subject: "Prerequisite 2", credits: 3, grade: "A", grade_point: 8 }
              ]);
          }
        }
      } catch (err) {
        console.error("Load session error:", err);
      } finally {
        setLoading(false);
      }
    };
    loadSession();
  }, [user]);

  const handleEdit = (index, field, value) => {
    const updated = [...subjects];
    updated[index][field] = value;

    if (field === 'grade') {
      const gpDict = { "O": 10, "A+": 9, "A": 8, "B+": 7, "B": 6, "C": 5, "P": 4, "F": 0 };
      updated[index].grade_point = gpDict[value] || 0;
    }
    setSubjects(updated);
  };

  const calculateSGPA = () => {
    const totalCredits = subjects.reduce((sum, sub) => sum + parseFloat(sub.credits || 0), 0);
    const totalPoints = subjects.reduce((sum, sub) => sum + (parseFloat(sub.credits || 0) * parseFloat(sub.grade_point || 0)), 0);
    return totalCredits ? (totalPoints / totalCredits).toFixed(2) : 0;
  };

  const handleAdd = () => {
    setSubjects([...subjects, { subject: "New Subject", credits: 3.0, grade: "A", grade_point: 8.0 }]);
  };

  const handleRemove = (idx) => {
    setSubjects(subjects.filter((_, i) => i !== idx));
  };

  const calculateCGPA = () => {
    const simCredits = subjects.reduce((sum, sub) => sum + parseFloat(sub.credits || 0), 0);
    const simPoints = subjects.reduce((sum, sub) => sum + (parseFloat(sub.credits || 0) * parseFloat(sub.grade_point || 0)), 0);
    
    const totalCredits = pastTotals.credits + simCredits;
    const totalPoints = pastTotals.points + simPoints;
    
    return totalCredits ? (totalPoints / totalCredits).toFixed(2) : 0;
  };

  const handleRecalculate = async () => {
      const simulatedSGPA = parseFloat(calculateSGPA());
      const simulatedCGPA = parseFloat(calculateCGPA());
      
      const simulatedPrediction = {
          predicted_sgpa: simulatedSGPA,
          predicted_cgpa: simulatedCGPA,
          predicted_subjects: subjects,
          risk_subjects: [], // Or keep original risks if we want
          timestamp: new Date().toISOString(),
          is_simulated: true
      };

      await firebaseService.savePrediction(user.uid, simulatedPrediction);
      navigate('/dashboard');
  };

  const handleSubmit = async () => {
      if (!isSimulating) {
          await firebaseService.saveTargetSubjects(user.uid, subjects);
          navigate('/dashboard');
      } else {
          navigate('/dashboard');
      }
  };

  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
        <RefreshCw className="w-12 h-12 text-blue-500 animate-spin" />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto py-12 animate-in slide-in-from-bottom duration-500">
      <div className="flex flex-col lg:flex-row items-center justify-between mb-12 gap-8">
        <div className="flex items-center gap-4">
            <div className="p-4 bg-blue-500/10 rounded-3xl border border-blue-500/20 shadow-inner">
              <BookOpen className="w-8 h-8 text-blue-400" />
            </div>
            <div>
                <h2 className="text-4xl font-black gradient-text">
                  {isSimulating ? 'What-If Simulator' : 'Current Semester Setup'}
                </h2>
                <p className="text-slate-400 text-sm mt-1">
                    {isSimulating ? 'Modify predicted grades to see how your SGPA & CGPA change.' : 'Input the subjects you are enrolled in now.'}
                </p>
            </div>
        </div>

        <div className="flex gap-4">
            <div className="bg-slate-800 p-1 rounded-2xl flex items-center shadow-2xl border border-white/5">
                <div className="px-6 py-3 border-r border-slate-700">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Simulated SGPA</p>
                    <p className="text-2xl font-black text-blue-400">{calculateSGPA()}</p>
                </div>
                <div className="px-6 py-3">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Simulated CGPA</p>
                    <p className="text-2xl font-black text-purple-400">{calculateCGPA()}</p>
                </div>
            </div>
        </div>
      </div>

      <div className="glass-card rounded-[2.5rem] overflow-hidden mb-10 border border-white/5 shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-800/80 border-b border-slate-700">
              <tr>
                <th className="px-8 py-6 font-bold text-slate-300 uppercase tracking-widest text-xs">Subject Name</th>
                {isSimulating && (
                  <th className="px-8 py-6 font-bold text-slate-300 uppercase tracking-widest text-xs w-44">Predicted Grade</th>
                )}
                <th className="px-8 py-6 font-bold text-slate-300 uppercase tracking-widest text-xs w-32">Credits</th>
                <th className="px-8 py-6 font-bold text-slate-300 uppercase tracking-widest text-xs text-right w-24"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {subjects.map((sub, idx) => (
                <tr key={idx} className="hover:bg-white/5 transition-all group">
                  <td className="px-8 py-5">
                    <input 
                      className="bg-transparent border-b-2 border-transparent focus:border-blue-500/50 w-full outline-none font-bold text-slate-100 placeholder-slate-600 transition-all py-1"
                      placeholder="e.g. Applied AI"
                      value={sub.subject}
                      onChange={(e) => handleEdit(idx, 'subject', e.target.value)}
                    />
                  </td>
                  {isSimulating && (
                    <td className="px-8 py-5">
                      <select 
                          value={sub.grade} 
                          onChange={(e) => handleEdit(idx, 'grade', e.target.value)}
                          className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500/50 w-full text-slate-200 font-medium"
                      >
                          {['O', 'A+', 'A', 'E', 'B+', 'B', 'C+', 'C', 'D', 'F', 'S'].map(g => (
                              <option key={g} value={g}>{g}</option>
                          ))}
                      </select>
                    </td>
                  )}
                  <td className="px-8 py-5">
                    <input 
                      type="number"
                      className="bg-slate-900 border border-slate-700 text-slate-100 outline-none p-2 rounded-xl text-center focus:ring-2 focus:ring-blue-500/50 w-full font-bold"
                      step="0.5"
                      value={sub.credits}
                      onChange={(e) => handleEdit(idx, 'credits', parseFloat(e.target.value))}
                    />
                  </td>
                  <td className="px-8 py-5 text-right">
                    <button 
                      onClick={() => handleRemove(idx)}
                      className="p-3 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <button 
          onClick={handleAdd}
          className="w-full py-6 bg-slate-800/30 hover:bg-slate-800/60 text-slate-400 hover:text-blue-400 font-bold flex items-center justify-center gap-3 transition-all border-t border-slate-700/50"
        >
          <div className="p-1 bg-slate-700 rounded-lg group-hover:bg-blue-500/20">
            <Plus className="w-4 h-4" />
          </div>
          Add One More Subject
        </button>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center gap-8">
        <div className="flex items-center gap-3 text-slate-500 text-sm">
            <ShieldAlert className="w-5 h-5 text-yellow-500/50" />
            <span>{isSimulating ? 'Confirming will update your dashboard with these simulated values.' : 'Simulated grades do not affect your actual model predictions.'}</span>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            {isSimulating ? (
              <>
                <button 
                  onClick={() => navigate('/dashboard')}
                  className="px-8 py-5 border border-slate-700 hover:bg-slate-800 text-slate-400 rounded-2xl font-bold transition-all flex items-center justify-center gap-3"
                >
                  Discard Changes
                </button>
                <button 
                  onClick={handleRecalculate}
                  className="px-10 py-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-2xl font-black text-white transition-all flex items-center justify-center gap-3 shadow-[0_10px_30px_rgba(37,99,235,0.3)] hover:-translate-y-1 active:scale-95 border-b-4 border-blue-800"
                >
                  <RefreshCw className="w-5 h-5" />
                  Commit & Re-calculate
                </button>
              </>
            ) : (
                <button 
                  onClick={handleSubmit}
                  className="w-full sm:w-auto px-12 py-5 bg-blue-600 hover:bg-blue-500 rounded-2xl font-black text-white transition-all flex items-center justify-center gap-3 shadow-[0_10px_30px_rgba(37,99,235,0.3)] hover:-translate-y-1 active:scale-95"
                >
                  Save & Predict Results
                  <ArrowRight className="w-5 h-5" />
                </button>
            )}
        </div>
      </div>
    </div>
  );
}
