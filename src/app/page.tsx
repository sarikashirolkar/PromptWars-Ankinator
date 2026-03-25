"use client";

import { useState, useEffect, useRef } from "react";

type AkinaiState = { response: string; detected_emotion: string; is_final_guess: boolean };

const TypewriterText = ({ text }: { text: string }) => {
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    setDisplayedText("");
    let i = 0;
    const interval = setInterval(() => {
      setDisplayedText(prev => text.slice(0, prev.length + 1));
      i++;
      if (i >= text.length) clearInterval(interval);
    }, 40);
    return () => clearInterval(interval);
  }, [text]);

  return <span>{displayedText}</span>;
};

// Floating Ash Particles Component
const AshParticles = () => {
  const [particles, setParticles] = useState([...Array(30)].map((_, i) => ({
    id: i,
    left: Math.random() * 100,
    animationDuration: 5 + Math.random() * 10,
    delay: Math.random() * 5,
    size: Math.random() * 4 + 1
  })));

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      {particles.map(p => (
        <div key={p.id} className="absolute bottom-[-10px] bg-red-500 rounded-full blur-[1px] opacity-70 animate-float"
             style={{ left: `${p.left}%`, width: `${p.size}px`, height: `${p.size}px`, animationDuration: `${p.animationDuration}s`, animationDelay: `${p.delay}s` }} />
      ))}
    </div>
  );
};

