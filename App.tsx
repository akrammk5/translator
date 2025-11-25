import React from 'react';
import { useGeminiLive } from './hooks/useGeminiLive';
import { ConnectionState } from './types';
import { Waveform } from './components/Waveform';
import { Transcript } from './components/Transcript';

const App: React.FC = () => {
  const { 
    connect, 
    disconnect, 
    startRecording, 
    stopRecording, 
    connectionState, 
    transcripts,
    volumeUser,
    volumeModel,
    error
  } = useGeminiLive();

  const isConnected = connectionState === ConnectionState.CONNECTED;
  const isConnecting = connectionState === ConnectionState.CONNECTING;

  // Visual state calculation
  const isUserSpeaking = volumeUser > 0.01;
  const isModelSpeaking = volumeModel > 0.01;

  return (
    <div className="relative w-full h-screen bg-black text-white flex flex-col overflow-hidden font-sans select-none touch-none">
      
      {/* Background Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-900/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-amber-900/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-20 p-6 flex justify-between items-center bg-gradient-to-b from-black/50 to-transparent pointer-events-none">
        <div className="flex items-center gap-3 pointer-events-auto">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-white">
              <path d="M8.25 4.5a3.75 3.75 0 117.5 0v8.25a3.75 3.75 0 11-7.5 0V4.5z" />
              <path d="M6 10.5a.75.75 0 01.75.75v1.5a5.25 5.25 0 1010.5 0v-1.5a.75.75 0 011.5 0v1.5a6.751 6.751 0 01-6 6.709v2.291h3a.75.75 0 010 1.5h-7.5a.75.75 0 010-1.5h3v-2.291a6.751 6.751 0 01-6-6.709v-1.5A.75.75 0 016 10.5z" />
            </svg>
          </div>
          <h1 className="font-display font-bold text-xl tracking-tight text-slate-100">Synapse</h1>
        </div>
        
        {/* Connection Status Indicator */}
        <div className="flex items-center gap-2 bg-slate-900/50 backdrop-blur-sm px-3 py-1.5 rounded-full border border-slate-800 pointer-events-auto">
           <div className={`w-2 h-2 rounded-full transition-colors duration-300 ${isConnected ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : isConnecting ? 'bg-yellow-500 animate-pulse' : 'bg-red-500'}`}></div>
           <span className="text-xs font-medium text-slate-300 tracking-wide">
             {connectionState === ConnectionState.CONNECTED ? 'LIVE' : connectionState}
           </span>
        </div>
      </header>

      {/* Main Center Area */}
      <main className="flex-1 relative flex flex-col items-center justify-center z-10">
        
        {/* Waveform Background Layer */}
        <div className="absolute inset-0 z-0 flex items-center justify-center opacity-40 pointer-events-none">
             <div className="w-full h-full max-w-4xl max-h-[500px] relative">
                  {/* User Wave (Blue) */}
                  <div className={`absolute inset-0 transition-opacity duration-300 ${isUserSpeaking ? 'opacity-100' : 'opacity-20'}`}>
                      <Waveform active={true} color="#3b82f6" amplitude={volumeUser} />
                  </div>
                  {/* Model Wave (Amber) */}
                   <div className={`absolute inset-0 transition-opacity duration-300 ${isModelSpeaking ? 'opacity-100' : 'opacity-0'}`}>
                      <Waveform active={true} color="#f59e0b" amplitude={volumeModel} />
                  </div>
             </div>
        </div>

        {/* The Magic Button */}
        <div className="relative z-20 flex flex-col items-center gap-6">
          
          {error && (
            <div className="text-red-400 text-sm bg-red-950/80 px-4 py-2 rounded-lg border border-red-900/50 animate-pulse absolute -top-16">
                {error}
            </div>
          )}

          {!isConnected ? (
             <button
              onClick={connect}
              disabled={isConnecting}
              className={`group relative flex items-center justify-center gap-3 px-10 py-5 rounded-full bg-slate-100 text-slate-950 font-bold font-display text-lg tracking-wide transition-all duration-300 hover:scale-105 hover:shadow-[0_0_50px_rgba(255,255,255,0.3)] disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isConnecting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
                    <span>Initializing...</span>
                  </>
              ) : (
                  <>
                    <span>Initialize Neural Link</span>
                  </>
              )}
            </button>
          ) : (
            <button
                onPointerDown={(e) => {
                  e.currentTarget.setPointerCapture(e.pointerId);
                  startRecording();
                }}
                onPointerUp={(e) => {
                   e.currentTarget.releasePointerCapture(e.pointerId);
                   stopRecording();
                }}
                onPointerLeave={stopRecording}
                onContextMenu={(e) => e.preventDefault()}
                className="relative group touch-none cursor-pointer outline-none tap-highlight-transparent select-none"
                aria-label="Hold to speak"
                style={{ WebkitTapHighlightColor: 'transparent' }}
            >
                {/* Outer Glow */}
                <div className="absolute inset-0 bg-blue-500 rounded-full blur-2xl opacity-20 group-hover:opacity-40 group-active:opacity-60 transition-opacity duration-300 animate-pulse"></div>
                
                {/* Main Button Body */}
                <div className="relative w-32 h-32 rounded-full bg-gradient-to-b from-slate-800 to-slate-950 border border-slate-700 flex items-center justify-center shadow-2xl transition-transform duration-100 active:scale-95 group-active:border-blue-500/50">
                    {/* Inner Dynamic Core */}
                    <div className={`w-16 h-16 rounded-full transition-all duration-200 flex items-center justify-center
                        ${isUserSpeaking ? 'bg-blue-500 shadow-[0_0_20px_#3b82f6] scale-110' : 'bg-slate-700'}`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-white transition-opacity">
                            <path d="M8.25 4.5a3.75 3.75 0 117.5 0v8.25a3.75 3.75 0 11-7.5 0V4.5z" />
                            <path d="M6 10.5a.75.75 0 01.75.75v1.5a5.25 5.25 0 1010.5 0v-1.5a.75.75 0 011.5 0v1.5a6.751 6.751 0 01-6 6.709v2.291h3a.75.75 0 010 1.5h-7.5a.75.75 0 010-1.5h3v-2.291a6.751 6.751 0 01-6-6.709v-1.5A.75.75 0 016 10.5z" />
                        </svg>
                    </div>
                </div>
                
                {/* Label */}
                <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap">
                   <p className="text-xs font-medium text-slate-500 uppercase tracking-[0.2em] group-active:text-blue-400 transition-colors pointer-events-none">Hold to Speak</p>
                </div>
            </button>
          )}
        </div>

      </main>

      {/* Footer / Transcript Area */}
      <footer className="relative z-20 w-full h-1/3 min-h-[200px] bg-gradient-to-t from-black via-black/90 to-transparent">
         <div className="w-full h-full max-w-2xl mx-auto px-4 pb-6 flex flex-col justify-end">
            <Transcript items={transcripts} />
            
            {isConnected && (
                <div className="flex justify-center mt-4">
                  <button 
                    onClick={disconnect}
                    className="text-[10px] text-red-500/50 hover:text-red-400 uppercase tracking-widest transition-colors"
                  >
                    Terminate Link
                  </button>
                </div>
            )}
         </div>
      </footer>

    </div>
  );
};

export default App;