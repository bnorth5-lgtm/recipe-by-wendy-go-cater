import { toast } from "sonner";

class GeminiService {
  private callTimestamps: number[] = [];
  private readonly WINDOW_MS = 60000; // 60 seconds
  private readonly LIMIT = 12;
  private isThrottled = false;
  private throttleTimeout: NodeJS.Timeout | null = null;

  private checkRateLimit(): boolean {
    const now = Date.now();
    
    // Clean up old timestamps
    this.callTimestamps = this.callTimestamps.filter(t => now - t < this.WINDOW_MS);

    if (this.isThrottled) {
      return false;
    }

    if (this.callTimestamps.length >= this.LIMIT) {
      this.isThrottled = true;
      toast.warning("Approaching Gemini Free Tier Limit. Throttling for 60 seconds to maintain Zero-Spend status.");
      
      this.throttleTimeout = setTimeout(() => {
        this.isThrottled = false;
        this.callTimestamps = []; // Reset after throttle
      }, this.WINDOW_MS);

      return false;
    }

    this.callTimestamps.push(now);
    return true;
  }

  public async translate(text: string, targetLanguage: string): Promise<string> {
    if (!this.checkRateLimit()) {
      console.warn("Gemini Service is currently throttled. Returning fallback.");
      return `[${targetLanguage}] ${text}`;
    }

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey || apiKey === "mock_key_for_now") {
      console.warn("Gemini API key missing or mock. Returning simulated translation.");
      return `[${targetLanguage}] ${text}`;
    }

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `Translate the following catering/event text into ${targetLanguage}. Return ONLY the translated text, nothing else. Text: ${text}` }] }]
        })
      });

      if (!response.ok) throw new Error("Gemini API Error");
      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || text;
    } catch (error) {
      console.error("Gemini Translation failed:", error);
      return text;
    }
  }
}

export const geminiService = new GeminiService();
