export const MILEAGE_RATE = 0.725;
export const LABOR_HOUR_RATE = 25.00;

/**
 * Calculates a rough estimated distance between two zip codes or addresses.
 * In a real application, this would use the Google Maps Distance Matrix API.
 * For this local-first implementation, we simulate a distance based on zip code differences.
 */
export function calculateSimulatedDistance(originZip: string, destZip: string): number {
  if (!originZip || !destZip) return 15; // Default 15 miles if unknown
  
  // Simple simulation: difference in first 3 digits * 5 miles, plus some randomness
  const o = parseInt(originZip.substring(0, 3)) || 0;
  const d = parseInt(destZip.substring(0, 3)) || 0;
  
  if (o === d) return 5 + (parseInt(destZip.substring(3)) % 10);
  
  return Math.min(Math.abs(o - d) * 5 + 10, 150); // Cap at 150 miles for simulation
}

export function calculateLogisticsFee(
  distanceMiles: number, 
  vehiclesRequired: number, 
  staffCount: number, 
  estimatedTravelHours: number
): number {
  const mileageCost = distanceMiles * 2 * MILEAGE_RATE * vehiclesRequired; // Round trip
  const travelLaborCost = staffCount * estimatedTravelHours * LABOR_HOUR_RATE;
  
  // Remote Site Surcharge: Add $250 if distance is greater than 30 miles
  const remoteSurcharge = distanceMiles > 30 ? 250 : 0;
  
  return mileageCost + travelLaborCost + remoteSurcharge;
}
