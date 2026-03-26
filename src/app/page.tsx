"use client";

import { useState, useEffect } from "react";

type AkinaiState = { response: string; story_snippet?: string; confidence_level: number; current_guess_visual?: string; is_final_guess: boolean };
type Emotion = "Excited" | "Neutral" | "Confused";

const TypewriterText = ({ text }: { text: string }) => {
  const [displayedText, setDisplayedText] = useState("");
  useEffect(() => {
    let i = 0;
    setDisplayedText("");
    const interval = setInterval(() => {
      setDisplayedText(text.slice(0, i + 1));
      i++;
      if (i >= text.length) clearInterval(interval);
    }, 20);
    return () => clearInterval(interval);
  }, [text]);
  return <span>{displayedText}<span className="animate-blink opacity-70 ml-1">_</span></span>;
};

export default function App() {
  const [history, setHistory] = useState<{role: string, parts: any[]}[]>([]);
  const [storyLog, setStoryLog] = useState<string[]>([]);
  const [akinaiState, setAkinaiState] = useState<AkinaiState | null>(null);
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const [input, setInput] = useState("");
  const [emotion, setEmotion] = useState<Emotion>("Neutral");

  const sendResponse = async (text: string, isFirst = false) => {
    if (!text.trim() && !isFirst) return;
    if (loading) return;

    setLoading(true);
    setInput("");

    try {
      const res = await fetch("/api/akinai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ history, message: text, userEmotion: emotion })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      let raw = data.result || "{}";
      raw = raw.replace(/```json/g, "").replace(/```/g, "").trim();
      const st = JSON.parse(raw) as AkinaiState;
      setAkinaiState(st);
      
      if (st.story_snippet) {
        setStoryLog(prev => [...prev, st.story_snippet!]);
      }

      const newHistory = isFirst ? [] : [...history, { role: "user", parts: [{ text }] }, { role: "model", parts: [{ text: JSON.stringify(st) }] }];
      setHistory(newHistory);
    } catch (e: any) {
      alert("Connection Failed: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStart = () => {
    setStarted(true);
    sendResponse("", true);
  };

  const visualPrompt = akinaiState?.current_guess_visual || "A glowing neon cybernetic holographic core, highly detailed, futuristic UI magic, dark background";
  const charUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(visualPrompt)}?width=512&height=512&seed=45&nologo=true`;

  const emotionColors: Record<Emotion, string> = {
    Excited: "rgba(168, 85, 247, 0.8)", // purple
    Neutral: "rgba(6, 182, 212, 0.8)", // cyan
    Confused: "rgba(59, 130, 246, 0.8)" // blue
  };

  const themeBorderClass = emotion === "Excited" ? "border-purple-500/60" : emotion === "Confused" ? "border-blue-500/60" : "border-cyan-500/60";
  const themeTextClass = emotion === "Excited" ? "text-purple-400" : emotion === "Confused" ? "text-blue-400" : "text-cyan-400";
  const themeBgClass = emotion === "Excited" ? "bg-purple-900/30" : emotion === "Confused" ? "bg-blue-900/30" : "bg-cyan-900/30";
  
  return (
    <main className="w-full h-screen bg-[#030008] text-cyan-50 font-sans overflow-hidden flex animate-fade-in select-none relative">
      
      {/* Background Tech Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none z-0"></div>
      
      {/* Scanline overlay */}
      <div className="absolute inset-0 pointer-events-none animate-scanline mix-blend-screen opacity-30 z-50"></div>
      
      {/* Corner Crosshairs */}
      <div className="absolute top-4 left-4 w-12 h-12 border-t-2 border-l-2 border-cyan-500/40 z-0"></div>
      <div className="absolute top-4 right-4 w-12 h-12 border-t-2 border-r-2 border-cyan-500/40 z-0"></div>
      <div className="absolute bottom-4 left-4 w-12 h-12 border-b-2 border-l-2 border-cyan-500/40 z-0"></div>
      <div className="absolute bottom-4 right-4 w-12 h-12 border-b-2 border-r-2 border-cyan-500/40 z-0"></div>

      {!started ? (
        <div className="flex-1 flex flex-col justify-center items-center z-10 px-8 relative">
           <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.1)_0%,transparent_60%)]"></div>
           <h1 className="text-7xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-b from-cyan-300 to-blue-900 tracking-[0.2em] drop-shadow-[0_0_30px_rgba(6,182,212,0.6)] z-10">AKINAI</h1>
           <p className="text-cyan-400/80 mt-6 tracking-[0.3em] font-mono text-xs uppercase text-center max-w-lg border-y border-cyan-900/50 py-2">System initialized. Awaiting neural link.</p>
           <button onClick={handleStart} className="mt-16 px-12 py-4 border border-cyan-400 bg-cyan-900/20 rounded hover:bg-cyan-800/50 hover:scale-105 transition-all uppercase tracking-[0.2em] font-bold text-cyan-100 z-10 shadow-[0_0_20px_rgba(6,182,212,0.4)] relative hover:shadow-[0_0_40px_rgba(6,182,212,0.8)] hud-border">
             [ Engage Interface ]
           </button>
        </div>
      ) : (
        <div className="flex-1 flex w-full h-full p-4 md:p-8 gap-8 z-10">
          
          {/* Left Panel: Emotion & Story */}
          <div className="w-[300px] hidden md:flex flex-col gap-6">
            <div className={`glass-panel p-6 hud-border transition-colors duration-500 w-full`}>
              <h3 className={`text-[10px] uppercase tracking-[0.2em] font-mono mb-4 text-cyan-500 flex justify-between`}>
                <span>Biometric Sync</span>
                <span className="animate-pulse">● REC</span>
              </h3>
              <div className="flex flex-col gap-3">
                {(["Excited", "Neutral", "Confused"] as Emotion[]).map(emo => (
                  <button 
                    key={emo} 
                    onClick={() => setEmotion(emo)}
                    className={`text-left px-4 py-3 rounded-none text-xs tracking-widest uppercase transition-all border ${emotion === emo ? `${themeBgClass} ${themeBorderClass} scale-105 shadow-[0_0_15px_${emotionColors[emo]}] text-white` : "border-cyan-900/50 text-cyan-600 hover:text-cyan-300 hover:border-cyan-500/50"}`}
                  >
                    <span className="opacity-50 mr-2">{emo === "Excited" ? "01" : emo === "Confused" ? "03" : "02"}</span> {emo}
                  </button>
                ))}
              </div>
            </div>

            <div className={`glass-panel p-6 flex-1 flex flex-col overflow-hidden hud-border transition-colors duration-500`}>
              <h3 className={`text-[10px] uppercase tracking-[0.2em] font-mono mb-4 text-cyan-500 border-b border-cyan-900/50 pb-2`}>System Logs</h3>
              <div className="flex-1 overflow-y-auto pr-2 space-y-4 text-xs font-mono text-cyan-200/60 leading-relaxed flex flex-col-reverse custom-scrollbar">
                {[...storyLog].reverse().map((log, i) => (
                  <div key={i} className={i === 0 ? "text-cyan-100 drop-shadow-[0_0_5px_rgba(6,182,212,0.8)] border-l-2 border-cyan-400 pl-3 py-1" : "opacity-50 border-l border-cyan-900 pl-3 py-1"}>
                    <span className="text-[9px] text-cyan-600 block mb-1">[{new Date().toLocaleTimeString()}]</span>
                    {i === 0 ? <TypewriterText text={log} /> : log}
                  </div>
                ))}
                {storyLog.length === 0 && <p className="opacity-40 italic animate-pulse">Awaiting neural input...</p>}
              </div>
            </div>
          </div>

          {/* Main Context */}
          <div className="flex-1 flex flex-col items-center justify-between relative max-w-4xl mx-auto h-full w-full">
             
             {/* Progress / Confidence */}
             <div className="w-full flex flex-col items-center mt-4">
               <div className="flex justify-between w-full max-w-2xl text-[10px] uppercase tracking-[0.2em] text-cyan-500 mb-2 font-mono">
                 <span>Target Lock</span>
                 <span className={`${akinaiState?.confidence_level && akinaiState.confidence_level > 80 ? 'text-purple-400 animate-pulse' : ''}`}>{akinaiState?.confidence_level || 0}%</span>
               </div>
               
               {/* Segmented HUD bar */}
               <div className="w-full max-w-2xl h-3 rounded-sm flex gap-1 p-0.5 border border-cyan-900/50 bg-black/50">
                  {Array.from({ length: 40 }).map((_, i) => (
                    <div 
                      key={i} 
                      className={`flex-1 h-full rounded-sm transition-all duration-300 ${
                        (akinaiState?.confidence_level || 0) > (i * 2.5) 
                        ? 'bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]' 
                        : 'bg-cyan-900/20'
                      }`} 
                    />
                  ))}
               </div>
             </div>

             {/* Dynamic Holographic Avatar */}
             <div className="flex-1 flex justify-center items-center relative w-full my-6 min-h-[300px]">
               {/* Outer Rotating HUD Rings */}
               <div className="absolute w-[320px] h-[320px] md:w-[480px] md:h-[480px] border-[1px] border-dashed border-cyan-500/30 rounded-full animate-spin-slow pointer-events-none" />
               <div className="absolute w-[300px] h-[300px] md:w-[450px] md:h-[450px] border-[2px] border-dotted border-purple-500/20 rounded-full animate-spin-reverse-slow pointer-events-none" />
               <div className="absolute w-[280px] h-[280px] md:w-[420px] md:h-[420px] border border-cyan-400/10 rounded-full pointer-events-none" />
               
               <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.1)_0%,transparent_40%)] pointer-events-none" />
               
               <div className="w-[240px] h-[240px] md:w-[380px] md:h-[380px] rounded-full overflow-hidden border-2 border-cyan-400/40 glass-panel animate-orbit-glow p-2 flex justify-center items-center z-10 shadow-[0_0_60px_rgba(6,182,212,0.3)]">
                 <img 
                   src={charUrl} 
                   alt="Holographic Projection" 
                   className={`w-full h-full object-cover rounded-full mix-blend-screen animate-hologram filter transition-all duration-1000 ${loading ? 'opacity-30 blur-md scale-95' : 'opacity-90 scale-100'}`}
                 />
               </div>

               {loading && (
                 <div className="absolute inset-0 flex flex-col justify-center items-center z-20">
                   <div className="w-40 h-40 border-y-2 border-cyan-400 rounded-full animate-spin shadow-[0_0_15px_rgba(6,182,212,0.8)]" />
                   <div className="absolute mt-2 text-[10px] font-mono tracking-widest text-cyan-300 animate-pulse bg-black/60 px-2 py-1">PROCESSING...</div>
                 </div>
               )}
               {/* Decorative Crosshairs around avatar */}
               <div className="absolute top-1/2 left-4 md:left-20 w-8 h-[1px] bg-cyan-500/50"></div>
               <div className="absolute top-1/2 right-4 md:right-20 w-8 h-[1px] bg-cyan-500/50"></div>
               <div className="absolute top-4 md:top-10 left-1/2 w-[1px] h-8 bg-cyan-500/50"></div>
               <div className="absolute bottom-4 md:bottom-10 left-1/2 w-[1px] h-8 bg-cyan-500/50"></div>
             </div>

             {/* Question & Interaction Card */}
             <div className={`w-full max-w-2xl glass-panel relative overflow-hidden mb-6 hud-border p-1`}>
                <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-80`} />
                
                <div className="p-6 md:p-8 flex flex-col">
                  <h2 className="text-lg md:text-xl font-light text-cyan-50 font-mono tracking-wide leading-relaxed min-h-[70px] drop-shadow-[0_0_10px_rgba(6,182,212,0.5)]">
                    {loading ? (
                      <span className="text-cyan-500/60 animate-pulse">Initializing quantum query...</span>
                    ) : akinaiState ? (
                      <TypewriterText text={`> ${akinaiState.response}`} />
                    ) : "> Link established. Awaiting parameters..."}
                  </h2>

                  {!loading && akinaiState && !akinaiState.is_final_guess && (
                    <div className="flex flex-col gap-5 w-full mt-4">
                      {/* Quick Buttons */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
                        {["Yes", "No", "Maybe", "Don't Know"].map(ans => (
                          <button key={ans} onClick={() => sendResponse(ans)} className={`py-3 bg-black/40 border border-cyan-800/60 hover:${themeBorderClass} hover:bg-cyan-900/40 transition-all text-xs font-mono uppercase tracking-[0.2em] text-cyan-300 hover:text-white hover:shadow-[0_0_15px_rgba(6,182,212,0.5)] clip-edges`}>
                            {ans}
                          </button>
                        ))}
                      </div>
                      
                      {/* Elaborate Input */}
                      <div className="flex gap-3 relative">
                         <div className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-600 font-mono text-xs">{">"}</div>
                         <input 
                           type="text" 
                           value={input}
                           onChange={e => setInput(e.target.value)}
                           onKeyDown={e => e.key === "Enter" && sendResponse(input)}
                           placeholder="MANUAL OVERRIDE..."
                           className="flex-1 bg-black/60 border border-cyan-900/80 rounded-none pl-8 pr-4 py-3 text-xs font-mono focus:outline-none focus:border-cyan-400 text-cyan-100 placeholder-cyan-800 transition-colors"
                         />
                         <button onClick={() => sendResponse(input)} className={`px-8 border ${themeBorderClass} ${themeBgClass} text-white text-xs font-mono uppercase tracking-[0.2em] hover:bg-cyan-600 transition-all hover:shadow-[0_0_20px_rgba(6,182,212,0.6)]`}>
                           Execute
                         </button>
                      </div>
                    </div>
                  )}

                  {akinaiState?.is_final_guess && (
                     <div className="flex justify-center mt-6 relative">
                       <div className="absolute inset-0 bg-purple-500/30 blur-2xl animate-pulse rounded-full" />
                       <button onClick={() => window.location.reload()} className="px-12 py-4 bg-cyan-900 border border-cyan-300 text-white font-black font-mono uppercase tracking-[0.3em] shadow-[0_0_40px_rgba(6,182,212,0.8)] hover:bg-cyan-800 transition-all relative z-10 group">
                         <span className="group-hover:animate-pulse">Reset Core</span>
                       </button>
                     </div>
                  )}
                </div>
             </div>
          </div>

        </div>
      )}
    </main>
  );
}
