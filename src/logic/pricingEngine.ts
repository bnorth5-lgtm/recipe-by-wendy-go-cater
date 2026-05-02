export const targetMargin = 0.70;

export function calculateMargin(revenue: number, cogs: number): number {
  if (revenue <= 0) return 0;
  return (revenue - cogs) / revenue;
}

export function getMarginHealth(revenue: number, cogs: number): {
  margin: number;
  isHealthy: boolean;
  statusText: string;
} {
  const margin = calculateMargin(revenue, cogs);
  const isHealthy = margin >= targetMargin;
  
  return {
    margin,
    isHealthy,
    statusText: isHealthy ? "Healthy" : "Below Target"
  };
}