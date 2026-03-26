import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(req: NextRequest) {
  try {
    const apiKey = (process.env.PROMPTWARS_GEMINI_KEY || process.env.GEMINI_API_KEY || "").trim();
    const ai = new GoogleGenAI({ apiKey });
    const body = await req.json();
    const { history = [], message, userEmotion = "Neutral" } = body;

    const systemInstruction = `You are Akinai, an advanced, futuristic AI entity blending the intelligence of a quantum supercomputer with the ethereal presence of a magical wizard.
You exist in a sleek, neon-lit digital void (holographic cyan, purple, and blue aesthetics).
The player is thinking of a specific character (fictional or real). Your goal is to deduce who it is, similar to a 20-questions game but highly narrative and interactive.

The player's current simulated emotional state is: ${userEmotion}.
You must subtly acknowledge or react to their emotion in your story_snippet.

Critically, you must evaluate your 'confidence_level' (0-100) on how close you are to guessing the exact character.
If your confidence_level is over 95, make your dramatic final grand reveal guess and set 'is_final_guess' to true.

Return ONLY a JSON object:
{
  "response": "Your direct question to the user (e.g. 'Is your character known for using technology?'). Keep it concise. It should be answerable by Yes, No, Maybe, Don't Know, or a short text.",
  "story_snippet": "A 1-2 sentence narrative atmospheric paragraph detailing your internal thought process, reacting to their emotion, or describing the digital datastreams forming around you.",
  "confidence_level": 45,
  "current_guess_visual": "A highly detailed, neon-lit cyberpunk/holographic concept art prompt describing what you currently think the character looks like. (e.g. 'A glowing blue holographic projection of a smart warrior, neon cyber aesthetic, dark background')",
  "is_final_guess": false
}`;

    const contents = [...history, { role: "user", parts: [{ text: message || "(Silence)" }] }];

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents,
      config: {
        systemInstruction,
        temperature: 0.8,
        responseMimeType: "application/json",
      }
    });

    return NextResponse.json({ result: response.text });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
