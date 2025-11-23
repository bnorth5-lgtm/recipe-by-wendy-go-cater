"use client";

import { MadeWithDyad } from "@/components/made-with-dyad";

const Ingredients = () => {
  return (
    <div className="min-h-full flex flex-col items-center bg-background text-foreground p-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">Ingredients Management</h1>
        <p className="text-xl text-muted-foreground">
          Manage your raw ingredients, suppliers, and inventory levels here.
        </p>
      </div>

      <div className="w-full max-w-4xl space-y-8">
        {/* Proteins & Meats */}
        <section className="bg-card p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4 text-primary">Proteins & Meats</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <h3 className="text-lg font-medium mb-2">Poultry</h3>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Chicken breast, chicken thighs, turkey breast, ground chicken.</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-2">Beef</h3>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Roast beef (sirloin, tenderloin), ground beef, steak (flank, skirt), short ribs.</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-2">Pork</h3>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Pulled pork, bacon, ham, sausage, pork shoulder.</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-2">Seafood</h3>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Salmon, shrimp, cod, smoked salmon, tuna, oysters.</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-2">Vegetarian/Vegan</h3>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Tofu, tempeh, chickpeas, black beans, lentils, nutritional yeast.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Grains, Starches, & Flours */}
        <section className="bg-card p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4 text-primary">🌾 Grains, Starches, & Flours</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <h3 className="text-lg font-medium mb-2">Grains</h3>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Rice (white, brown, wild), quinoa, couscous, farro, oats.</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-2">Starches</h3>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Potatoes (russet, red, sweet), pasta (penne, spaghetti, lasagna sheets), corn, cornstarch.</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-2">Flours/Baking</h3>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>All-purpose flour, bread flour, cornmeal, breadcrumbs, baking powder, baking soda.</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-2">Breads</h3>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Slider buns, various rolls, baguettes, tortillas, pita bread.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Dairy & Cheeses */}
        <section className="bg-card p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4 text-primary">🧀 Dairy & Cheeses</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium mb-2">Dairy</h3>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Milk, butter, heavy cream, sour cream, yogurt (plain, Greek), eggs.</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-2">Cheeses (Hard/Aged)</h3>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Parmesan, Gruyère, aged cheddar.</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-2">Cheeses (Soft/Fresh)</h3>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Mozzarella, feta, goat cheese, cream cheese, ricotta, brie.</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-2">Sauces/Mixes</h3>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Cheddar cheese sauce mix, dry milk.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Fresh Produce (Fruits & Vegetables) */}
        <section className="bg-card p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4 text-primary">🥦 Fresh Produce (Fruits & Vegetables)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium mb-2">Vegetables</h3>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Greens: Mixed salad greens, spinach, romaine lettuce, kale, cabbage.</li>
                <li>Root Vegetables: Carrots, onions (red, white, yellow), garlic, beets, radishes.</li>
                <li>Cruciferous/Fruiting Veg: Broccoli, cauliflower, bell peppers (assorted colors), zucchini, eggplant, mushrooms.</li>
                <li>Alliums: Scallions, leeks, shallots, chives.</li>
                <li>Dips/Sides: Potatoes, celery, cucumbers (for veggie platters), avocados.</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-2">Fruits</h3>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Berries: Strawberries, blueberries, raspberries, blackberries.</li>
                <li>Citrus: Lemons, limes, oranges, grapefruits.</li>
                <li>Other: Apples, bananas, grapes, melon (watermelon, cantaloupe), peaches, pineapple, tomatoes (botanically a fruit!).</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Pantry Staples & Spices */}
        <section className="bg-card p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4 text-primary">🥫 Pantry Staples & Spices</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <h3 className="text-lg font-medium mb-2">Oils, Fats, & Liquids</h3>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Olive oil (extra virgin and regular), vegetable oil, canola oil, sesame oil, vinegar (balsamic, red wine, white wine, apple cider), soy sauce, vegetable/chicken/beef broth.</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-2">Spices & Herbs</h3>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Salt (kosher, sea), black pepper, granulated garlic, granulated onion, dried parsley, oregano, cumin, chili powder, paprika (smoked/sweet), cinnamon, nutmeg, bay leaves.</li>
                <li>Fresh Herbs: Basil, mint, rosemary, thyme, cilantro, dill.</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-2">Condiments & Sauces</h3>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Mayonnaise, mustard (Dijon, yellow), ketchup, BBQ sauce, hot sauce (like Cayenne pepper sauce), honey, maple syrup, chocolate syrup.</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-2">Baking/Dessert</h3>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Sugar (granulated, brown, powdered), vanilla extract, chocolate chips, cocoa powder, nuts (almonds, walnuts, pecans), raisins, dried cranberries.</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-2">Canned/Jarred</h3>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Canned tomatoes, tomato paste, olives, capers, pickles/relish, dried fruits.</li>
              </ul>
            </div>
          </div>
        </section>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default Ingredients;