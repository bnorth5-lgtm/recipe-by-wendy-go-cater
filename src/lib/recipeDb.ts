import initSqlJs, { type Database } from "sql.js";
import { get as idbGet, set as idbSet } from "idb-keyval";
import {
  type Recipe,
  type Quantity,
  type LegacyMetadata,
  ensureUUID,
  parseTimeQuantity,
  parseServingQuantity,
} from "@/store/cateringStore";

// ---------------------------------------------------------------------------
// Quantity serialization helpers
// ---------------------------------------------------------------------------

function serializeQuantity(q: Quantity): string {
  return JSON.stringify(q);
}

/**
 * Deserialize a Quantity stored as JSON in SQLite.
 * Falls back to parsing old plain-string values (e.g. "30 mins", "8 servings")
 * left in existing local vaults before this schema migration.
 */
function deserializeTimeQuantity(raw: unknown): Quantity {
  if (!raw) return { value: 0, unit: "min" };
  const s = String(raw);
  try {
    const parsed = JSON.parse(s);
    if (typeof parsed?.value === "number" && typeof parsed?.unit === "string") {
      return parsed as Quantity;
    }
  } catch { /* fall through to legacy parse */ }
  return parseTimeQuantity(s);
}

function deserializeServingQuantity(raw: unknown): Quantity {
  if (!raw) return { value: 4, unit: "servings" };
  const s = String(raw);
  try {
    const parsed = JSON.parse(s);
    if (typeof parsed?.value === "number" && typeof parsed?.unit === "string") {
      return parsed as Quantity;
    }
  } catch { /* fall through to legacy parse */ }
  return parseServingQuantity(s);
}

function serializeLegacyMetadata(meta: LegacyMetadata | undefined): string | null {
  return meta ? JSON.stringify(meta) : null;
}

function deserializeLegacyMetadata(raw: unknown): LegacyMetadata | undefined {
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(String(raw));
    return typeof parsed === "object" && parsed !== null
      ? (parsed as LegacyMetadata)
      : undefined;
  } catch {
    return undefined;
  }
}

const DB_IDB_KEY = "catering-by-wendy.sqlite";

let dbPromise: Promise<Database> | null = null;

async function loadDbBytes(): Promise<Uint8Array | undefined> {
  const bytes = await idbGet<Uint8Array>(DB_IDB_KEY);
  return bytes ?? undefined;
}

async function saveDbBytes(bytes: Uint8Array): Promise<void> {
  await idbSet(DB_IDB_KEY, bytes);
}

