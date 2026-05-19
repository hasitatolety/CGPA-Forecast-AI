import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BrainCircuit, Upload, LineChart, ShieldAlert } from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center py-20 animate-in fade-in duration-700">
      <div className="relative mb-10 group">
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full blur opacity-50 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
        <div className="relative flex items-center justify-center bg-slate-900 rounded-full p-6">
          <BrainCircuit className="w-20 h-20 text-blue-400" />
        </div>
      </div>
      
      <h1 className="text-5xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 mb-6 text-center">
        Predict Your Future Grades
      </h1>
      
      <p className="text-xl text-slate-400 max-w-2xl text-center mb-12">
        Leverage Deep Learning (RNN/LSTM) to analyze your past academic performance, forecast future semester outcomes, and identify risk subjects.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl mb-16">
        <FeatureCard 
          icon={<LineChart className="w-8 h-8 text-blue-400" />}
          title="Academic Timeline"
          description="Build your history semester by semester with our intuitive manual grade entry system."
        />
        <FeatureCard 
          icon={<LineChart className="w-8 h-8 text-purple-400" />}
          title="Sequential Learning"
          description="Our PyTorch model learns hidden relationships between prerequisite subjects and subsequent performance."
        />
        <FeatureCard 
          icon={<ShieldAlert className="w-8 h-8 text-rose-400" />}
          title="Risk Forecast"
          description="Identify subjects you're likely to struggle with early so you can focus your study efforts effectively."
        />
      </div>

      <button 
        onClick={() => navigate('/setup')}
        className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-bold text-lg transition-transform transform hover:scale-105 shadow-[0_0_20px_rgba(37,99,235,0.6)] flex items-center gap-3"
      >
        <span>Get Started</span>
        <BrainCircuit className="w-5 h-5" />
      </button>
    </div>
  );
}

function FeatureCard({ icon, title, description }) {
  return (
    <div className="glass-card p-8 rounded-2xl flex flex-col items-center text-center transition-all hover:-translate-y-2 hover:shadow-[0_10px_40px_rgba(59,130,246,0.15)]">
      <div className="p-4 bg-slate-800 rounded-full mb-6 relative">
        <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-md"></div>
        <div className="relative">{icon}</div>
      </div>
      <h3 className="text-xl font-bold mb-3 text-slate-100">{title}</h3>
      <p className="text-slate-400 leading-relaxed text-sm">{description}</p>
    </div>
  );
}
