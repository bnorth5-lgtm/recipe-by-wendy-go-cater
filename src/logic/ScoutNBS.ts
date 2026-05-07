import { searchService } from "./SearchService";
import { logSystemAlert } from "@/lib/switchboardHook";

export interface GlobalPin {
  lat: number;
  lng: number;
  region: string;
  items: string[];
}

/**
 * Scout_NBS: Regional Market Intelligence Scraper
 * Primary Directive: Feed Albert the Brain real-time wholesale costs to protect the 70% Margin.
 */
export async function dropGlobalPin(pin: GlobalPin) {
  console.log("Global Pin dropped at:", pin);

  const results: Record<string, any> = {};

  for (const item of pin.items) {
    // Web-Awareness: Use Brave Search API to hunt for real-time wholesale pricing
    const query = `wholesale price ${item} ${pin.region}`;
    const searchData = await searchService.search(query);
    
    results[item] = searchData;
  }

  // The Intelligence Bridge: Pass raw search results to Albert the Brain
  await passToAlbertTheBrain(pin, results);

  return results;
}

async function passToAlbertTheBrain(pin: GlobalPin, rawData: any) {
  console.log("Passing raw search results to Albert the Brain for 70% Profit Lock calculation...", rawData);
  
  // In a real implementation, this would trigger Albert's pricing engine
  await logSystemAlert({
    alert_type: 'Profit Alert',
    severity: 'info',
    message: `Scout_NBS passed raw market data to Albert for ${pin.items.length} items in ${pin.region}.`,
    metadata: { items: pin.items, region: pin.region }
  });
}
