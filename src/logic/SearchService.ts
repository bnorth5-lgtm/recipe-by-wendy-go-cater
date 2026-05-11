import { logSystemAlert } from "@/lib/switchboardHook";

// The Zero-Spend Guard: Build a 'Credit Watchdog' into the search logic. 
// It must track our 1,000-call monthly limit and notify the Switchboard if we hit 90%.

/** Scout / Brave lane caps — align OPS ethos (~$5 / 1000-call style windows in Masterpiece OPS). */
function readMonthlyCallCap(): number {
  const raw = import.meta.env.VITE_BRAVE_SEARCH_MONTHLY_CALL_CAP;
  const n = raw !== undefined && raw !== "" ? Number.parseInt(String(raw), 10) : NaN;
  return Number.isFinite(n) && n > 0 ? n : 1000;
}

class SearchService {
  private apiKey: string;
  private monthlyLimit: number;
  private currentCalls = 0; // In a real app, this would be persisted to a DB

  constructor() {
    // Vite uses import.meta.env
    this.apiKey = import.meta.env.VITE_BRAVE_SEARCH_API_KEY || "";
    this.monthlyLimit = readMonthlyCallCap();
  }

  async search(query: string) {
    if (!this.apiKey) {
      console.warn("Brave Search API key not found. Returning mock data.");
      return this.mockSearch(query);
    }

    this.currentCalls++;
    
    // Check if we hit 90%
    if (this.currentCalls === Math.floor(this.monthlyLimit * 0.9)) {
      await logSystemAlert({
        alert_type: 'Credit Watchdog',
        severity: 'warning',
        message: 'Brave Search API call limit reached 90% (900/1000 calls).',
        metadata: { currentCalls: this.currentCalls, limit: this.monthlyLimit }
      });
    }

    try {
      const response = await fetch(`https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}`, {
        headers: {
          "Accept": "application/json",
          "Accept-Encoding": "gzip",
          "X-Subscription-Token": this.apiKey
        }
      });

      if (!response.ok) {
        throw new Error(`Brave Search API error: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        web: data.web?.results || [],
        news: data.news?.results || []
      };
    } catch (error) {
      console.error("SearchService error:", error);
      return this.mockSearch(query);
    }
  }

  private mockSearch(query: string) {
    return {
      web: [{ title: `Mock Result for ${query}`, description: "This is a mock result because the API key is missing or failed." }],
      news: []
    };
  }
}

export const searchService = new SearchService();
