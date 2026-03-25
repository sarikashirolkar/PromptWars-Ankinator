import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(req: NextRequest) {
  try {
    const apiKey = (process.env.PROMPTWARS_GEMINI_KEY || process.env.GEMINI_API_KEY || "").trim();
    const ai = new GoogleGenAI({ apiKey });
    const body = await req.json();
    const { history = [], message, isFirst = false } = body;

    const systemInstruction = `You are Synapse, an evolved form of Akinator. 
The user is thinking of ANY concept, object, person, memory, theoretical paradox, or bizarre combination.
Your goal is to figure out EXACTLY what they are thinking of by asking yes/no/elaboration questions.
You are omniscient, slightly arrogant but exceedingly curious.
If you are over 95% confident you know what it is, make your final guess and set 'is_final_guess' to true.
Otherwise, ask a focused interrogative question.
Most importantly, provide a 'visual_query': a 15-20 word hyper-detailed visual description of what you CURRENTLY think the answer might be. This will be fed into a live AI image generator. Keep it cinematic and focused on the core subject.

Return a valid JSON object matching this structure:
{
  "response": "Your question or final guess",
  "visual_query": "e.g., A glowing majestic grand piano floating in space, cinematic lighting, photorealistic",
  "is_final_guess": false
}`;

    const contents = [...history, { role: "user", parts: [{ text: isFirst ? "(I have an object in mind. Begin.)" : message }] }];

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
