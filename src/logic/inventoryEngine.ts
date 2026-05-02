import { fetchBEOHistory, EventOrderRow } from "@/lib/beoGenerator";

export interface EquipmentConflict {
  item: string;
  conflictingBeoNumber: string;
  conflictingEventName: string;
}

export async function checkEquipmentConflict(
  eventDate: string,
  proposedEquipment: { item: string; qty: number }[]
): Promise<EquipmentConflict[]> {
  if (!eventDate) return [];

  const history = await fetchBEOHistory();
  const sameDayEvents = history.filter(
    (h) => h.event_date === eventDate && h.status !== "cancelled"
  );

  if (sameDayEvents.length === 0) return [];

  // Define "Legacy Equipment" that might be limited in stock
  // In a real system, this would be tied to inventory quantities.
  const legacyEquipment = [
    "Portable Bar (6-ft)",
    "Chafing Dish (full-size)",
    "Chafing Dish (half-size)",
    "Table Linen (90\" round)",
  ];

  const conflicts: EquipmentConflict[] = [];

  for (const event of sameDayEvents) {
    // In our simplified local structure, we might not have the full equipment needs
    // directly on the summary row unless we fetch by ID or assume standard conflicts.
    // For this demonstration of "Crash Insurance", we'll just flag if any legacy 
    // item is requested and there's another event on the same day.
    for (const eq of proposedEquipment) {
      if (legacyEquipment.includes(eq.item)) {
        conflicts.push({
          item: eq.item,
          conflictingBeoNumber: event.beo_number,
          conflictingEventName: event.event_name,
        });
      }
    }
  }

  // Deduplicate conflicts
  const uniqueConflicts = Array.from(new Set(conflicts.map(c => c.item)))
    .map(item => conflicts.find(c => c.item === item)!);

  return uniqueConflicts;
}