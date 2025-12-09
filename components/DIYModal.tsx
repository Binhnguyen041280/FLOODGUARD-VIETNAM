import React, { useState, useRef, useEffect } from 'react';
import { X, Camera, Loader2, Wrench, AlertTriangle, CheckCircle2, ChevronRight } from 'lucide-react';
import { generateDIYGuide } from '../services/geminiService';
import { DIYGuide } from '../types';

interface DIYModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DIYModal: React.FC<DIYModalProps> = ({ isOpen, onClose }) => {
  const [step, setStep] = useState<'camera' | 'analyzing' | 'result'>('camera');
  const [result, setResult] = useState<DIYGuide | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (isOpen && step === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen, step]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      console.error("Camera error", err);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  };

  const handleCapture = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
    
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    setCapturedImage(dataUrl);
    setStep('analyzing');
    stopCamera();

    try {
      const base64 = dataUrl.split(',')[1];
      const guide = await generateDIYGuide(base64, 'image/jpeg');
      setResult(guide);
      setStep('result');
    } catch (e) {
      setStep('camera'); // Retry on fail
    }
  };

  const handleReset = () => {
    setResult(null);
    setCapturedImage(null);
    setStep('camera');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1100] bg-black/95 flex flex-col">
      {/* Header */}
      <div className="h-14 bg-slate-900 border-b border-orange-500/30 flex items-center justify-between px-4">
        <div className="flex items-center gap-2 text-orange-400 font-bold">
          <Wrench className="w-5 h-5" /> AI Rescue Builder
        </div>
        <button onClick={onClose}><X className="w-6 h-6 text-slate-400" /></button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-hidden relative flex flex-col">
        {step === 'camera' && (
          <div className="flex-1 relative bg-black">
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
            <canvas ref={canvasRef} className="hidden" />
            <div className="absolute bottom-10 left-0 right-0 flex justify-center">
              <button onClick={handleCapture} className="w-20 h-20 bg-white rounded-full border-4 border-slate-300 shadow-xl flex items-center justify-center">
                <Camera className="w-8 h-8 text-slate-900" />
              </button>
            </div>
            <div className="absolute top-4 left-4 right-4 bg-black/50 p-3 rounded text-center text-sm text-white">
              Chụp ảnh các vật dụng bạn có: Chai nhựa, can, xốp, dây...
            </div>
          </div>
        )}

        {step === 'analyzing' && (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
            <Loader2 className="w-16 h-16 text-orange-500 animate-spin" />
            <h3 className="text-xl font-bold text-white">AI is Thinking...</h3>
            <p className="text-slate-400">Analyzing materials and generating a blueprint.</p>
          </div>
        )}

        {step === 'result' && result && (
          <div className="flex-1 overflow-y-auto bg-slate-900 p-4 pb-20">
            {capturedImage && (
              <img src={capturedImage} alt="Materials" className="w-full h-48 object-cover rounded-lg mb-4 border border-slate-700" />
            )}
            
            <h2 className="text-2xl font-black text-white mb-2">{result.title}</h2>
            
            <div className="flex flex-wrap gap-2 mb-6">
              {result.materialsDetected.map((m, i) => (
                <span key={i} className="px-2 py-1 bg-slate-800 border border-slate-600 rounded text-xs text-slate-300">
                  {m}
                </span>
              ))}
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold text-orange-400 uppercase">Hướng dẫn thực hiện</h3>
              {result.steps.map((s, i) => (
                <div key={i} className="flex gap-3 bg-slate-800/50 p-3 rounded-lg">
                  <span className="flex-shrink-0 w-6 h-6 bg-orange-600 rounded-full flex items-center justify-center text-xs font-bold text-white">
                    {i + 1}
                  </span>
                  <p className="text-sm text-slate-200">{s}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-red-900/20 border border-red-500/50 rounded-lg flex gap-3">
              <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0" />
              <p className="text-xs text-red-200 font-bold">{result.safetyNote}</p>
            </div>
            
            <button onClick={handleReset} className="w-full mt-6 py-3 bg-slate-800 text-white rounded-lg font-bold border border-slate-600">
              Chụp vật dụng khác
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DIYModal;
