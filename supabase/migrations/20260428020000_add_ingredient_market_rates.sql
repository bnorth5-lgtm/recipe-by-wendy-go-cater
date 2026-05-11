-- Ingredient-level market rates — Live Market Rate badge source
-- Delicious Catering & Events — 2026-04-28
--
-- Adds per-unit purchase-price rows to `competitor_pricing` using
-- category = 'ingredient_rate'.  These are the wholesale / foodservice
-- market rates that the Live Market Rate badge displays next to
-- individual recipe ingredients in the Recipes UI.
--
-- Naming convention: item_name matches common catering ingredient names
-- so that the fuzzy matcher in competitorPricing.ts can join them
-- against RecipeIngredient.name at display time.
--
-- Prices reflect US foodservice market averages (2026).

INSERT INTO public.competitor_pricing
  (item_name, category, price_per_unit, unit, competitor_name, region, notes)
VALUES
  -- ── Premium seafood ────────────────────────────────────────────────
  ('Lobster Tail',        'ingredient_rate',  22.50, 'lb',   'US Foods Market',    'local', 'Cold-water lobster tails, frozen'),
  ('Lobster Tail',        'ingredient_rate',  28.00, 'lb',   'Sysco Premium',      'local', 'Fresh Maine lobster tails'),
  ('King Crab',           'ingredient_rate',  35.00, 'lb',   'US Foods Market',    'local', 'Alaskan king crab legs, frozen'),
  ('Dungeness Crab',      'ingredient_rate',  24.00, 'lb',   'Local Seafood Co.',  'local', 'Whole Dungeness crab'),
  ('Sea Scallops',        'ingredient_rate',  18.00, 'lb',   'US Foods Market',    'local', 'U-10 dry sea scallops'),
  ('Jumbo Shrimp',        'ingredient_rate',  14.50, 'lb',   'US Foods Market',    'local', '16-20 ct jumbo shrimp, peeled'),
  ('Shrimp',              'ingredient_rate',  11.00, 'lb',   'US Foods Market',    'local', '21-25 ct shrimp, peeled & deveined'),
  ('Salmon',              'ingredient_rate',  12.00, 'lb',   'US Foods Market',    'local', 'Atlantic salmon fillets'),
  ('Halibut',             'ingredient_rate',  19.00, 'lb',   'Sysco Premium',      'local', 'Pacific halibut fillets'),
  ('Tuna',                'ingredient_rate',  16.00, 'lb',   'US Foods Market',    'local', 'Ahi tuna, sashimi grade'),
  ('Swordfish',           'ingredient_rate',  14.00, 'lb',   'US Foods Market',    'local', 'Swordfish steaks'),
  ('Branzino',            'ingredient_rate',  15.00, 'lb',   'Sysco Premium',      'local', 'Mediterranean sea bass, whole'),
  ('Oysters',             'ingredient_rate',   1.80, 'each', 'Local Seafood Co.',  'local', 'Live oysters, market size'),
  ('Mussels',             'ingredient_rate',   3.50, 'lb',   'US Foods Market',    'local', 'PEI mussels, live'),
  ('Clams',               'ingredient_rate',   4.00, 'lb',   'US Foods Market',    'local', 'Littleneck clams, live'),

  -- ── Premium / seasonal meats ───────────────────────────────────────
  ('Beef Tenderloin',     'ingredient_rate',  32.00, 'lb',   'Sysco Premium',      'local', 'USDA Choice whole beef tenderloin'),
  ('Filet Mignon',        'ingredient_rate',  38.00, 'lb',   'Sysco Premium',      'local', 'USDA Prime 8 oz filet mignon portions'),
  ('Wagyu Beef',          'ingredient_rate',  85.00, 'lb',   'Specialty Imports',  'local', 'American Wagyu strip steak, BMS 6+'),
  ('Prime Rib',           'ingredient_rate',  18.00, 'lb',   'US Foods Market',    'local', 'USDA Choice standing rib roast'),
  ('Beef',                'ingredient_rate',  10.00, 'lb',   'US Foods Market',    'local', 'USDA Select beef tips / sirloin'),
  ('Rack of Lamb',        'ingredient_rate',  28.00, 'lb',   'Sysco Premium',      'local', 'Frenched rack of lamb, domestic'),
  ('Lamb Chop',           'ingredient_rate',  24.00, 'lb',   'US Foods Market',    'local', 'Loin lamb chops'),
  ('Lamb',                'ingredient_rate',  20.00, 'lb',   'US Foods Market',    'local', 'Lamb leg / shoulder, bone-in'),
  ('Duck Breast',         'ingredient_rate',  18.00, 'lb',   'Sysco Premium',      'local', 'Moulard duck breast, magret'),
  ('Duck',                'ingredient_rate',  14.00, 'lb',   'US Foods Market',    'local', 'Whole duck, 5-6 lb'),
  ('Chicken Breast',      'ingredient_rate',   5.50, 'lb',   'US Foods Market',    'local', 'Boneless skinless chicken breast'),
  ('Chicken',             'ingredient_rate',   3.80, 'lb',   'US Foods Market',    'local', 'Whole chicken, 4-5 lb'),
  ('Pork Tenderloin',     'ingredient_rate',   7.00, 'lb',   'US Foods Market',    'local', 'Fresh pork tenderloin'),
  ('Veal Chop',           'ingredient_rate',  30.00, 'lb',   'Sysco Premium',      'local', 'Bone-in veal rib chop'),
  ('Bison',               'ingredient_rate',  22.00, 'lb',   'Specialty Imports',  'local', 'Ground bison / bison steaks'),
  ('Venison',             'ingredient_rate',  26.00, 'lb',   'Specialty Imports',  'local', 'New Zealand venison loin'),

  -- ── Luxury / specialty ingredients ────────────────────────────────
  ('Truffle',             'ingredient_rate', 180.00, 'oz',   'Specialty Imports',  'local', 'Black truffle, fresh seasonal (Périgord)'),
  ('White Truffle',       'ingredient_rate', 350.00, 'oz',   'Specialty Imports',  'local', 'Alba white truffle, seasonal'),
  ('Foie Gras',           'ingredient_rate',  65.00, 'lb',   'Specialty Imports',  'local', 'Duck foie gras, grade A whole lobe'),
  ('Saffron',             'ingredient_rate',  12.00, 'g',    'Specialty Imports',  'local', 'Spanish saffron, premium grade'),
  ('Caviar',              'ingredient_rate', 120.00, 'oz',   'Specialty Imports',  'local', 'American sturgeon caviar'),
  ('Burrata',             'ingredient_rate',  12.00, 'lb',   'Specialty Imports',  'local', 'Fresh burrata, imported Italian-style'),
  ('Imported Cheese',     'ingredient_rate',  16.00, 'lb',   'Sysco Premium',      'local', 'Assorted imported cheese (Gruyère, manchego, etc.)'),
  ('Parmesan',            'ingredient_rate',  14.00, 'lb',   'US Foods Market',    'local', 'Parmigiano-Reggiano DOP, wedge'),
  ('Prosciutto',          'ingredient_rate',  22.00, 'lb',   'Specialty Imports',  'local', 'Prosciutto di Parma, sliced'),

  -- ── Seasonal produce ──────────────────────────────────────────────
  ('Asparagus',           'ingredient_rate',   4.50, 'lb',   'Sysco Premium',      'local', 'Jumbo asparagus spears, fresh'),
  ('Heirloom Tomato',     'ingredient_rate',   5.00, 'lb',   'Local Farm Co.',     'local', 'Mixed heirloom tomatoes, peak season'),
  ('Baby Arugula',        'ingredient_rate',   6.00, 'lb',   'Sysco Premium',      'local', 'Fresh organic baby arugula'),
  ('Microgreens',         'ingredient_rate',  18.00, 'lb',   'Specialty Produce',  'local', 'Mixed microgreens, chef blend'),
  ('Morel Mushrooms',     'ingredient_rate',  45.00, 'lb',   'Specialty Imports',  'local', 'Fresh morel mushrooms, spring seasonal'),
  ('Chanterelle',         'ingredient_rate',  22.00, 'lb',   'Specialty Imports',  'local', 'Wild chanterelle mushrooms'),
  ('Porcini',             'ingredient_rate',  35.00, 'lb',   'Specialty Imports',  'local', 'Fresh porcini mushrooms, seasonal'),
  ('Artichoke',           'ingredient_rate',   3.50, 'each', 'Sysco Premium',      'local', 'Jumbo artichoke hearts, whole'),
  ('Fiddlehead Ferns',    'ingredient_rate',  12.00, 'lb',   'Local Farm Co.',     'local', 'Spring fiddlehead ferns, seasonal'),

  -- ── Pantry staples (high-traffic catering items) ──────────────────
  ('Butter',              'ingredient_rate',   5.50, 'lb',   'US Foods Market',    'local', 'Grade AA unsalted butter'),
  ('Heavy Cream',         'ingredient_rate',   3.80, 'qt',   'US Foods Market',    'local', 'Heavy whipping cream'),
  ('Eggs',                'ingredient_rate',   4.50, 'dozen','US Foods Market',    'local', 'Large grade A eggs'),
  ('Olive Oil',           'ingredient_rate',  18.00, 'gal',  'Sysco Premium',      'local', 'Extra virgin olive oil, Spanish')
ON CONFLICT DO NOTHING;
