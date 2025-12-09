import React, { useState, useRef, useEffect } from 'react';
import { X, Camera, Loader2, AlertTriangle, RefreshCcw, Aperture } from 'lucide-react';
import { analyzeFloodImage } from '../services/geminiService';
import { AnalysisResult } from '../types';

interface AnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAnalysisComplete: (result: AnalysisResult, imageSrc: string) => void;
}

const AnalysisModal: React.FC<AnalysisModalProps> = ({ isOpen, onClose, onAnalysisComplete }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // START CAMERA WHEN MODAL OPENS
  useEffect(() => {
    if (isOpen && !isScanning) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen, isScanning]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      // Request rear camera (environment)
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 }
        } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera Access Error:", err);
      setCameraError("Camera permission denied or not available.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const handleCapture = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get Data URL (Base64)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    
    // Stop camera immediately after capture to freeze the moment (optional, or keep running)
    stopCamera();
    setIsScanning(true);

    try {
      // Extract clean base64 string for Gemini
      const base64Data = dataUrl.split(',')[1];
      const result = await analyzeFloodImage(base64Data, 'image/jpeg');

      // Simulate AI thinking time visually
      setTimeout(() => {
        setIsScanning(false);
        onAnalysisComplete(result, dataUrl); // Pass the captured image dataUrl
      }, 1000);

    } catch (error) {
      console.error(error);
      setIsScanning(false);
      setCameraError("Analysis failed. Please try capturing again.");
      startCamera(); // Restart camera on error
    }
  };

  const handleClose = () => {
      stopCamera();
      onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden relative flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-slate-800 bg-slate-800/50 shrink-0">
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Camera className="w-5 h-5 text-rose-500" />
            Live Report
          </h2>
          <button onClick={handleClose} className="p-1 hover:bg-slate-700 rounded-full transition-colors text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 relative bg-black flex flex-col items-center justify-center overflow-hidden">
          
          {isScanning ? (
            /* SCANNING ANIMATION STATE */
            <div className="flex flex-col items-center gap-6 w-full p-6">
               <div className="relative w-full aspect-video rounded-lg overflow-hidden border-2 border-blue-500/50 shadow-[0_0_30px_rgba(59,130,246,0.2)] bg-slate-800">
                  {/* We display the canvas content here if needed, or just the animation */}
                  <div className="absolute top-0 left-0 w-full h-1 bg-blue-400 shadow-[0_0_15px_rgba(96,165,250,1)] animate-[scan_2s_ease-in-out_infinite] z-10"></div>
                  <div className="absolute inset-0 flex items-center justify-center z-20">
                    <Loader2 className="w-12 h-12 text-blue-400 animate-spin" />
                  </div>
                  <div className="absolute inset-0 bg-slate-900/50 flex flex-col items-center justify-center">
                       <p className="text-slate-300 font-mono text-xs mt-16 animate-pulse">Processing Image Data...</p>
                  </div>
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-xl font-semibold text-blue-400 animate-pulse">Verifying & Analyzing...</h3>
                <p className="text-slate-400 text-sm">Ensuring authenticity and detecting flood levels.</p>
              </div>
            </div>
          ) : (
            /* LIVE CAMERA STATE */
            <>
                {cameraError ? (
                    <div className="flex flex-col items-center justify-center p-6 text-center">
                        <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
                        <p className="text-slate-200 font-bold mb-2">Camera Unavailable</p>
                        <p className="text-slate-400 text-sm mb-4">{cameraError}</p>
                        <button onClick={startCamera} className="bg-blue-600 px-4 py-2 rounded text-white text-sm font-bold flex items-center gap-2">
                            <RefreshCcw className="w-4 h-4" /> Retry
                        </button>
                    </div>
                ) : (
                    <div className="relative w-full h-full flex flex-col">
                        {/* Video Element */}
                        <video 
                            ref={videoRef} 
                            autoPlay 
                            playsInline 
                            muted
                            className="w-full h-full object-cover"
                        />
                        <canvas ref={canvasRef} className="hidden" />

                        {/* Camera Overlays */}
                        <div className="absolute inset-0 pointer-events-none">
                            {/* Grid Lines for composition */}
                            <div className="w-full h-full border-[20px] border-black/30"></div>
                            <div className="absolute top-1/3 left-0 right-0 h-px bg-white/20"></div>
                            <div className="absolute top-2/3 left-0 right-0 h-px bg-white/20"></div>
                            <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/20"></div>
                            <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white/20"></div>
                            
                            {/* Live Badge */}
                            <div className="absolute top-4 left-4 bg-red-600/80 backdrop-blur text-white text-[10px] font-bold px-2 py-0.5 rounded animate-pulse flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-white rounded-full"></span> LIVE
                            </div>
                        </div>

                        {/* Controls */}
                        <div className="absolute bottom-0 left-0 right-0 p-6 flex justify-center items-center bg-gradient-to-t from-black/80 to-transparent">
                            <button 
                                onClick={handleCapture}
                                className="group relative flex items-center justify-center"
                            >
                                <div className="w-20 h-20 rounded-full border-4 border-white/50 group-hover:border-white transition-colors"></div>
                                <div className="absolute w-16 h-16 bg-white rounded-full group-active:scale-90 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.5)]"></div>
                                <Camera className="absolute w-8 h-8 text-slate-900 pointer-events-none" />
                            </button>
                        </div>
                    </div>
                )}
            </>
          )}
        </div>
        
        {!isScanning && !cameraError && (
             <div className="p-3 bg-slate-900 border-t border-slate-800 text-center">
                <p className="text-[10px] text-slate-500 flex items-center justify-center gap-1">
                    <Aperture className="w-3 h-3" />
                    Authenticity Mode: Gallery upload disabled.
                </p>
             </div>
        )}
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
};

export default AnalysisModal;