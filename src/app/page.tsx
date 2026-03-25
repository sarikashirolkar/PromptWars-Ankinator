"use client";

import { useState, useEffect, useRef } from "react";

type Message = { role: "user" | "model"; parts: { text: string }[] };
type SynapseState = { response: string; visual_query: string; is_final_guess: boolean };

export default function App() {
  const [history, setHistory] = useState<Message[]>([]);
  const [synapseState, setSynapseState] = useState<SynapseState | null>(null);
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), [history, synapseState]);

  const sendResponse = async (text: string, isFirst = false) => {
    if (!text.trim() && !isFirst) return;
    if (loading) return;

    setLoading(true);
    setInput("");

    try {
      const res = await fetch("/api/synapse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ history, message: text, isFirst })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      let raw = data.result || "{}";
      raw = raw.replace(/```json/g, "").replace(/```/g, "").trim();
      const st = JSON.parse(raw) as SynapseState;
      setSynapseState(st);

      if (!isFirst) {
        setHistory(prev => [...prev, { role: "user", parts: [{ text }] }, { role: "model", parts: [{ text: JSON.stringify(st) }] }]);
      } else {
        setHistory([{ role: "model", parts: [{ text: JSON.stringify(st) }] }]);
      }
    } catch (e: any) {
      alert("Synapse Connection Failed: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStart = () => {
    setStarted(true);
    sendResponse("", true);
  };

  const bgUrl = synapseState?.visual_query 
    ? `https://image.pollinations.ai/prompt/${encodeURIComponent(synapseState.visual_query)}?width=1920&height=1080&nologo=true`
    : "";

  return (
    <main className="w-full h-screen overflow-hidden flex flex-col justify-center items-center relative transition-all duration-[3000ms]"
          style={{ backgroundImage: bgUrl ? `url('${bgUrl}')` : 'none', backgroundSize: 'cover', backgroundPosition: 'center', backgroundColor: '#0a0a0a' }}>
      
      <div className="absolute top-0 left-0 w-full h-full bg-black/60 backdrop-blur-sm z-0" />
      
      {!started ? (
        <div className="z-10 flex flex-col items-center gap-8 animate-fade-in text-center p-8 max-w-2xl bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md shadow-2xl">
          <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-600 tracking-tight">SYNAPSE</h1>
          <p className="text-gray-300 text-lg leading-relaxed">
            I am not bound by lists or names. I can see what you are imagining.<br/>
            Think of an object, a feeling, a historical event, or a specific dream.
          </p>
          <button onClick={handleStart} className="px-8 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-full font-bold uppercase tracking-wider shadow-[0_0_20px_rgba(34,211,238,0.5)] transition-all">
            Initiate Connection
          </button>
        </div>
      ) : (
        <div className="z-10 w-full max-w-4xl h-full flex flex-col p-4 sm:p-8">
          <div className="flex-1 overflow-y-auto pb-32 pt-8 flex flex-col gap-6">
             {synapseState ? (
                <div className="animate-fade-in p-6 bg-black/60 border border-white/10 rounded-xl backdrop-blur-md shadow-2xl">
                  {synapseState.is_final_guess && <div className="text-sm font-bold text-green-400 uppercase tracking-widest mb-2">FINAL SYNAPSE READ</div>}
                  <p className="text-xl sm:text-3xl font-medium text-white leading-relaxed text-center">{synapseState.response}</p>
                </div>
             ) : (
                <div className="flex justify-center items-center h-full">
                  <div className="text-cyan-400 animate-pulse tracking-widest text-sm uppercase font-mono">Calibrating to your neural frequency...</div>
                </div>
             )}
             {loading && synapseState && (
                <div className="text-purple-400 animate-pulse tracking-widest text-sm uppercase font-mono text-center mt-4">Scanning possibilities...</div>
             )}
             <div ref={endRef} />
          </div>

          {synapseState && !loading && !synapseState.is_final_guess && (
             <div className="fixed bottom-0 left-0 w-full p-4 sm:p-8 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex justify-center">
                <div className="w-full max-w-4xl bg-black/40 backdrop-blur-md border border-white/10 p-2 rounded-full flex items-center shadow-2xl">
                  <input 
                    type="text" 
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && sendResponse(input)}
                    placeholder="Provide your answer or elaboration..."
                    className="flex-1 bg-transparent border-none text-white px-6 py-3 outline-none placeholder-gray-500 text-xl"
                    autoFocus
                  />
                  <button onClick={() => sendResponse(input)} className="bg-cyan-600 hover:bg-cyan-500 px-8 py-3 rounded-full text-white font-bold transition-all border border-cyan-400/50">
                    TRANSMIT
                  </button>
                </div>
             </div>
          )}

          {synapseState?.is_final_guess && (
             <div className="fixed bottom-8 left-1/2 -translate-x-1/2">
                <button onClick={() => window.location.reload()} className="bg-white text-black px-8 py-3 rounded-full font-bold hover:bg-gray-200 shadow-xl transition-all uppercase tracking-widest">
                  Think of Something Else
                </button>
             </div>
          )}
        </div>
      )}
    </main>
  );
}
