# 🧠 Synapse: The Visual Mind Reader

**Built exclusively for the PromptWars: Virtual Hackathon 🚀**

![Synapse UI Preview](https://via.placeholder.com/800x400.png?text=Synapse+-+The+Visual+Mind+Reader)

## 📖 The Evolution of a Classic

For this hackathon challenge, I decided to evolve a game that defined my childhood: **Akinator**. 

The classic Akinator web game felt magical 15 years ago, but it was severely limited by a hard-coded database and a static decision tree. It could only guess famous people, and the UI was completely rigidly text-based.

**Synapse represents the 2026 Evolution.**
What if the AI wasn't just guessing from a list of celebrities? What if it could figure out *literally anything*—an abstract mathematical concept, a hyper-specific personal memory, a bizarre food combination, or an obscure historical artifact? And what if, as it interrogated you, it dynamically generated a live, photorealistic visual representation of what it thought you were imagining?

Welcome to Synapse.

---

## 🛠️ The Tech Stack

*   **Google Gemini (`@google/genai`)** 🧠: The interrogator. We heavily prompt engineered Gemini to ask highly focused, aggressive questions and output a structured JSON containing a `visual_query` representation of its current thoughts.
*   **Pollinations AI Image Generation** 🖼️: The frontend dynamically injects Gemini's `visual_query` into a real-time Image Generation API. As the AI gets closer to guessing your thought, the background image morphs and becomes perfectly accurate!
*   **Next.js 16 (App Router)** ⚡: A fully secure architecture where the API key is never exposed.
*   **Docker** ☁️: Packaged as a standalone container targeting minimal footprint and seamless deployment.

---

## 🎮 How to Play

### 💻 Run Locally

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/sarikashirolkar/PromptWars-Ankinator.git
    cd PromptWars-Ankinator
    ```
2.  **Set Up API Keys**
    Create a `.env.local` file and add your Gemini API Key safely:
    ```env
    PROMPTWARS_GEMINI_KEY=YOUR_GEMINI_KEY_HERE
    ```
3.  **Install & Run**
    ```bash
    npm install
    npm run dev
    ```
    Navigate to `http://localhost:3000` and let the neural connection begin! 🌐
