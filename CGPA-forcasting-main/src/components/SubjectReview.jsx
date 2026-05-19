import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, AlertTriangle, FileEdit, Trash2, ArrowRight, Plus } from 'lucide-react';
import { firebaseService } from '../firebase';

export default function SubjectReview({ user }) {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState(state?.subjects || []);
  const [saving, setSaving] = useState(false);
  const sem = state?.semester || 1;
  const targetSem = parseInt(localStorage.getItem('targetCurrentSemester')) || 2;

  // Reset subjects when moving to a new semester
  React.useEffect(() => {
    setSubjects(state?.subjects || []);
  }, [sem]);

  const handleEdit = (index, field, value) => {
    const updated = [...subjects];
    updated[index][field] = value;

    // Auto-calculate grade points if grade changes
    if (field === 'grade') {
      const gpDict = {
        "O": 10, "A+": 9, "A": 8, "B+": 7, "B": 6, "C": 5, "P": 4, "F": 0
      };
      updated[index].grade_point = gpDict[value] || 0;
    }

    setSubjects(updated);
  };

  const handleRemove = (index) => {
    setSubjects(subjects.filter((_, i) => i !== index));
  };

  const handleAddRow = () => {
    setSubjects([...subjects, { subject: "New Subject", grade: "A", credits: 3.0, grade_point: 8.0 }]);
  };

  const calculateSGPA = () => {
    if (subjects.length === 0) return 0;
    const totalCredits = subjects.reduce((sum, sub) => sum + parseFloat(sub.credits || 0), 0);
    const totalPoints = subjects.reduce((sum, sub) => sum + (parseFloat(sub.credits || 0) * parseFloat(sub.grade_point || 0)), 0);
    return totalCredits ? (totalPoints / totalCredits).toFixed(2) : 0;
  };

  const handleProceed = async () => {
    setSaving(true);
    const newSemData = {
      semester_no: sem,
      subjects: subjects,
      sgpa: parseFloat(calculateSGPA())
    };

    try {
      await firebaseService.saveSemesterHistory(user.uid, newSemData);

      // Also update local cache for immediate dashboard use
      const history = JSON.parse(localStorage.getItem('pastSemesters') || '[]');
      const existingIndex = history.findIndex(h => h.semester_no === sem);
      if (existingIndex >= 0) history[existingIndex] = newSemData;
      else history.push(newSemData);
      localStorage.setItem('pastSemesters', JSON.stringify(history));

      if (sem < targetSem - 1) {
        navigate(`/review`, { state: { subjects: [], semester: sem + 1 } });
      } else {
        navigate('/semester-input');
      }
    } catch (err) {
      console.error("Failed to save to Firebase:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 animate-in slide-in-from-right duration-500">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-10 gap-6">
        <div>
          <h2 className="text-4xl font-extrabold flex items-center gap-3">
            Semester {sem} Grades
            <div className="bg-blue-500/10 px-3 py-1 rounded-lg border border-blue-500/20 text-xs font-bold text-blue-400">
              MANUAL ENTRY
            </div>
          </h2>
          <p className="text-slate-400 mt-2">Add each subject, its credits, and the grade you achieved to build your model timeline.</p>
        </div>
        <div className="bg-slate-800 p-1 rounded-2xl flex items-center shadow-inner self-stretch md:self-auto">
          <div className="px-6 py-2 border-r border-slate-700">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Total Subjects</p>
            <p className="text-xl font-bold text-slate-200">{subjects.length}</p>
          </div>
          <div className="px-8 py-2">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Manual SGPA</p>
            <p className="text-2xl font-black text-blue-400">{calculateSGPA()}</p>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-3xl overflow-hidden mb-10 border border-white/5">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#1e293b]/80 border-b border-slate-700">
              <tr>
                <th className="px-8 py-5 font-semibold text-slate-300 text-sm uppercase tracking-widest">Subject Name</th>
                <th className="px-8 py-5 font-semibold text-slate-300 text-sm uppercase tracking-widest w-40">Grade</th>
                <th className="px-8 py-5 font-semibold text-slate-300 text-sm uppercase tracking-widest w-32">Credits</th>
                <th className="px-8 py-5 font-semibold text-slate-300 text-sm uppercase tracking-widest text-right w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {subjects.map((sub, idx) => (
                <tr key={idx} className="hover:bg-blue-500/5 transition-all duration-300 group">
                  <td className="px-8 py-5">
                    <input
                      type="text"
                      value={sub.subject}
                      onChange={(e) => handleEdit(idx, 'subject', e.target.value)}
                      placeholder="e.g. Data Structures"
                      className="bg-transparent border-b-2 border-transparent focus:border-blue-500/50 w-full outline-none font-medium text-slate-100 transition-all placeholder-slate-600"
                    />
                  </td>
                  <td className="px-8 py-5">
                    <select
                      value={sub.grade}
                      onChange={(e) => handleEdit(idx, 'grade', e.target.value)}
                      className="bg-slate-900 border border-slate-700/50 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500/50 w-full text-slate-200 transition-all"
                    >
                      {['O', 'A+', 'A', 'B+', 'B', 'C+', 'C', 'F'].map(g => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-8 py-5">
                    <input
                      type="number"
                      value={sub.credits}
                      onChange={(e) => handleEdit(idx, 'credits', parseFloat(e.target.value))}
                      className="bg-slate-900 border border-slate-700/50 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500/50 w-full text-slate-200 text-center transition-all"
                      step="0.5"
                    />
                  </td>
                  <td className="px-8 py-5 text-right">
                    <button
                      onClick={() => handleRemove(idx)}
                      className="p-3 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                      title="Delete Subject"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {subjects.length === 0 && (
          <div className="py-20 text-center text-slate-500 flex flex-col items-center">
            <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mb-4">
              <FileEdit className="w-8 h-8 text-slate-600" />
            </div>
            <p className="text-lg font-medium">No subjects found for Semester {sem}</p>
            <p className="text-sm text-slate-600 mt-1">Start by adding your first subject below.</p>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
        <button
          onClick={handleAddRow}
          className="w-full sm:w-auto px-8 py-4 bg-slate-800 hover:bg-slate-700 rounded-2xl font-bold transition-all flex items-center justify-center gap-3 text-white border border-slate-700 hover:border-blue-500/50 hover:shadow-[0_0_20px_rgba(59,130,246,0.15)] shadow-lg"
        >
          <div className="p-1 bg-blue-500/20 rounded-lg">
            <Plus className="w-4 h-4 text-blue-400" />
          </div>
          Add New Subject
        </button>

        <button
          onClick={handleProceed}
          disabled={subjects.length === 0}
          className="w-full sm:w-auto px-10 py-5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl font-black text-white transition-all flex items-center justify-center gap-3 shadow-[0_0_25px_rgba(37,99,235,0.4)] hover:-translate-y-1 active:scale-[0.98]"
        >
          {sem < targetSem - 1 ? (
            <>Save & Next Semester <ArrowRight className="w-5 h-5" /></>
          ) : (
            <>Complete Profile <CheckCircle className="w-5 h-5" /></>
          )
          }
        </button>
      </div>

      <div className="mt-12 p-6 bg-slate-800/30 border border-slate-800 rounded-3xl flex items-start gap-4">
        <div className="p-2 bg-yellow-500/10 rounded-lg">
          <AlertTriangle className="w-5 h-5 text-yellow-500" />
        </div>
        <div className="text-sm">
          <h4 className="font-bold text-slate-200 mb-1">Important Reminder</h4>
          <p className="text-slate-500 leading-relaxed">Ensure you have entered ALL subjects for Semester {sem} to maintain model accuracy. The SGPA is calculated dynamically based on the credits and grades entered above.</p>
        </div>
      </div>

    </div>
  );
}
