/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useCallback } from 'react';
import { Camera, RefreshCcw, ShieldCheck, Zap, Info, Scan, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { FaceAnalysis } from './types';
import { analyzeFace } from './services/geminiService';

export default function App() {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<FaceAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      setStream(s);
      if (videoRef.current) {
        videoRef.current.srcObject = s;
      }
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Camera access denied. Please enable camera permissions.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const capture = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvasRef.current.toDataURL('image/jpeg');
        setCapturedImage(dataUrl);
        stopCamera();
        handleAnalyze(dataUrl);
      }
    }
  };

  const handleAnalyze = async (image: string) => {
    setLoading(true);
    setError(null);
    try {
      const base64 = image.split(',')[1];
      const result = await analyzeFace(base64);
      setAnalysis(result);
    } catch (err) {
      console.error(err);
      setError("AI analysis failed. Please try a clearer photo.");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setCapturedImage(null);
    setAnalysis(null);
    setLoading(false);
    setError(null);
    startCamera();
  };

  return (
    <div className="min-h-screen p-6 md:p-12 flex flex-col items-center justify-center">
      {/* Header */}
      <header className="fixed top-0 w-full p-8 flex justify-between items-center z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 border-2 border-scan-green flex items-center justify-center">
            <Scan className="w-5 h-5 text-scan-green" />
          </div>
          <span className="terminal-text text-xl">FaceAudit 1.0</span>
        </div>
        <div className="hidden md:flex items-center gap-6">
          <div className="flex items-center gap-2 text-[10px] terminal-text opacity-50">
            <ShieldCheck className="w-3 h-3" /> Encrypted Analysis
          </div>
          <div className="flex items-center gap-2 text-[10px] terminal-text opacity-50">
            <Zap className="w-3 h-3" /> Real-time Processing
          </div>
        </div>
      </header>

      <main className="w-full max-w-4xl relative mt-12">
        <AnimatePresence mode="wait">
          {!capturedImage ? (
            <motion.div
              key="camera"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="flex flex-col items-center gap-8"
            >
              <div className="relative glass-card aspect-[4/3] w-full max-w-2xl group">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover scale-x-[-1]"
                />
                
                {stream && (
                  <>
                    <div className="scanner-overlay" />
                    <div className="scan-line" />
                    <div className="absolute top-4 left-4 terminal-text text-[10px] bg-black/50 px-2 py-1">
                      LIVE_FEED_01
                    </div>
                  </>
                )}

                {!stream && !error && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80">
                    <button
                      onClick={startCamera}
                      className="p-6 border border-scan-green/50 hover:bg-scan-green/10 transition-colors group"
                    >
                      <Camera className="w-12 h-12 text-scan-green group-hover:scale-110 transition-transform" />
                    </button>
                    <p className="mt-4 terminal-text text-xs">Initialize Optical Sensor</p>
                  </div>
                )}

                {error && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 p-8 text-center">
                    <AlertCircle className="w-12 h-12 text-scan-red mb-4" />
                    <p className="terminal-text text-scan-red text-sm">{error}</p>
                    <button onClick={startCamera} className="mt-6 terminal-text text-xs underline">Retry Connection</button>
                  </div>
                )}
              </div>

              {stream && (
                <button
                  onClick={capture}
                  className="px-12 py-4 border-2 border-scan-green terminal-text text-lg hover:bg-scan-green hover:text-black transition-all shadow-[0_0_20px_rgba(0,255,65,0.2)]"
                >
                  Execute Scan
                </button>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-8"
            >
              {/* Photo Preview */}
              <div className="space-y-6">
                <div className="glass-card aspect-[4/3] relative">
                  <img src={capturedImage} className="w-full h-full object-cover grayscale opacity-50" />
                  <div className="absolute inset-0 border border-scan-green/20" />
                  {loading && <div className="scan-line" />}
                  <div className="absolute top-4 left-4 terminal-text text-[10px] bg-black/50 px-2 py-1">
                    CAPTURED_DATA_01
                  </div>
                </div>
                
                {loading && (
                  <div className="glass-card p-6 border-scan-green/30">
                    <p className="terminal-text text-xs animate-pulse">Running architectural analysis...</p>
                    <div className="w-full h-1 bg-white/5 mt-3 overflow-hidden">
                      <motion.div 
                        initial={{ x: '-100%' }}
                        animate={{ x: '100%' }}
                        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                        className="w-1/2 h-full bg-scan-green"
                      />
                    </div>
                  </div>
                )}

                {error && (
                  <div className="glass-card p-6 border-scan-red/30">
                    <div className="flex items-center gap-3 text-scan-red mb-4">
                      <AlertCircle className="w-5 h-5" />
                      <p className="terminal-text text-xs">Analysis Failed</p>
                    </div>
                    <p className="text-sm text-white/70 mb-6">{error}</p>
                    <button 
                      onClick={reset}
                      className="w-full py-3 border border-scan-red/30 terminal-text text-[10px] text-scan-red hover:bg-scan-red/10 transition-colors"
                    >
                      Restart System
                    </button>
                  </div>
                )}

                {analysis && (
                  <div className="glass-card p-6 space-y-4">
                    <h3 className="terminal-text text-xs border-b border-white/10 pb-2">Honest Critique</h3>
                    <p className="text-sm text-white/70 leading-relaxed italic">
                      "{analysis.honestCritique}"
                    </p>
                    <div className="pt-4 border-t border-white/10">
                      <p className="terminal-text text-[10px] text-white/40">Prime Perspective</p>
                      <p className="text-sm text-scan-green mt-1">{analysis.bestAngle}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Data Breakdown */}
              <div className="space-y-6">
                <div className="glass-card p-8 flex flex-col items-center justify-center text-center relative">
                  <div className="text-[10px] terminal-text text-white/30 absolute top-4 left-4">Final Rating</div>
                  {analysis ? (
                    <>
                      <div className="text-8xl font-bold font-mono text-scan-green tracking-tighter tabular-nums drop-shadow-[0_0_15px_#00ff41]">
                        {analysis.rating}
                      </div>
                      <div className="text-xs terminal-text opacity-50 mt-2">Scale: [0.0 - 10.0]</div>
                    </>
                  ) : (
                    <div className="text-8xl font-bold font-mono text-white/5 tracking-tighter">0.0</div>
                  )}
                </div>

                {analysis && (
                  <div className="glass-card p-8 space-y-6">
                    <div className="space-y-4">
                      {(Object.entries(analysis.breakdown) as [string, number][]).map(([key, val]) => (
                        <div key={key} className="space-y-1">
                          <div className="flex justify-between text-[10px] terminal-text">
                            <span>{key.replace(/([A-Z])/g, ' $1')}</span>
                            <span>{val}/10</span>
                          </div>
                          <div className="h-1 bg-white/5 w-full">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${val * 10}%` }}
                              className="h-full bg-scan-green shadow-[0_0_5px_#00ff41]"
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="pt-6 border-t border-white/10">
                      <p className="terminal-text text-[10px] mb-4 text-white/40">Key Structural Elements</p>
                      <div className="flex flex-wrap gap-2">
                        {analysis.keyFeatures.map(feat => (
                          <span key={feat} className="text-[10px] bg-white/5 border border-white/10 px-3 py-1 rounded-sm terminal-text">
                            {feat}
                          </span>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={reset}
                      className="w-full py-4 border border-white/10 terminal-text text-xs hover:bg-white/5 transition-colors flex items-center justify-center gap-2"
                    >
                      <RefreshCcw className="w-3 h-3" /> System Reset
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Hidden canvas for capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Background Ambience */}
      <div className="fixed bottom-8 left-8 flex items-center gap-4 pointer-events-none opacity-20">
        <Info className="w-4 h-4 text-scan-green" />
        <p className="text-[10px] terminal-text max-w-[200px]">
          Warning: Analysis is purely objective based on geometric patterns. Results may be brutal.
        </p>
      </div>
      
      <div className="fixed bottom-8 right-8 text-[10px] terminal-text opacity-10">
        LAT: 37.7749 | LONG: -122.4194 | STATUS: NOMINAL
      </div>
    </div>
  );
}