function ensureSchema(db: Database) {
  db.run(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS recipes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      prepTime TEXT NOT NULL,
      cookTime TEXT NOT NULL,
      servings TEXT NOT NULL,
      category TEXT NOT NULL,
      sourceUrl TEXT,
      sourceType TEXT,
      sourceSite TEXT,
      sourceTitle TEXT,
      sourceAuthor TEXT,
      importMethod TEXT,
      importedAt TEXT,
      sourceJson TEXT,
      currency TEXT NOT NULL DEFAULT 'USD',
      costPerServing REAL,
      importedBaseCost REAL,
      baseCost REAL NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS recipe_ingredients (
      recipeId TEXT NOT NULL,
      name TEXT NOT NULL,
      quantity REAL NOT NULL,
      unit TEXT NOT NULL,
      idx INTEGER NOT NULL,
      PRIMARY KEY (recipeId, idx),
      FOREIGN KEY (recipeId) REFERENCES recipes(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS recipe_instructions (
      recipeId TEXT NOT NULL,
      step TEXT NOT NULL,
      idx INTEGER NOT NULL,
      PRIMARY KEY (recipeId, idx),
      FOREIGN KEY (recipeId) REFERENCES recipes(id) ON DELETE CASCADE
    );
  `);

  // Backward-safe migrations for existing local DBs.
  const info = db.exec("PRAGMA table_info(recipes)");
  const existingCols = new Set<string>();
  if (info.length) {
    // columns: cid, name, type, notnull, dflt_value, pk
    for (const row of info[0].values) {
      existingCols.add(String(row[1]));
    }
  }

  const addCol = (name: string, ddl: string) => {
    if (!existingCols.has(name)) {
      db.run(`ALTER TABLE recipes ADD COLUMN ${ddl}`);
      existingCols.add(name);
    }
  };

  addCol("sourceType", "sourceType TEXT");
  addCol("sourceSite", "sourceSite TEXT");
  addCol("sourceTitle", "sourceTitle TEXT");
  addCol("sourceAuthor", "sourceAuthor TEXT");
  addCol("importMethod", "importMethod TEXT");
  addCol("importedAt", "importedAt TEXT");
  addCol("sourceJson", "sourceJson TEXT");
  addCol("currency", "currency TEXT NOT NULL DEFAULT 'USD'");
  addCol("costPerServing", "costPerServing REAL");
  addCol("importedBaseCost", "importedBaseCost REAL");
  addCol("source", "source TEXT");
  addCol("comments", "comments TEXT");
  addCol("legacyMetadata", "legacyMetadata TEXT");

  // Subscriber usage tracking (local mirror of cloud table)
  db.run(`
    CREATE TABLE IF NOT EXISTS subscriber_usage (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      feature TEXT NOT NULL,
      tierAtTime TEXT NOT NULL,
      accessedAt TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_sub_usage_user ON subscriber_usage(userId);
    CREATE INDEX IF NOT EXISTS idx_sub_usage_at ON subscriber_usage(accessedAt);
  `);

  // Subscriber profiles (local cache of cloud subscriber_profiles)
  db.run(`
    CREATE TABLE IF NOT EXISTS subscriber_profiles (
      userId TEXT PRIMARY KEY,
      email TEXT,
      tier TEXT NOT NULL DEFAULT 'basic',
      subscribedAt TEXT,
      isActive INTEGER NOT NULL DEFAULT 1,
      updatedAt TEXT NOT NULL
    );
  `);
}

async function getDb(): Promise<Database> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const SQL = await initSqlJs({
        // sql.js loads the wasm asset relative to the app origin.
        locateFile: (file) => `/${file}`,
      });
      const existing = await loadDbBytes();
      const db = existing ? new SQL.Database(existing) : new SQL.Database();
      ensureSchema(db);
      return db;
    })();
  }
  return dbPromise;
}

async function persistDb(db: Database) {
  const bytes = db.export();
  await saveDbBytes(bytes);
}

export async function upsertRecipe(recipe: Recipe): Promise<void> {
  const db = await getDb();
  db.run("BEGIN");
  try {
    db.run(
      `INSERT INTO recipes (
         id, name, description, prepTime, cookTime, servings, category,
         sourceUrl, sourceType, sourceSite, sourceTitle, sourceAuthor,
         importMethod, importedAt, sourceJson,
         currency, costPerServing, importedBaseCost, baseCost, source, comments,
         legacyMetadata
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         name=excluded.name,
         description=excluded.description,
         prepTime=excluded.prepTime,
         cookTime=excluded.cookTime,
         servings=excluded.servings,
         category=excluded.category,
         sourceUrl=excluded.sourceUrl,
         sourceType=excluded.sourceType,
         sourceSite=excluded.sourceSite,
         sourceTitle=excluded.sourceTitle,
         sourceAuthor=excluded.sourceAuthor,
         importMethod=excluded.importMethod,
         importedAt=excluded.importedAt,
         sourceJson=excluded.sourceJson,
         currency=excluded.currency,
         costPerServing=excluded.costPerServing,
         importedBaseCost=excluded.importedBaseCost,
         baseCost=excluded.baseCost,
         source=excluded.source,
         comments=excluded.comments,
         legacyMetadata=excluded.legacyMetadata`,
      [
        ensureUUID(recipe.id),
        recipe.name,
        recipe.description,
        serializeQuantity(recipe.prepTime),
        serializeQuantity(recipe.cookTime),
        serializeQuantity(recipe.servings),
        recipe.category,
        recipe.sourceUrl ?? null,
        recipe.sourceType ?? null,
        recipe.sourceSite ?? null,
        recipe.sourceTitle ?? null,
        recipe.sourceAuthor ?? null,
        recipe.importMethod ?? null,
        recipe.importedAt ?? null,
        recipe.sourceJson ? JSON.stringify(recipe.sourceJson) : null,
        recipe.currency ?? "USD",
        recipe.costPerServing ?? null,
        recipe.importedBaseCost ?? null,
        recipe.baseCost ?? 0,
        recipe.source ?? null,
        recipe.comments ?? null,
        serializeLegacyMetadata(recipe.legacyMetadata),
      ]
    );

    db.run("DELETE FROM recipe_ingredients WHERE recipeId = ?", [recipe.id]);
    recipe.ingredients.forEach((ing, idx) => {
      db.run(
        "INSERT INTO recipe_ingredients (recipeId, name, quantity, unit, idx) VALUES (?, ?, ?, ?, ?)",
        [recipe.id, ing.name, ing.quantity, ing.unit, idx]
      );
    });

    db.run("DELETE FROM recipe_instructions WHERE recipeId = ?", [recipe.id]);
    recipe.instructions.forEach((ins, idx) => {
      db.run(
        "INSERT INTO recipe_instructions (recipeId, step, idx) VALUES (?, ?, ?)",
        [recipe.id, ins.step, idx]
      );
    });

    db.run("COMMIT");
  } catch (e) {
    db.run("ROLLBACK");
    throw e;
  }

  await persistDb(db);
}

export async function deleteRecipeById(id: string): Promise<void> {
  const db = await getDb();
  db.run("DELETE FROM recipes WHERE id = ?", [id]);
  await persistDb(db);
}

// ---------- Subscriber usage ----------

export interface UsageLog {
  id: string;
  userId: string;
  feature: string;
  tierAtTime: string;
  accessedAt: string;
}

export async function logUsage(
  userId: string,
  feature: string,
  tierAtTime: string
): Promise<void> {
  const db = await getDb();
  db.run(
    "INSERT INTO subscriber_usage (id, userId, feature, tierAtTime, accessedAt) VALUES (?, ?, ?, ?, ?)",
    [crypto.randomUUID(), userId, feature, tierAtTime, new Date().toISOString()]
  );
  await persistDb(db);
}

export async function getUsageLogs(userId?: string): Promise<UsageLog[]> {
  const db = await getDb();
  const res = userId
    ? db.exec(
        "SELECT id, userId, feature, tierAtTime, accessedAt FROM subscriber_usage WHERE userId = ? ORDER BY accessedAt DESC LIMIT 200",
        [userId]
      )
    : db.exec(
        "SELECT id, userId, feature, tierAtTime, accessedAt FROM subscriber_usage ORDER BY accessedAt DESC LIMIT 200"
      );
  if (!res.length) return [];
  return res[0].values.map((v) => ({
    id: String(v[0]),
    userId: String(v[1]),
    feature: String(v[2]),
    tierAtTime: String(v[3]),
    accessedAt: String(v[4]),
  }));
}

// ---------- Subscriber profiles ----------

export interface SubscriberProfile {
  userId: string;
  email: string | null;
  tier: string;
  subscribedAt: string | null;
  isActive: boolean;
  updatedAt: string;
}

export async function upsertSubscriberProfile(profile: Omit<SubscriberProfile, "updatedAt">): Promise<void> {
  const db = await getDb();
  db.run(
    `INSERT INTO subscriber_profiles (userId, email, tier, subscribedAt, isActive, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(userId) DO UPDATE SET
       email=excluded.email,
       tier=excluded.tier,
       subscribedAt=excluded.subscribedAt,
       isActive=excluded.isActive,
       updatedAt=excluded.updatedAt`,
    [
      profile.userId,
      profile.email ?? null,
      profile.tier,
      profile.subscribedAt ?? null,
      profile.isActive ? 1 : 0,
      new Date().toISOString(),
    ]
  );
  await persistDb(db);
}

export async function getSubscriberProfile(userId: string): Promise<SubscriberProfile | null> {
  const db = await getDb();
  const res = db.exec(
    "SELECT userId, email, tier, subscribedAt, isActive, updatedAt FROM subscriber_profiles WHERE userId = ?",
    [userId]
  );
  if (!res.length || !res[0].values.length) return null;
  const v = res[0].values[0];
  return {
    userId: String(v[0]),
    email: v[1] ? String(v[1]) : null,
    tier: String(v[2]),
    subscribedAt: v[3] ? String(v[3]) : null,
    isActive: v[4] === 1 || v[4] === "1",
    updatedAt: String(v[5]),
  };
}

// ---------- Recipes ----------

export async function getAllRecipes(): Promise<Recipe[]> {
  const db = await getDb();
  const recipesRes = db.exec("SELECT * FROM recipes ORDER BY name COLLATE NOCASE ASC");
  if (!recipesRes.length) return [];
  const [rows] = recipesRes;
  const cols = rows.columns;

  const idIdx = cols.indexOf("id");
  const nameIdx = cols.indexOf("name");
  const descIdx = cols.indexOf("description");
  const prepIdx = cols.indexOf("prepTime");
  const cookIdx = cols.indexOf("cookTime");
  const servingsIdx = cols.indexOf("servings");
  const catIdx = cols.indexOf("category");
  const sourceIdx = cols.indexOf("sourceUrl");
  const sourceTypeIdx = cols.indexOf("sourceType");
  const sourceSiteIdx = cols.indexOf("sourceSite");
  const sourceTitleIdx = cols.indexOf("sourceTitle");
  const sourceAuthorIdx = cols.indexOf("sourceAuthor");
  const importMethodIdx = cols.indexOf("importMethod");
  const importedAtIdx = cols.indexOf("importedAt");
  const sourceJsonIdx = cols.indexOf("sourceJson");
  const currencyIdx = cols.indexOf("currency");
  const cpsIdx = cols.indexOf("costPerServing");
  const importedBaseCostIdx = cols.indexOf("importedBaseCost");
  const baseIdx = cols.indexOf("baseCost");
  const citationSourceIdx = cols.indexOf("source");
  const familyCommentsIdx = cols.indexOf("comments");
  const legacyMetaIdx = cols.indexOf("legacyMetadata");

  const recipeIds = rows.values.map((v) => String(v[idIdx]));
  const ingredientsById = new Map<string, Recipe["ingredients"]>();
  const instructionsById = new Map<string, Recipe["instructions"]>();

  if (recipeIds.length) {
    const placeholders = recipeIds.map(() => "?").join(",");
    const ingRes = db.exec(
      `SELECT recipeId, name, quantity, unit, idx FROM recipe_ingredients WHERE recipeId IN (${placeholders}) ORDER BY recipeId, idx`,
      recipeIds
    );
    if (ingRes.length) {
      for (const row of ingRes[0].values) {
        const recipeId = String(row[0]);
        const list = ingredientsById.get(recipeId) ?? [];
        list.push({
          name: String(row[1]),
          quantity: Number(row[2]),
          unit: String(row[3]),
        });
        ingredientsById.set(recipeId, list);
      }
    }

    const insRes = db.exec(
      `SELECT recipeId, step, idx FROM recipe_instructions WHERE recipeId IN (${placeholders}) ORDER BY recipeId, idx`,
      recipeIds
    );
    if (insRes.length) {
      for (const row of insRes[0].values) {
        const recipeId = String(row[0]);
        const list = instructionsById.get(recipeId) ?? [];
        list.push({ step: String(row[1]) });
        instructionsById.set(recipeId, list);
      }
    }
  }

  return rows.values.map((v) => ({
    id: ensureUUID(String(v[idIdx])),
    name: String(v[nameIdx]),
    description: String(v[descIdx]),
    prepTime: deserializeTimeQuantity(v[prepIdx]),
    cookTime: deserializeTimeQuantity(v[cookIdx]),
    servings: deserializeServingQuantity(v[servingsIdx]),
    category: v[catIdx] as Recipe["category"],
    sourceUrl: v[sourceIdx] ? String(v[sourceIdx]) : undefined,
    sourceType: sourceTypeIdx >= 0 && v[sourceTypeIdx] ? String(v[sourceTypeIdx]) : undefined,
    sourceSite: sourceSiteIdx >= 0 && v[sourceSiteIdx] ? String(v[sourceSiteIdx]) : undefined,
    sourceTitle: sourceTitleIdx >= 0 && v[sourceTitleIdx] ? String(v[sourceTitleIdx]) : undefined,
    sourceAuthor: sourceAuthorIdx >= 0 && v[sourceAuthorIdx] ? String(v[sourceAuthorIdx]) : undefined,
    importMethod: importMethodIdx >= 0 && v[importMethodIdx] ? String(v[importMethodIdx]) : undefined,
    importedAt: importedAtIdx >= 0 && v[importedAtIdx] ? String(v[importedAtIdx]) : undefined,
    sourceJson:
      sourceJsonIdx >= 0 && v[sourceJsonIdx]
        ? (() => {
            try {
              return JSON.parse(String(v[sourceJsonIdx]));
            } catch {
              return undefined;
            }
          })()
        : undefined,
    currency: currencyIdx >= 0 && v[currencyIdx] ? String(v[currencyIdx]) : "USD",
    costPerServing: cpsIdx >= 0 && v[cpsIdx] != null ? Number(v[cpsIdx]) : undefined,
    importedBaseCost:
      importedBaseCostIdx >= 0 && v[importedBaseCostIdx] != null ? Number(v[importedBaseCostIdx]) : undefined,
    baseCost: Number(v[baseIdx] ?? 0),
    source: citationSourceIdx >= 0 && v[citationSourceIdx] ? String(v[citationSourceIdx]) : undefined,
    comments: familyCommentsIdx >= 0 && v[familyCommentsIdx] ? String(v[familyCommentsIdx]) : undefined,
    legacyMetadata: legacyMetaIdx >= 0 ? deserializeLegacyMetadata(v[legacyMetaIdx]) : undefined,
    ingredients: ingredientsById.get(String(v[idIdx])) ?? [],
    instructions: instructionsById.get(String(v[idIdx])) ?? [],
  }));
}

