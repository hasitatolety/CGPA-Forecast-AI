import React, { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { UploadCloud, File, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

export default function GradeUpload() {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const sem = parseInt(queryParams.get('sem')) || 1;

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      if (selected.type.startsWith('image/') || selected.type === 'application/pdf') {
        setFile(selected);
        setError('');
      } else {
        setFile(null);
        setError('Please upload an image or PDF file.');
      }
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      if (droppedFile.type.startsWith('image/') || droppedFile.type === 'application/pdf') {
        setFile(droppedFile);
        setError('');
      } else {
        setFile(null);
        setError('Please drop an image or PDF file.');
      }
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first.');
      return;
    }

    setIsUploading(true);
    setError('');

    try {
      // In a real app we'd send to our backend OCR endpoint
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('http://localhost:8000/api/ocr', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('OCR process failed');
      }

      const extractedSubjects = await response.json();
      
      // Artificial delay to show off the scanning animation
      setTimeout(() => {
        setIsUploading(false);
        navigate('/review', { state: { subjects: extractedSubjects, semester: sem } });
      }, 3000);
      
    } catch (err) {
      console.warn("Backend failed, using mock delay", err);
      setTimeout(() => {
        setIsUploading(false);
        const emptySubjects = [];
        navigate('/review', { state: { subjects: emptySubjects, semester: sem } });
      }, 3000);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-12 animate-in slide-in-from-bottom flex flex-col duration-500">
      <div className="text-center mb-10">
        <h2 className="text-4xl font-bold mb-4 text-white">Upload Semester {sem} Grade Card</h2>
        <p className="text-slate-400">Upload your grade card image or PDF for intelligent OCR extraction.</p>
      </div>

      <div 
        className={`glass-card rounded-3xl p-12 border-2 border-dashed transition-all ${
          file ? 'border-blue-500 bg-blue-500/5' : 'border-slate-600 hover:border-blue-400'
        } flex flex-col items-center justify-center cursor-pointer`}
        onClick={() => !file && fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*, .pdf"
          onChange={handleFileChange}
        />
        
        {file ? (
          <div className="flex flex-col items-center w-full">
            <CheckCircle2 className="w-16 h-16 text-green-400 mb-4" />
            <h3 className="text-xl font-semibold mb-2">{file.name}</h3>
            <p className="text-slate-400 mb-8">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            
            <div className="flex gap-4">
              <button 
                onClick={(e) => { e.stopPropagation(); setFile(null); }}
                className="px-6 py-2 rounded-full bg-slate-800 hover:bg-slate-700 transition"
              >
                Change File
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); handleUpload(); }}
                disabled={isUploading}
                className="px-8 py-2 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-semibold transition shadow-[0_0_15px_rgba(37,99,235,0.4)] flex items-center gap-2 disabled:opacity-50"
              >
                {isUploading ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</>
                ) : (
                  <><UploadCloud className="w-5 h-5" /> Analyze Now</>
                )}
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="p-6 bg-slate-800 rounded-full mb-6">
              <UploadCloud className="w-12 h-12 text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Click or Drag to Upload</h3>
            <p className="text-slate-400">Supports JPG, PNG, and PDF up to 10MB</p>
          </>
        )}
      </div>

      {error && (
        <div className="mt-6 p-4 bg-rose-500/10 border border-rose-500/50 rounded-xl flex items-center gap-3 text-rose-400">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {isUploading && <ScanningOverlay />}
    </div>
  );
}

function ScanningOverlay() {
  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in duration-300">
      <div className="relative w-64 h-80 border-2 border-blue-500/30 rounded-xl overflow-hidden glass-card">
        {/* Scanning line animation */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="w-full h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent shadow-[0_0_15px_rgba(59,130,246,0.8)] animate-[scan_2s_ease-in-out_infinite]"></div>
        </div>
        
        {/* Mock text appearing animation */}
        <div className="p-6 space-y-4 pt-10">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className={`h-2 bg-slate-700 rounded-full w-${[48,56,40,64,32,48][i-1]} animate-pulse`} style={{ animationDelay: `${i * 200}ms` }}></div>
          ))}
        </div>
      </div>
      
      <div className="mt-10 text-center">
        <h3 className="text-2xl font-bold gradient-text mb-2">AI Extraction in Progress</h3>
        <p className="text-slate-400 flex items-center gap-2 justify-center">
          <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
          Neural Engine analyzing academic patterns...
        </p>
      </div>

      <style>{`
        @keyframes scan {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>
    </div>
  );
}