export default function App() {
  const [history, setHistory] = useState<{role: string, parts: any[]}[]>([]);
  const [akinaiState, setAkinaiState] = useState<AkinaiState | null>(null);
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const startAmbientDrone = () => {
    if (!audioCtxRef.current) {
      const AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(50, ctx.currentTime);
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.type = "sine";
      lfo.frequency.value = 0.1;
      lfoGain.gain.value = 15;
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 5);
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start();
      lfo.start();
    }
  };

  const speakText = (text: string) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      const voices = window.speechSynthesis.getVoices();
      const deepVoice = voices.find(v => v.name.includes('Google UK English Male') || v.name.includes('Daniel') || v.name.includes('David'));
      if (deepVoice) utterance.voice = deepVoice;
      utterance.pitch = 0.3;
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  const toggleVoice = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice recognition not supported.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      let interim = "", final = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) final += event.results[i][0].transcript;
        else interim += event.results[i][0].transcript;
      }
      setInput(final || interim);
      if (final) sendResponse(final);
    };
    recognition.onend = () => setIsListening(false);
    
    if (isListening) recognition.stop();
    else recognition.start();
  };

  const sendResponse = async (text: string, isFirst = false) => {
    window.speechSynthesis?.cancel();
    if (!text.trim() && !isFirst) return;
    if (loading) return;

    setLoading(true);
    setInput("");

    try {
      const res = await fetch("/api/akinai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ history, message: text })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      let raw = data.result || "{}";
      raw = raw.replace(/```json/g, "").replace(/```/g, "").trim();
      const st = JSON.parse(raw) as AkinaiState;
      setAkinaiState(st);
      speakText(st.response);

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
    startAmbientDrone();
    sendResponse("", true);
  };

  const charUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent("A highly detailed dark fantasy mage oracle in glowing red robes, intimidating, glowing red eyes, concept art portrait, masterpiece")}?width=768&height=1024&seed=45&nologo=true`;

  const emotionColor = akinaiState?.detected_emotion === "angry" ? "rgba(220,38,38,0.8)" 
                      : akinaiState?.detected_emotion === "excited" ? "rgba(234,179,8,0.8)"
                      : akinaiState?.detected_emotion === "fearful" ? "rgba(147,51,234,0.8)"
                      : "rgba(153,27,27,0.5)";

  return (
    <main className="w-full h-screen bg-[#050000] overflow-hidden flex flex-col relative font-sans select-none">
      
      {/* Background Magic Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,0,0,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,0,0,0.05)_1px,transparent_1px)] bg-[size:50px_50px] opacity-20 pointer-events-none" style={{ perspective: "500px", transform: "rotateX(60deg) scale(2)", transformOrigin: "bottom" }} />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_20%,_#050000_80%)] z-0" />
      <AshParticles />

      {!started ? (
        <div className="flex-1 flex flex-col justify-center items-center z-10 p-8">
          <div className="relative group">
            <h1 className="text-8xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-b from-red-500 to-red-950 tracking-[0.2em] relative z-10 drop-shadow-[0_0_30px_rgba(220,38,38,0.6)] group-hover:scale-105 transition-transform duration-700">AKINAI</h1>
            <h1 className="text-8xl md:text-9xl font-black text-red-500 tracking-[0.2em] absolute top-1 left-1 opacity-40 blur-md pointer-events-none">AKINAI</h1>
          </div>
          <p className="text-red-300 mt-8 mb-12 max-w-lg text-center tracking-widest leading-loose font-light opacity-80 uppercase text-sm">
            Neural link established.<br/>Think of your character. Let the Oracle inside.
          </p>
          <button onClick={handleStart} className="px-16 py-6 border border-red-500/50 bg-red-950/40 backdrop-blur-md rounded-full text-red-200 uppercase tracking-[0.4em] font-bold hover:bg-red-800 hover:text-white hover:scale-110 hover:shadow-[0_0_50px_rgba(220,38,38,0.6)] transition-all duration-500">
            Awaken The Oracle
          </button>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-between w-full h-full relative z-10 pt-10">

          {/* Character Art (Centered, Breathing) */}
          <div className="flex-1 w-full max-w-4xl relative flex justify-center items-end pb-[25vh]">
            <img 
              src={charUrl} 
              alt="Akinai" 
              className={`absolute bottom-0 h-[85vh] object-contain object-bottom pointer-events-none filter transition-all duration-[2000ms]
                ${loading ? 'brightness-50 grayscale-[50%]' : 'brightness-110 drop-shadow-[0_0_80px_rgba(220,38,38,0.5)]'}
                animate-breathe
              `}
              style={{ filter: `drop-shadow(0 0 50px ${emotionColor})` }}
            />
            {loading && <div className="absolute top-1/4 w-32 h-32 rounded-full border-4 border-red-500/50 border-t-red-500 animate-spin blur-[2px]" />}
          </div>

          {/* RPG HUD bottom docked dialog box */}
          <div className="absolute bottom-0 left-0 w-full h-[35vh] flex flex-col justify-end bg-gradient-to-t from-black via-black/90 to-transparent pt-20 px-4 pb-8">
            <div className="max-w-5xl w-full mx-auto relative group">
              
              {/* Speaker Name Tag */}
              <div className="absolute -top-6 left-8 bg-red-950 border border-red-500/50 px-8 py-2 transform skew-x-[-15deg] shadow-[0_0_20px_rgba(220,38,38,0.4)]">
                <span className="block transform skew-x-[15deg] font-black text-red-400 tracking-[0.3em] uppercase text-sm">
                  {loading ? "SEARCHING..." : "AKINAI"}
                </span>
              </div>

              {/* Dialogue Box */}
              <div className="w-full bg-[#050000]/80 backdrop-blur-xl border border-red-900/80 p-8 pt-10 shadow-[0_0_50px_rgba(153,27,27,0.3)] min-h-[160px] flex flex-col justify-between">
                
                <div className="text-xl md:text-3xl text-red-50 font-light leading-relaxed tracking-wider mb-8 drop-shadow-md">
                  {loading ? (
                    <span className="text-red-800 animate-pulse italic">"Peering into the abyssal echoes of your mind..."</span>
                  ) : akinaiState ? (
                    <TypewriterText text={`"${akinaiState.response}"`} />
                  ) : null}
                </div>

                {/* Input Bar */}
                {!loading && akinaiState && !akinaiState.is_final_guess && (
                  <div className="flex gap-4 items-center border-t border-red-900/30 pt-6">
                    <button 
                      onClick={toggleVoice} 
                      className={`h-14 w-14 flex justify-center items-center rounded-full transition-all duration-300 border ${isListening ? 'bg-red-600 border-red-400 shadow-[0_0_20px_rgba(255,0,0,0.8)] animate-pulse' : 'bg-red-950/40 border-red-800/50 hover:bg-red-800 hover:border-red-500'}`}
                    >
                      {isListening ? '🎙️' : '🎤'}
                    </button>

                    <input 
                      type="text" 
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && sendResponse(input)}
                      placeholder={isListening ? "Listening..." : "Type your answer or elaborate..."}
                      className="flex-1 h-14 bg-red-950/20 border border-red-900/50 px-6 text-red-100 text-lg placeholder-red-900/60 focus:outline-none focus:border-red-500/80 focus:bg-red-900/40 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] transition-all font-light"
                      autoFocus
                    />

                    <button 
                      onClick={() => sendResponse(input)} 
                      className="h-14 px-10 bg-red-800 text-white font-bold tracking-[0.2em] uppercase hover:bg-red-600 border border-red-500/50 shadow-[0_0_15px_rgba(220,38,38,0.4)] transition-all hover:scale-105"
                    >
                      Enter
                    </button>
                  </div>
                )}

                {akinaiState?.is_final_guess && (
                  <div className="flex justify-center border-t border-red-900/30 pt-6">
                    <button 
                      onClick={() => window.location.reload()} 
                      className="h-14 px-12 bg-white text-black font-black tracking-[0.3em] uppercase hover:bg-gray-200 border border-red-500 shadow-[0_0_30px_rgba(255,255,255,0.4)] transition-all hover:scale-105"
                    >
                      Sever Connection
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
