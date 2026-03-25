# 🧠 Akinai: The Evolved Oracle (Akinator 2.0)

**Built exclusively for the PromptWars: Virtual Hackathon 🚀**

## 📖 The Evolution of a Classic
For this challenge, I decided to evolve a game that defined my childhood: **Akinator**. 
The classic Akinator felt magical 15 years ago, but it was severely limited. It could only guess famous people using a rigid Yes/No database, and the UI was entirely static text.

**Akinai represents the true 2026 Evolution.**
What if the AI wasn't just blindly narrowing down a list of celebrities? What if it actively **listened to your voice**, judged your emotional state, and wove an interactive story around you as it tried to guess your character?

Welcome to Akinai.

---

## 🛠️ Groundbreaking Features
*   **Voice Integration:** Speak naturally directly to Akinai using built-in Voice Web Speech capabilities.
*   **Emotional Storytelling Inference:** Gemini is prompt-engineered to infer your emotional state from how you phrase your sentences and dynamically changes its storytelling dialogue to reflect your mood (e.g. "I sense your hesitation...").
*   **Dynamic Visual UI:** A beautifully atmospheric, blood-red Glassmorphism UI featuring a cinematic standing Oracle character that interacts with you.

## 💻 Tech Stack
*   **Google Gemini (`@google/genai`)**: The storyteller.
*   **Next.js 16 (App Router)**: Fast, secure backend architecture.
*   **Docker & Google Cloud Run**: Containerized for minimal footprint deployment.

---

## 🎮 Run Locally
1. `git clone https://github.com/sarikashirolkar/PromptWars-Ankinator.git`
2. Create `.env.local` containing `PROMPTWARS_GEMINI_KEY=YOUR_API_KEY`
3. `npm install && npm run dev`
