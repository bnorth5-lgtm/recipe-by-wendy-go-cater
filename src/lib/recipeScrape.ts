function safeJsonParse(text: string): any | null {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function asArray<T>(v: T | T[] | undefined | null): T[] {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}

function normalizeJsonLdGraph(root: any): any[] {
  // JSON-LD can be:
  // - object with @graph
  // - array of objects
  // - single object
  const graph = root?.["@graph"];
  if (Array.isArray(graph)) return graph;
  if (Array.isArray(root)) return root;
  if (root && typeof root === "object") return [root];
  return [];
}

function hasRecipeType(node: any): boolean {
  const t = node?.["@type"];
  const types = asArray<string>(t).map((x) => String(x).toLowerCase());
  return types.includes("recipe");
}

function pickFirstRecipeNode(nodes: any[]): any | null {
  for (const n of nodes) {
    if (hasRecipeType(n)) return n;
  }
  return null;
}

export type ScrapedRecipeJsonLd = {
  recipe: any;
  allLdJson: any[];
  sourceTitle?: string;
  sourceSite?: string;
  sourceAuthor?: string;
};

export async function fetchJsonLdRecipeFromUrl(url: string): Promise<ScrapedRecipeJsonLd> {
  const res = await fetch(url, {
    method: "GET",
    headers: {
      // Helps some sites serve readable HTML.
      Accept: "text/html,application/xhtml+xml",
    },
  });

  if (!res.ok) {
    throw new Error(`URL fetch failed (${res.status}).`);
  }

  const html = await res.text();
  const doc = new DOMParser().parseFromString(html, "text/html");

  const title = doc.querySelector("title")?.textContent?.trim() || undefined;
  const host = (() => {
    try {
      return new URL(url).hostname;
    } catch {
      return undefined;
    }
  })();

  const scripts = Array.from(doc.querySelectorAll('script[type="application/ld+json"]'));
  const ldJson: any[] = [];
  for (const s of scripts) {
    const raw = s.textContent?.trim();
    if (!raw) continue;
    const parsed = safeJsonParse(raw);
    if (!parsed) continue;
    ldJson.push(parsed);
  }

  const flattened: any[] = [];
  for (const item of ldJson) {
    flattened.push(...normalizeJsonLdGraph(item));
  }

  // Some pages embed WebPage + mainEntity: Recipe
  let recipe = pickFirstRecipeNode(flattened);
  if (!recipe) {
    for (const n of flattened) {
      const main = n?.mainEntity ?? n?.mainEntityOfPage;
      const mainArr = asArray<any>(main);
      const mainRecipe = pickFirstRecipeNode(mainArr);
      if (mainRecipe) {
        recipe = mainRecipe;
        break;
      }
    }
  }

  if (!recipe) {
    throw new Error(
      "No JSON-LD Recipe found on that page. If the site blocks browser access (CORS) or doesn't publish Recipe JSON, try Magic Paste instead."
    );
  }

  const author = (() => {
    const a = recipe?.author;
    const first = asArray<any>(a)[0];
    if (typeof first === "string") return first;
    const name = first?.name;
    return name ? String(name) : undefined;
  })();

  return {
    recipe,
    allLdJson: ldJson,
    sourceTitle: title,
    sourceSite: host,
    sourceAuthor: author,
  };
}

