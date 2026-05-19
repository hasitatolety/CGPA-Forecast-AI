import React, { useEffect, useState } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';
import { ShieldAlert, TrendingUp, RefreshCw, Activity, ArrowUpRight, ArrowDownRight, Wand2 } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

import { firebaseService } from '../firebase';

export default function Dashboard({ user }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [forceRefresh, setForceRefresh] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPrediction = async () => {
      try {
        // 1. Sync local data from Firestore
        const pastSemesters = await firebaseService.getSemesterHistory(user.uid);
        localStorage.setItem('pastSemesters', JSON.stringify(pastSemesters));
        
        const currentSubjectsFull = await firebaseService.getTargetSubjects(user.uid);
        localStorage.setItem('currentSubjects', JSON.stringify(currentSubjectsFull));
        
        if (pastSemesters.length === 0) {
          setLoading(false);
          setData(null);
          return;
        }

        // 2. Check cached prediction (unless forced refresh)
        if (!forceRefresh) {
            const stored = await firebaseService.getStoredPrediction(user.uid);
            if (stored) {
                setDashboardData(stored, pastSemesters);
                setLoading(false);
                return;
            }
        }
          
        const payload = {
          student_id: user.uid,
          semesters: pastSemesters,
          current_subjects: currentSubjectsFull.map(s => ({
            subject: s.subject,
            credits: parseFloat(s.credits) || 3.0,
            grade: "",
            grade_point: 0
          }))
        };

        const res = await fetch('http://localhost:8000/api/predict', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error("API failed");
        const result = await res.json();
        
        // 3. Store the result in Firebase so it persists
        await firebaseService.savePrediction(user.uid, result);
        
        setDashboardData(result, pastSemesters);
      } catch (err) {
        console.error("Dashboard error:", err);
        const localPast = JSON.parse(localStorage.getItem('pastSemesters') || '[]');
        if (localPast.length > 0) {
            const lastSgpa = localPast[localPast.length-1].sgpa;
            const nextSem = localPast.length + 1;
            setData({
                predicted_sgpa: lastSgpa,
                predicted_cgpa: lastSgpa,
                risk_subjects: [],
                predicted_subjects: [],
                trend: localPast.map(s => ({ name: `Sem ${s.semester_no}`, sgpa: s.sgpa })),
                cgpa_trend: [{ name: `Sem ${nextSem} (Pred)`, cgpa: lastSgpa }]
            });
        } else {
            setData(null);
        }
      } finally {
        setLoading(false);
      }
    };

    const setDashboardData = (result, pastSemesters) => {
        let sems = [];
        let cgpa_trend = [];
        let runningCredits = 0;
        let runningPoints = 0;
        let historyTable = [];
        
        pastSemesters.forEach(s => {
          let semCredits = s.subjects?.reduce((sum, sub) => sum + (parseFloat(sub.credits) || 0), 0) || 20;
          let semPoints = s.subjects?.reduce((sum, sub) => sum + (parseFloat(sub.credits) || 0) * (parseFloat(sub.grade_point) || 0), 0) || (s.sgpa * 20);
          
          runningCredits += semCredits;
          runningPoints += semPoints;
          let currentCgpa = runningCredits > 0 ? (runningPoints / runningCredits) : s.sgpa;
          
          sems.push({ name: `Sem ${s.semester_no}`, sgpa: s.sgpa });
          cgpa_trend.push({ name: `Sem ${s.semester_no}`, cgpa: currentCgpa });
          
          historyTable.push({
            semester: s.semester_no,
            sgpa: s.sgpa,
            cgpa: currentCgpa,
            credits: semCredits,
            type: 'Actual'
          });
        });
        
        const nextSemNo = pastSemesters.length + 1;
        const predCredits = result.predicted_subjects?.reduce((sum, sub) => sum + (parseFloat(sub.credits) || 0), 0) || 20;
        
        historyTable.push({
            semester: nextSemNo,
            sgpa: result.predicted_sgpa,
            cgpa: result.predicted_cgpa,
            credits: predCredits,
            type: 'Predicted'
        });

        setData({
          predicted_sgpa: result.predicted_sgpa,
          predicted_cgpa: result.predicted_cgpa,
          risk_subjects: result.risk_subjects || [],
          predicted_subjects: result.predicted_subjects || [],
          explanation: result.explanation || "",
          history_table: historyTable,
          trend: [
            ...sems,
            { name: `Sem ${nextSemNo} (Pred)`, sgpa: result.predicted_sgpa }
          ],
          cgpa_trend: [
            ...cgpa_trend,
            { name: `Sem ${nextSemNo} (Pred)`, cgpa: result.predicted_cgpa }
          ]
        });
    };
    
    setTimeout(fetchPrediction, 1000);
  }, [user, forceRefresh]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <RefreshCw className="w-16 h-16 text-blue-500 animate-spin mb-6" />
        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400 animate-pulse">
          Synchronizing Academic Vault
        </h2>
        <p className="text-slate-500 mt-2">Connecting to PyTorch RNN backend...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-xl mx-auto text-center">
        <div className="p-6 bg-slate-800 rounded-full mb-8 shadow-[0_0_30px_rgba(59,130,246,0.2)]">
            <ShieldAlert className="w-12 h-12 text-blue-400" />
        </div>
        <h2 className="text-3xl font-extrabold mb-4 text-white">No Real Profile Data Found</h2>
        <p className="text-slate-400 mb-8 leading-relaxed">
          The dashboard is currently empty because no academic records have been captured yet. 
          Use our intelligent AI flow to upload your grade cards for analysis.
        </p>
        <Link to="/setup" className="px-10 py-4 bg-blue-600 hover:bg-blue-500 rounded-2xl font-bold text-white transition shadow-[0_0_20px_rgba(37,99,235,0.4)] flex items-center gap-2">
            Initialize AI Setup <ArrowUpRight className="w-5 h-5" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in duration-700">
      
      <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-6">
        <div>
          <h1 className="text-4xl font-extrabold mb-2 flex items-center gap-3">
            <Activity className="text-blue-500" />
            Performance Forecast
          </h1>
          <p className="text-slate-400">Deep Learning powered insights for your upcoming semester.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row justify-center gap-6 mt-16 animate-in slide-in-from-bottom duration-700 delay-300">
        <button 
          onClick={() => navigate('/semester-input')}
          className="px-8 py-4 bg-blue-600 hover:bg-blue-500 rounded-2xl font-black text-white flex items-center justify-center gap-3 transition-all shadow-[0_10px_30px_rgba(37,99,235,0.3)] hover:-translate-y-1 active:scale-95"
        >
          <Wand2 className="w-5 h-5" />
          What-If Simulator
        </button>
        
        <button 
          onClick={() => {
              setLoading(true);
              setForceRefresh(prev => !prev); // Toggle to force useEffect re-run
          }}
          className="px-8 py-4 bg-slate-800 hover:bg-slate-700 rounded-2xl font-bold text-slate-300 flex items-center justify-center gap-3 transition-all border border-slate-700/50 hover:border-blue-500/50 active:scale-95"
        >
          <RefreshCw className="w-5 h-5" />
          Recalculate with AI
        </button>
      </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <MetricCard 
          title="Predicted SGPA" 
          value={data.predicted_sgpa.toFixed(2)} 
          subtitle="Expected Next Semester"
          trend="up"
          trendVal="+0.5"
          color="blue"
        />
        <MetricCard 
          title="Forecasted CGPA" 
          value={data.predicted_cgpa.toFixed(2)} 
          subtitle="Culmulative Average"
          trend="up"
          trendVal="+0.12"
          color="purple"
        />
      </div>

      {data.risk_subjects.length > 0 && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-6 mb-8 flex items-start gap-4">
          <div className="p-3 bg-rose-500/20 rounded-xl">
            <ShieldAlert className="w-8 h-8 text-rose-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-rose-400 mb-2">High-Risk Subjects Identified</h3>
            <p className="text-slate-300 mb-4">Our model indicates higher difficulty based on your historical patterns in related prerequisite subjects. Consider dedicating extra study time.</p>
            <div className="flex flex-wrap gap-2">
              {data.risk_subjects.map((sub, i) => (
                <span key={i} className="px-4 py-1.5 bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-full text-sm font-medium">
                  {sub}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="glass-card p-6 rounded-3xl">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <TrendingUp className="text-blue-400" /> SGPA Trend
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer>
              <LineChart data={data.trend} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" tick={{fill: '#94a3b8'}} />
                <YAxis domain={['auto', 10]} stroke="#94a3b8" tick={{fill: '#94a3b8'}} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '12px', color: '#f8fafc' }}
                  itemStyle={{ color: '#60a5fa' }}
                />
                <Line type="monotone" dataKey="sgpa" stroke="#60a5fa" strokeWidth={3} dot={{r: 5, fill: '#60a5fa'}} activeDot={{r: 8}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-6 rounded-3xl">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <TrendingUp className="text-purple-400" /> CGPA Projection
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer>
              <BarChart data={data.cgpa_trend} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" tick={{fill: '#94a3b8'}} />
                <YAxis domain={[7, 10]} stroke="#94a3b8" tick={{fill: '#94a3b8'}} />
                <Tooltip 
                  cursor={{fill: '#334155', opacity: 0.4}}
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '12px' }}
                  itemStyle={{ color: '#c084fc' }}
                />
                <Bar dataKey="cgpa" fill="url(#colorCgpa)" radius={[6, 6, 0, 0]} barSize={40} />
                <defs>
                  <linearGradient id="colorCgpa" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#c084fc" stopOpacity={0.9}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.9}/>
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      <div className="glass-card p-8 rounded-3xl mb-10 border border-slate-700/50">
        <h3 className="text-xl font-bold mb-6 text-slate-100 uppercase tracking-tighter">Predicted Grades Snapshot</h3>
        <div className="overflow-x-auto rounded-2xl border border-slate-700/30">
          <table className="w-full text-left">
            <thead className="bg-[#1e293b]/50 border-b border-slate-700">
              <tr>
                <th className="px-6 py-4 font-semibold text-slate-300">Subject Name</th>
                <th className="px-6 py-4 font-semibold text-slate-300">Predicted Grade</th>
                <th className="px-6 py-4 font-semibold text-slate-300 text-center">Expected Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {data.predicted_subjects.map((sub, idx) => (
                <tr key={idx} className="hover:bg-blue-500/5 transition-colors">
                  <td className="px-6 py-4 font-semibold text-slate-200">
                    {sub.subject}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-4 py-1.5 rounded-xl text-sm font-black border ${
                      sub.grade === 'O' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                      sub.grade.includes('A') ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                      'bg-orange-500/10 text-orange-400 border-orange-500/20'
                    }`}>
                      {sub.grade}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-300 font-bold text-center">{sub.grade_point} / 10</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {data.explanation && (
        <div className="glass-card p-10 rounded-[3rem] mb-12 border border-blue-500/20 bg-gradient-to-br from-[#1e293b]/50 to-transparent shadow-[0_30px_60px_rgba(0,0,0,0.3)] overflow-hidden">
          <div className="flex items-center gap-6 mb-10">
              <div className="p-4 bg-blue-500/10 rounded-[1.5rem] border border-blue-500/20">
                  <Wand2 className="w-10 h-10 text-blue-400" />
              </div>
              <div>
                  <h3 className="text-3xl font-black text-slate-100 uppercase tracking-tighter">AI Academic Intelligence</h3>
                  <p className="text-blue-400/60 font-bold uppercase tracking-widest text-[10px]">Neural Forecast & Continuity Analysis</p>
              </div>
          </div>


        <div className="overflow-x-auto rounded-3xl border border-slate-700/50">
          <table className="w-full text-left">
            <thead className="bg-[#1e293b]/95 border-b border-slate-700">
              <tr>
                <th className="px-8 py-6 font-bold text-slate-300 text-xs uppercase tracking-[0.2em] w-1/4">Current Subject</th>
                <th className="px-8 py-6 font-bold text-slate-300 text-xs uppercase tracking-[0.2em] w-24">Grade</th>
                <th className="px-8 py-6 font-bold text-slate-300 text-xs uppercase tracking-[0.2em]">AI Reasoning & Continuity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {data.predicted_subjects.map((sub, idx) => (
                <tr key={idx} className="hover:bg-blue-500/5 transition-all duration-300 group">
                  <td className="px-8 py-7">
                    <div className="flex flex-col gap-1">
                        <span className="font-bold text-slate-100 text-lg group-hover:text-blue-400 transition-colors">{sub.subject}</span>
                        <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{sub.credits} Credits</span>
                    </div>
                  </td>
                  <td className="px-8 py-7 capitalize">
                    <div className={`w-12 h-12 flex items-center justify-center rounded-2xl font-black text-xl shadow-lg border ${
                      sub.grade === 'O' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                      sub.grade.includes('A') ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                      'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                    }`}>
                      {sub.grade}
                    </div>
                  </td>
                  <td className="px-8 py-7 leading-relaxed">
                    <p className="text-slate-400 text-sm font-medium" dangerouslySetInnerHTML={{ 
                        __html: sub.explanation?.replace(/\*\*(.*?)\*\*/g, '<b class="text-blue-400 font-bold">$1</b>') 
                    }} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )}



    </div>
  );
}

function MetricCard({ title, value, subtitle, trend, trendVal, color }) {
  const gradientClass = color === 'blue' 
    ? 'from-blue-500/20 to-blue-900/20 border border-blue-500/30' 
    : 'from-purple-500/20 to-purple-900/20 border border-purple-500/30';
  
  const textClass = color === 'blue' ? 'text-blue-400' : 'text-purple-400';

  return (
    <div className={`p-8 rounded-3xl bg-gradient-to-br ${gradientClass} flex flex-col justify-center relative overflow-hidden group`}>
      <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
        <Activity className={`w-32 h-32 ${textClass}`} />
      </div>
      
      <h3 className="text-xl font-medium text-slate-300 mb-2">{title}</h3>
      <div className="flex items-end gap-4">
        <span className={`text-6xl font-extrabold ${textClass}`}>{value}</span>
        {trend && (
          <div className="flex items-center gap-1 bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm font-medium mb-2">
            {trend === 'up' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
            {trendVal}
          </div>
        )}
      </div>
      <p className="text-slate-400 mt-2 text-sm">{subtitle}</p>
    </div>
  );
}
