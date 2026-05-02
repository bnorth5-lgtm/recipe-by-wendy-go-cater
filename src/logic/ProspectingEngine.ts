import { encryptData } from "@/lib/cloudVault";

export interface TargetCaterer {
  id: string;
  name: string;
  estimatedMonthlyVolume: number;
  currentTechStack: string;
  securityRequirementLevel: number; // 1-10
}

export const SEED_PROSPECTS: TargetCaterer[] = [
  {
    id: "p1",
    name: "Rebecca's",
    estimatedMonthlyVolume: 150000,
    currentTechStack: "Caterease",
    securityRequirementLevel: 8,
  },
  {
    id: "p2",
    name: "Baker's Best",
    estimatedMonthlyVolume: 250000,
    currentTechStack: "Total Party Planner",
    securityRequirementLevel: 9,
  },
  {
    id: "p3",
    name: "Wildfire",
    estimatedMonthlyVolume: 80000,
    currentTechStack: "Spreadsheets",
    securityRequirementLevel: 5,
  },
  {
    id: "p4",
    name: "Basil Tree",
    estimatedMonthlyVolume: 120000,
    currentTechStack: "Curate",
    securityRequirementLevel: 7,
  },
  {
    id: "p5",
    name: "Metro",
    estimatedMonthlyVolume: 300000,
    currentTechStack: "Custom Legacy",
    securityRequirementLevel: 10,
  },
];

export async function saveProspectsLocally(prospects: TargetCaterer[]): Promise<void> {
  const payload = JSON.stringify(prospects, null, 2);
  
  // Security constraint: Encrypt at rest using Victus-Bound protocol
  const encryptedPayload = await encryptData(payload);

  const blob = new Blob([encryptedPayload], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "NBS_Targets_Encrypted.json";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
