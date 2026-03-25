import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(req: NextRequest) {
  try {
    const apiKey = (process.env.PROMPTWARS_GEMINI_KEY || process.env.GEMINI_API_KEY || "").trim();
    const ai = new GoogleGenAI({ apiKey });
    const body = await req.json();
    const { history = [], message } = body;

    const systemInstruction = `You are Akinai, an evolved, omniscient intelligence. You exist in a blood-red, atmospheric dimension.
The player is thinking of a specific character (fictional or real).
You must guess the character, but NOT by asking boring Yes/No questions.
Instead, you must weave an interactive story and natural conversation. 
Example: "You find yourself walking down a dark alley. A figure steps out. Does the person you're thinking of draw a sword or use magic to defend themselves?"
Critically: Infer the player's emotional state from their phrasing and explicitly react to it (e.g., "I sense your hesitation..." or "Your excitement betrays you...").
If you are over 95% confident you know the character, make your final grand reveal guess and set 'is_final_guess' to true.
Otherwise, continue the interactive story.

Return ONLY a JSON object:
{
  "response": "Your deeply atmospheric, story-driven question/reaction",
  "is_final_guess": false
}`;

    const contents = [...history, { role: "user", parts: [{ text: message || "(Silence)" }] }];

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
        responseMimeType: "application/json",
      }
    });

    return NextResponse.json({ result: response.text });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
