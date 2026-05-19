import React, { useEffect, useState } from 'react';
import { Activity, ShieldAlert, GraduationCap, ClipboardList, TrendingUp } from 'lucide-react';
import { firebaseService } from '../firebase';

export default function AcademicResults({ user }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const pastSemesters = await firebaseService.getSemesterHistory(user.uid);
        const storedPrediction = await firebaseService.getStoredPrediction(user.uid);
        
        if (pastSemesters.length === 0) {
          setLoading(false);
          return;
        }

        // Calculate CGPA trends
        let historyTable = [];
        let runningCredits = 0;
        let runningPoints = 0;

        pastSemesters.forEach(s => {
          let semCredits = s.subjects?.reduce((sum, sub) => sum + (parseFloat(sub.credits) || 0), 0) || 20;
          let semPoints = s.subjects?.reduce((sum, sub) => sum + (parseFloat(sub.credits) || 0) * (parseFloat(sub.grade_point) || 0), 0) || (s.sgpa * 20);
          
          runningCredits += semCredits;
          runningPoints += semPoints;
          let currentCgpa = runningCredits > 0 ? (runningPoints / runningCredits) : s.sgpa;
          
          historyTable.push({
            semester: s.semester_no,
            sgpa: s.sgpa,
            cgpa: currentCgpa,
            credits: semCredits,
            type: 'Actual'
          });
        });

        if (storedPrediction) {
          const nextSemNo = pastSemesters.length + 1;
          const predCredits = storedPrediction.predicted_subjects?.reduce((sum, sub) => sum + (parseFloat(sub.credits) || 0), 0) || 20;
          
          historyTable.push({
            semester: nextSemNo,
            sgpa: storedPrediction.predicted_sgpa,
            cgpa: storedPrediction.predicted_cgpa,
            credits: predCredits,
            type: 'Predicted'
          });
        }

        setData({ historyTable });
      } catch (err) {
        console.error("Results page error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
      <p className="text-slate-400 font-medium">Compiling Full Academic Record...</p>
    </div>
  );

  if (!data) return (
    <div className="text-center py-20 px-6 glass-card rounded-3xl max-w-xl mx-auto border border-white/5 shadow-2xl">
      <ClipboardList className="w-16 h-16 text-slate-600 mx-auto mb-6" />
      <h2 className="text-3xl font-black text-white mb-4">No Records Found</h2>
      <p className="text-slate-400">Complete your profile setup to see your overall academic performance results here.</p>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto py-10 animate-in fade-in slide-in-from-right duration-700">
      <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
        <div>
          <h1 className="text-5xl font-black mb-3 flex items-center gap-4">
            <GraduationCap className="text-blue-500 w-12 h-12" />
            Overall Results
          </h1>
          <p className="text-slate-400 text-lg">Detailed academic history including AI-predicted future performance.</p>
        </div>
      </div>

      <div className="glass-card rounded-[2.5rem] overflow-hidden border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.3)] bg-slate-800/20 backdrop-blur-xl">
        <div className="p-8 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-blue-500/10 to-purple-500/10">
          <h3 className="text-xl font-bold flex items-center gap-3">
            <ClipboardList className="text-blue-400" />
            Academic Transcript Summary
          </h3>
          <div className="text-xs font-bold px-4 py-1.5 bg-slate-800/80 rounded-full border border-slate-700 text-slate-400">
            {data.historyTable.length} Semesters Recorded
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-900/50">
              <tr>
                <th className="px-8 py-6 font-bold text-slate-400 uppercase tracking-widest text-xs">Semester</th>
                <th className="px-8 py-6 font-bold text-slate-400 uppercase tracking-widest text-xs">Total Credits</th>
                <th className="px-8 py-6 font-bold text-slate-400 uppercase tracking-widest text-xs">SGPA</th>
                <th className="px-8 py-6 font-bold text-slate-400 uppercase tracking-widest text-xs">CGPA</th>
                <th className="px-8 py-6 font-bold text-slate-400 uppercase tracking-widest text-xs text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {data.historyTable.map((row, idx) => (
                <tr key={idx} className={`${row.type === 'Predicted' ? 'bg-blue-600/10 border-l-4 border-blue-500' : 'hover:bg-white/5'} transition-all group`}>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${row.type === 'Predicted' ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-700 text-slate-400'}`}>
                        <TrendingUp className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-xl text-slate-100 italic">SEM {row.semester}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-slate-300 font-medium">{row.credits} Credits</td>
                  <td className="px-8 py-6">
                    <span className="text-2xl font-black text-blue-400 drop-shadow-[0_0_10px_rgba(96,165,250,0.3)]">
                      {row.sgpa.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <span className="text-2xl font-black text-purple-400 drop-shadow-[0_0_10px_rgba(192,132,252,0.3)]">
                      {row.cgpa.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border ${
                      row.type === 'Actual' 
                        ? 'bg-slate-800 text-slate-500 border-slate-700' 
                        : 'bg-blue-500/20 text-blue-400 border-blue-500/40 shadow-[0_0_20px_rgba(59,130,246,0.3)] animate-pulse'
                    }`}>
                      {row.type}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8 px-4">
          <div className="flex items-start gap-4 p-6 bg-blue-500/5 rounded-3xl border border-blue-500/10">
              <div className="p-3 bg-blue-500/20 rounded-2xl">
                  <Activity className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                  <h4 className="font-bold text-slate-200 mb-1">Performance Stability</h4>
                  <p className="text-sm text-slate-400">Your SGPA trend suggests a {data.historyTable[data.historyTable.length-1].sgpa > data.historyTable[0].sgpa ? 'positive upward' : 'stable'} growth trajectory. Keep maintaining consistency across core subjects.</p>
              </div>
          </div>
          
          <div className="flex items-start gap-4 p-6 bg-amber-500/5 rounded-3xl border border-amber-500/10">
              <div className="p-3 bg-amber-500/20 rounded-2xl">
                  <ShieldAlert className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                  <h4 className="font-bold text-slate-200 mb-1">AI Calculation Model</h4>
                  <p className="text-sm text-slate-400">Predicted values are derived from historical patterns using RNN deep learning. Actual results may vary based on future exam performance.</p>
              </div>
          </div>
      </div>
    </div>
  );
}
