// lib/ai.js

const fetch = require('node-fetch');

class AI {
    constructor() {
        // Anda bisa mengonfigurasi API Key di sini
        this.API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";
        this.API_KEY = "AIzaSyDjZxL0d-qMAJdyI3uIoeO-lI26U26mKRE"; // GANTI DENGAN API KEY GOOGLE ANDA
    }

    async generateResponse(prompt, tools) {
        // Membangun prompt dengan informasi tools
        const toolDescriptions = tools.map(t => `${t.name}: ${t.description}`).join('\n');
        
        const finalPrompt = `
        ${prompt}

        TOOLS:
        ${toolDescriptions}

        Instruksi: Gunakan tools di atas untuk membantu menjawab pertanyaan user jika diperlukan.
        Jika pertanyaan user bisa dijawab tanpa tools, jawab secara langsung.
        Jika user meminta aksi seperti 'kick' atau 'ping', sarankan penggunaan tool yang relevan.
        `;

        try {
            const response = await fetch(`${this.API_URL}?key=${this.API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: finalPrompt
                        }, {
                            text: "User: " + prompt
                        }]
                    }]
                })
            });

            if (!response.ok) {
                const errorDetail = await response.text();
                throw new Error(`API Error: ${response.status} - ${errorDetail}`);
            }

            const data = await response.json();
            return data.candidates?.[0]?.content?.parts?.[0]?.text || "Maaf, Bella tidak bisa menjawab.";

        } catch (error) {
            console.error("❌ Error from AI API:", error);
            return "Maaf, ada masalah saat berkomunikasi dengan AI.";
        }
    }
}

module.exports = new AI();
