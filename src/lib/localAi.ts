import type { Recipe } from "@/store/cateringStore";

type OllamaChatMessage = { role: "system" | "user" | "assistant"; content: string };

type OllamaChatResponse = {
  message?: { content?: string };
  response?: string; // older format
};

const DEFAULT_MODEL = import.meta.env.VITE_OLLAMA_MODEL || "llama3.1";
const DEFAULT_BASE_URL = import.meta.env.VITE_OLLAMA_BASE_URL || "http://127.0.0.1:11434";

export type ParsedRecipeDraft = Omit<Recipe, "id" | "baseCost">;
export type ParsedRecipeMeta = Partial<
  Pick<
    Recipe,
    | "sourceUrl"
    | "sourceType"
    | "sourceSite"
    | "sourceTitle"
    | "sourceAuthor"
    | "importMethod"
    | "importedAt"
    | "sourceJson"
  >
>;

function stripCodeFences(text: string) {
  const trimmed = text.trim();
  if (trimmed.startsWith("```")) {
    return trimmed.replace(/^```[a-zA-Z]*\s*/m, "").replace(/```$/m, "").trim();
  }
  return trimmed;
}

function coerceDraft(raw: any): ParsedRecipeDraft {
  return {
    name: String(raw?.name ?? "").trim(),
    description: String(raw?.description ?? "").trim(),
    prepTime: String(raw?.prepTime ?? "").trim(),
    cookTime: String(raw?.cookTime ?? "").trim(),
    servings: String(raw?.servings ?? "").trim(),
    category: (raw?.category ?? "Other") as ParsedRecipeDraft["category"],
    sourceUrl: raw?.sourceUrl ? String(raw.sourceUrl) : "",
    sourceType: raw?.sourceType ? String(raw.sourceType) : undefined,
    sourceSite: raw?.sourceSite ? String(raw.sourceSite) : undefined,
    sourceTitle: raw?.sourceTitle ? String(raw.sourceTitle) : undefined,
    sourceAuthor: raw?.sourceAuthor ? String(raw.sourceAuthor) : undefined,
    importMethod: raw?.importMethod ? String(raw.importMethod) : undefined,
    importedAt: raw?.importedAt ? String(raw.importedAt) : undefined,
    sourceJson: raw?.sourceJson ?? undefined,
    importedBaseCost:
      raw?.importedBaseCost == null || raw?.importedBaseCost === ""
        ? undefined
        : Number.isFinite(Number(raw.importedBaseCost))
          ? Number(raw.importedBaseCost)
          : undefined,
    ingredients: Array.isArray(raw?.ingredients)
      ? raw.ingredients
          .map((i: any) => ({
            name: String(i?.name ?? "").trim(),
            quantity: Number(i?.quantity ?? 0),
            unit: String(i?.unit ?? "").trim(),
          }))
          .filter((i: any) => i.name && i.quantity > 0 && i.unit)
      : [],
    instructions: Array.isArray(raw?.instructions)
      ? raw.instructions
          .map((s: any) => ({ step: String(s?.step ?? "").trim() }))
          .filter((s: any) => s.step)
      : [],
  };
}

async function ollamaChatToJson(messages: OllamaChatMessage[]): Promise<any> {
  const res = await fetch(`${DEFAULT_BASE_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: DEFAULT_MODEL,
      stream: false,
      messages,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Local AI request failed (${res.status}). ${body}`.trim());
  }

  const data = (await res.json()) as OllamaChatResponse;
  const content = (data.message?.content ?? data.response ?? "").trim();
  const jsonText = stripCodeFences(content);

  try {
    return JSON.parse(jsonText);
  } catch {
    throw new Error("Local AI returned non-JSON output. Please try again with cleaner input.");
  }
}

const RECIPE_SCHEMA_INSTRUCTION =
  "Output ONLY strict JSON (no markdown) that matches this TypeScript shape:\n" +
  "{ name: string, description: string, prepTime: string, cookTime: string, servings: string, category: " +
  '"Appetizer"|"Main Course"|"Dessert"|"Alcoholic Beverage"|"Non-Alcoholic Beverage"|"Side Dish"|"Breakfast"|"Vegetarian Main"|"Other",' +
  " ingredients: {name:string, quantity:number, unit:string}[], instructions: {step:string}[], sourceUrl?: string," +
  " sourceType?: string, sourceSite?: string, sourceTitle?: string, sourceAuthor?: string, importMethod?: string, importedAt?: string, sourceJson?: any, importedBaseCost?: number }";

const RECIPE_RULES =
  "Rules: keep units short and standardized (lb, oz, g, kg, cup, tbsp, tsp, fl oz, pint, quart, gallon, ml, l, count). " +
  "If quantity missing, infer a reasonable numeric quantity. If unclear, omit that ingredient. " +
  "Keep instructions as short imperative steps. Avoid duplicate steps. " +
  "If you are given JSON-LD or structured recipe data, trust that and do not invent missing fields.";

export async function parseRecipeWithLocalAi(input: { text: string; meta?: ParsedRecipeMeta }): Promise<ParsedRecipeDraft> {
  const system: OllamaChatMessage = {
    role: "system",
    content:
      "You are a culinary operations parser for a local catering app.\n" +
      RECIPE_SCHEMA_INSTRUCTION +
      "\n" +
      RECIPE_RULES,
  };

  const user: OllamaChatMessage = {
    role: "user",
    content:
      "Parse the following into the JSON schema.\n" +
      (input.meta ? `\nUse this metadata when relevant: ${JSON.stringify(input.meta)}\n` : "\n") +
      "CONTENT START\n" +
      input.text +
      "\nCONTENT END",
  };

  const parsed = await ollamaChatToJson([system, user]);
  return coerceDraft(parsed);
}

export async function parseRecipeFromJsonLdWithLocalAi(input: { json: any; meta?: ParsedRecipeMeta }): Promise<ParsedRecipeDraft> {
  const system: OllamaChatMessage = {
    role: "system",
    content:
      "You convert structured recipe data (often JSON-LD) into our app's normalized recipe schema.\n" +
      RECIPE_SCHEMA_INSTRUCTION +
      "\n" +
      RECIPE_RULES,
  };

  const user: OllamaChatMessage = {
    role: "user",
    content:
      "Convert this structured data into the JSON schema. Do not include irrelevant blog text.\n" +
      (input.meta ? `\nMetadata: ${JSON.stringify(input.meta)}\n` : "\n") +
      "JSON START\n" +
      JSON.stringify(input.json) +
      "\nJSON END",
  };

  const parsed = await ollamaChatToJson([system, user]);
  return coerceDraft(parsed);
}

