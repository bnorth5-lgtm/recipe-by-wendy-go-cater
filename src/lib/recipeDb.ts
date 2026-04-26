import initSqlJs, { type Database } from "sql.js";
import { get as idbGet, set as idbSet } from "idb-keyval";
import type { Recipe } from "@/store/cateringStore";

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
       currency, costPerServing, importedBaseCost, baseCost, source, comments
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
         comments=excluded.comments`,
      [
        recipe.id,
        recipe.name,
        recipe.description,
        recipe.prepTime,
        recipe.cookTime,
        recipe.servings,
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
    id: String(v[idIdx]),
    name: String(v[nameIdx]),
    description: String(v[descIdx]),
    prepTime: String(v[prepIdx]),
    cookTime: String(v[cookIdx]),
    servings: String(v[servingsIdx]),
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
    ingredients: ingredientsById.get(String(v[idIdx])) ?? [],
    instructions: instructionsById.get(String(v[idIdx])) ?? [],
  }));
}

