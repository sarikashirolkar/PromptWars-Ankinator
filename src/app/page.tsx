"use client";

import { useState, useEffect, useRef } from "react";

type Message = { role: "user" | "model"; parts: { text: string }[] };
type AkinaiState = { response: string; detected_emotion: string; is_final_guess: boolean };

// A Typewriter component to animate text over time
const TypewriterText = ({ text, onComplete }: { text: string, onComplete?: () => void }) => {
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    setDisplayedText("");
    let i = 0;
    const interval = setInterval(() => {
      setDisplayedText(prev => text.slice(0, prev.length + 1));
      i++;
      if (i >= text.length) {
        clearInterval(interval);
        if (onComplete) onComplete();
      }
    }, 45); // Speed of typing
    return () => clearInterval(interval);
  }, [text, onComplete]);

  return <span>{displayedText}</span>;
};

export default function App() {
  const [history, setHistory] = useState<Message[]>([]);
  const [akinaiState, setAkinaiState] = useState<AkinaiState | null>(null);
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), [history, akinaiState, input, isListening]);

  // Start an ambient low-frequency drone when the game starts
  const startAmbientDrone = () => {
    if (!audioCtxRef.current) {
      const AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;
      
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(55, ctx.currentTime); // Low bass drone
      
      // LFO for eerie pulsing
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.type = "sine";
      lfo.frequency.value = 0.2;
      lfoGain.gain.value = 10;
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 5);
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc.start();
      lfo.start();
    }
  };

  const speakText = (text: string) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel(); // kill ongoing speech
      const utterance = new SpeechSynthesisUtterance(text);
      // Try to find a deep/UK voice
      const voices = window.speechSynthesis.getVoices();
      const deepVoice = voices.find(v => v.name.includes('Google UK English Male') || v.name.includes('Daniel') || v.name.includes('Microsoft David'));
      if (deepVoice) utterance.voice = deepVoice;
      utterance.pitch = 0.4;
      utterance.rate = 0.85;
      window.speechSynthesis.speak(utterance);
    }
  };

  const toggleVoice = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice recognition is not supported in this browser. Please use Chrome.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      let interim = "";
      let final = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) final += event.results[i][0].transcript;
        else interim += event.results[i][0].transcript;
      }
      setInput(final || interim);
      if (final) sendResponse(final);
    };
    recognition.onerror = () => setIsListening(false);
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

      if (!isFirst) {
        setHistory(prev => [...prev, { role: "user", parts: [{ text }] }, { role: "model", parts: [{ text: JSON.stringify(st) }] }]);
      } else {
        setHistory([{ role: "model", parts: [{ text: JSON.stringify(st) }] }]);
      }
    } catch (e: any) {
      alert("Akinai Connection Failed: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStart = () => {
    setStarted(true);
    startAmbientDrone();
    sendResponse("I am thinking of a character. I am ready.", true);
  };

  const charUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent("A cinematic highly detailed dark fantasy mage oracle in glowing red robes acting as a game character. full body standing, deep red aura, concept art")}?width=512&height=768&seed=42&nologo=true`;

  const isAngry = akinaiState?.detected_emotion === "angry";
  const isExcited = akinaiState?.detected_emotion === "excited";

  return (
    <main className={`w-full h-screen overflow-hidden flex flex-col justify-center items-center relative bg-[#0a0000] font-sans ${isAngry ? 'animate-pulse' : ''} ${isExcited ? 'brightness-125' : ''}`}>
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-red-900/20 via-[#0a0000] to-[#050000] z-0" />
      
      {!started ? (
        <div className="z-10 flex flex-col items-center gap-8 animate-fade-in text-center p-8 max-w-2xl bg-red-950/10 border border-red-900/30 rounded-2xl shadow-[0_0_50px_rgba(220,38,38,0.1)] backdrop-blur-md">
          <h1 className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-red-500 to-red-900 tracking-[0.2em] drop-shadow-[0_0_20px_rgba(220,38,38,1)] uppercase">Akinai</h1>
          <p className="text-red-200/60 text-lg leading-relaxed font-light">
            [ ENABLE SOUND & MICROPHONE ]<br/><br/>
            I am Akinai. A neural entity forged in blood-red code.<br/>
            Think of any character. Speak to me naturally. I will weave a story around you, read your emotions, and draw the truth from your mind.
          </p>
          <button onClick={handleStart} className="px-10 py-5 mt-4 bg-red-900/80 hover:bg-red-700 text-white rounded-xl font-bold uppercase tracking-[0.3em] shadow-[0_0_30px_rgba(153,27,27,0.8)] transition-all hover:scale-105 border border-red-500/50">
            Awaken Akinai
          </button>
        </div>
      ) : (
        <div className="z-10 w-full max-w-6xl h-full flex flex-row items-end justify-between p-4 sm:p-8 relative">
          
          {/* Character Image Left */}
          <div className={`hidden md:flex w-1/3 h-full flex-col justify-end items-center pb-8 pl-4 relative transition-transform ${isAngry ? 'scale-105 drop-shadow-[0_0_80px_rgba(255,0,0,0.8)]' : 'drop-shadow-[0_0_50px_rgba(220,38,38,0.6)]'}`}>
            <img src={charUrl} alt="Akinai Oracle" className="w-full max-h-[85vh] object-contain opacity-95" />
            <div className="absolute bottom-[20%] left-1/2 -translate-x-1/2 w-full text-center">
              <h2 className={`text-red-500 font-bold tracking-[0.5em] text-3xl uppercase opacity-80 text-shadow-xl shadow-black ${loading ? 'animate-pulse' : ''}`}>Akinai</h2>
            </div>
          </div>

          {/* Dialog UI Right */}
          <div className="flex-1 w-full md:w-2/3 h-full flex flex-col pt-16 pb-8 pl-0 md:pl-16 relative">
            <div className="flex-1 overflow-y-auto pb-48 flex flex-col gap-6 scrollbar-hide pr-4">
               {akinaiState ? (
                  <div className={`animate-fade-in p-8 bg-[#0a0000]/90 border-t-2 border-l-2 ${isAngry ? 'border-red-500 shadow-[0_20px_60px_rgba(255,0,0,0.6)]' : 'border-red-800/80 shadow-[0_20px_50px_rgba(153,27,27,0.4)]'} rounded-tr-3xl rounded-bl-3xl backdrop-blur-xl relative transition-all`}>
                    <div className="absolute -top-3 left-8 bg-[#0a0000] px-4 text-red-500 text-sm tracking-widest font-bold flex gap-4">
                      <span>AKINAI SPEAKS</span>
                      {akinaiState.detected_emotion && <span className="text-red-900/80">({akinaiState.detected_emotion.toUpperCase()})</span>}
                    </div>
                    {akinaiState.is_final_guess && <div className="text-sm font-bold text-red-400 uppercase tracking-widest mb-4 animate-pulse">*** FINAL ORACLE READ ***</div>}
                    <p className="text-2xl sm:text-3xl font-light text-red-50/90 leading-loose italic">
                      <TypewriterText text={akinaiState.response} />
                    </p>
                  </div>
               ) : (
                  <div className="flex justify-start items-center h-full pl-8">
                    <div className="text-red-600 animate-pulse tracking-widest text-sm uppercase font-mono">Akinai is searching your thoughts...</div>
                  </div>
               )}
               {loading && akinaiState && (
                  <div className="text-red-900 animate-pulse tracking-widest text-sm uppercase font-mono pl-8">Reading emotional resonance...</div>
               )}
               {isListening && input && (
                 <div className="flex justify-end pr-4 text-red-400 italic opacity-80 text-xl font-light">
                   "{input}..."
                 </div>
               )}
               <div ref={endRef} />
            </div>

            {akinaiState && !loading && !akinaiState.is_final_guess && (
               <div className="absolute bottom-8 right-8 w-full md:w-[calc(100%-4rem)] max-w-3xl">
                  <div className="w-full bg-[#0a0000]/90 backdrop-blur-xl border border-red-900/50 p-2 rounded-xl flex items-center shadow-[0_0_30px_rgba(153,27,27,0.3)] hover:border-red-500/50 transition-colors focus-within:border-red-500/50">
                    
                    <button onClick={toggleVoice} className={`py-4 px-6 rounded-lg transition-all font-bold tracking-wider text-sm ${isListening ? 'bg-red-600 animate-pulse shadow-[0_0_20px_rgba(220,38,38,0.8)] text-white' : 'bg-[#1a0505] hover:bg-red-900/50 border border-red-900/50 text-red-400'}`}>
                      {isListening ? '🎙️ LISTENING...' : '🎤 PUSH TO TALK'}
                    </button>

                    <input 
                      type="text" 
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && sendResponse(input)}
                      placeholder={isListening ? "Listening to your voice..." : "Type your response to Akinai..."}
                      className="flex-1 bg-transparent border-none text-red-100 px-6 py-4 outline-none placeholder-red-900/40 text-xl font-light italic"
                      autoFocus
                    />
                    
                    <button onClick={() => sendResponse(input)} className="bg-[#1a0505] hover:bg-red-800 text-red-300 px-8 py-5 rounded-lg font-bold transition-all uppercase tracking-widest text-sm border-l border-red-900/50">
                      Submit
                    </button>
                  </div>
               </div>
            )}

            {akinaiState?.is_final_guess && (
               <div className="absolute bottom-12 right-1/2 translate-x-1/2 md:translate-x-0 md:right-8">
                  <button onClick={() => window.location.reload()} className="bg-[#1a0505] text-red-200 border border-red-800/80 px-12 py-5 rounded-2xl font-bold hover:bg-red-900 shadow-[0_0_40px_rgba(220,38,38,0.3)] transition-all uppercase tracking-[0.2em] text-lg">
                    Sever Connection & Restart
                  </button>
               </div>
            )}
          </div>

        </div>
      )}
    </main>
  );
}
