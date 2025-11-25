"use client";

import { MadeWithDyad } from "@/components/made-with-dyad";
import { Link } from "react-router-dom"; // Import Link

const Ingredients = () => {
  // Helper function to render a list of items with links
  const renderIngredientList = (items: string[]) => (
    <ul className="list-disc list-inside space-y-1 text-muted-foreground"> {/* Reduced space-y-2 to space-y-1 */}
      {items.map((item, index) => (
        <li key={index} className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <span className="mb-1 sm:mb-0">{item}</span>
          <div className="flex flex-wrap gap-2 mt-1 sm:mt-0">
            <Link to="/menu/inventory" className="text-xs text-blue-500 hover:underline">
              Inventory
            </Link>
            <Link to="/quoting/estimates" className="text-xs text-green-500 hover:underline">
              Add to Quote
            </Link>
            <Link to="/menu/recipes" className="text-xs text-purple-500 hover:underline">
              Find Recipes
            </Link>
          </div>
        </li>
      ))}
    </ul>
  );

  return (
    <div className="min-h-full flex flex-col items-center bg-background text-foreground p-2"> {/* Reduced p-4 to p-2 */}
      <div className="text-center mb-4"> {/* Reduced mb-6 to mb-4 */}
        <h1 className="text-4xl font-bold mb-2">Ingredients Management</h1> {/* Reduced mb-4 to mb-2 */}
        <p className="text-xl text-muted-foreground">
          Manage your raw ingredients, suppliers, and inventory levels here.
        </p>
      </div>

      <div className="w-full max-w-4xl space-y-4"> {/* Reduced space-y-6 to space-y-4 */}
        {/* Proteins & Meats */}
        <section className="bg-card p-3 rounded-lg shadow-md"> {/* Reduced p-4 to p-3 */}
          <h2 className="text-2xl font-semibold mb-2 text-primary">Proteins & Meats</h2> {/* Reduced mb-3 to mb-2 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"> {/* Reduced gap-6 to gap-4 */}
            <div>
              <h3 className="text-lg font-medium mb-1">Poultry</h3> {/* Reduced mb-2 to mb-1 */}
              {renderIngredientList([
                "Chicken Breast", "Chicken Half", "Whole Chicken", "Chicken Thighs", "Chicken Wings", "Ground Chicken", "Turkey Breast"
              ])}
            </div>
            <div>
              <h3 className="text-lg font-medium mb-1">Beef</h3> {/* Reduced mb-2 to mb-1 */}
              {renderIngredientList([
                "Beef Sirloin", "Beef Tenderloin", "Porterhouse Steak (16oz)", "Filet Mignon (8oz)", "Filet Mignon (12oz)", "Top Round Roast", "Strip Steak (12oz)", "Strip Steak (16oz)", "Rib-Eye Steak (16oz)", "Ground Beef (80/20)"
              ])}
            </div>
            <div>
              <h3 className="text-lg font-medium mb-1">Pork</h3> {/* Reduced mb-2 to mb-1 */}
              {renderIngredientList(["Pork Loin", "Pulled Pork", "Bacon", "Ham", "Sausage", "Pork Shoulder"])}
            </div>
            <div>
              <h3 className="text-lg font-medium mb-1">Seafood</h3> {/* Reduced mb-2 to mb-1 */}
              {renderIngredientList(["Salmon Fillets", "Shrimp (Peeled & Deveined)", "Cod", "Smoked Salmon", "Tuna (Fresh)", "Oysters"])}
            </div>
            <div>
              <h3 className="text-lg font-medium mb-1">Vegetarian/Vegan</h3> {/* Reduced mb-2 to mb-1 */}
              {renderIngredientList(["Tofu (Firm)", "Tempeh", "Chickpeas (Dried)", "Black Beans (Dried)", "Lentils (Green)", "Nutritional Yeast"])}
            </div>
          </div>
        </section>

        {/* Grains, Starches, & Flours */}
        <section className="bg-card p-3 rounded-lg shadow-md"> {/* Reduced p-4 to p-3 */}
          <h2 className="text-2xl font-semibold mb-2 text-primary">🌾 Grains, Starches, & Flours</h2> {/* Reduced mb-3 to mb-2 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"> {/* Reduced gap-6 to gap-4 */}
            <div>
              <h3 className="text-lg font-medium mb-1">Grains</h3> {/* Reduced mb-2 to mb-1 */}
              {renderIngredientList(["Rice (white, brown, wild)", "Quinoa", "Couscous", "Farro", "Oats"])}
            </div>
            <div>
              <h3 className="text-lg font-medium mb-1">Starches</h3> {/* Reduced mb-2 to mb-1 */}
              {renderIngredientList(["Potatoes (russet, red, sweet)", "Pasta (penne, spaghetti, lasagna sheets)", "Corn", "Cornstarch"])}
            </div>
            <div>
              <h3 className="text-lg font-medium mb-1">Flours/Baking</h3> {/* Reduced mb-2 to mb-1 */}
              {renderIngredientList(["All-purpose flour", "Bread flour", "Cornmeal", "Breadcrumbs", "Baking powder", "Baking soda"])}
            </div>
            <div>
              <h3 className="text-lg font-medium mb-1">Breads</h3> {/* Reduced mb-2 to mb-1 */}
              {renderIngredientList(["Slider buns", "Various rolls", "Baguettes", "Tortillas", "Pita bread"])}
            </div>
          </div>
        </section>

        {/* Dairy & Cheeses */}
        <section className="bg-card p-3 rounded-lg shadow-md"> {/* Reduced p-4 to p-3 */}
          <h2 className="text-2xl font-semibold mb-2 text-primary">🧀 Dairy & Cheeses</h2> {/* Reduced mb-3 to mb-2 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4"> {/* Reduced gap-6 to gap-4 */}
            <div>
              <h3 className="text-lg font-medium mb-1">Dairy</h3> {/* Reduced mb-2 to mb-1 */}
              {renderIngredientList(["Milk", "Butter", "Heavy cream", "Sour cream", "Yogurt (plain, Greek)", "Eggs"])}
            </div>
            <div>
              <h3 className="text-lg font-medium mb-1">Cheeses (Hard/Aged)</h3> {/* Reduced mb-2 to mb-1 */}
              {renderIngredientList(["Parmesan", "Gruyère", "Aged cheddar"])}
            </div>
            <div>
              <h3 className="text-lg font-medium mb-1">Cheeses (Soft/Fresh)</h3> {/* Reduced mb-2 to mb-1 */}
              {renderIngredientList(["Mozzarella", "Feta", "Goat cheese", "Cream cheese", "Ricotta", "Brie"])}
            </div>
            <div>
              <h3 className="text-lg font-medium mb-1">Sauces/Mixes</h3> {/* Reduced mb-2 to mb-1 */}
              {renderIngredientList(["Cheddar cheese sauce mix", "Dry milk"])}
            </div>
          </div>
        </section>

        {/* Fresh Produce (Fruits & Vegetables) */}
        <section className="bg-card p-3 rounded-lg shadow-md"> {/* Reduced p-4 to p-3 */}
          <h2 className="text-2xl font-semibold mb-2 text-primary">🥦 Fresh Produce (Fruits & Vegetables)</h2> {/* Reduced mb-3 to mb-2 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4"> {/* Reduced gap-6 to gap-4 */}
            <div>
              <h3 className="text-lg font-medium mb-1">Vegetables</h3> {/* Reduced mb-2 to mb-1 */}
              {renderIngredientList([
                "Greens: Mixed salad greens, spinach, romaine lettuce, kale, cabbage.",
                "Root Vegetables: Carrots, onions (red, white, yellow), garlic, beets, radishes.",
                "Cruciferous/Fruiting Veg: Broccoli, cauliflower, bell peppers (assorted colors), zucchini, eggplant, mushrooms.",
                "Alliums: Scallions, leeks, shallots, chives.",
                "Dips/Sides: Potatoes, celery, cucumbers (for veggie platters), avocados.",
              ])}
            </div>
            <div>
              <h3 className="text-lg font-medium mb-1">Fruits</h3> {/* Reduced mb-2 to mb-1 */}
              {renderIngredientList([
                "Berries: Strawberries, blueberries, raspberries, blackberries.",
                "Citrus: Lemons, limes, oranges, grapefruits.",
                "Other: Apples, bananas, grapes, melon (watermelon, cantaloupe), peaches, pineapple, tomatoes (botanically a fruit!).",
              ])}
            </div>
          </div>
        </section>

        {/* Pantry Staples & Spices */}
        <section className="bg-card p-3 rounded-lg shadow-md"> {/* Reduced p-4 to p-3 */}
          <h2 className="text-2xl font-semibold mb-2 text-primary">🥫 Pantry Staples & Spices</h2> {/* Reduced mb-3 to mb-2 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"> {/* Reduced gap-6 to gap-4 */}
            <div>
              <h3 className="text-lg font-medium mb-1">Oils, Fats, & Liquids</h3> {/* Reduced mb-2 to mb-1 */}
              {renderIngredientList([
                "Olive oil (extra virgin and regular)", "Vegetable oil", "Canola oil", "Sesame oil",
                "Vinegar (balsamic, red wine, white wine, apple cider)", "Soy sauce", "Vegetable/chicken/beef broth.",
              ])}
            </div>
            <div>
              <h3 className="text-lg font-medium mb-1">Spices & Herbs</h3> {/* Reduced mb-2 to mb-1 */}
              {renderIngredientList([
                "Salt (kosher, sea)", "Black pepper", "Granulated garlic", "Granulated onion",
                "Dried parsley", "Oregano", "Cumin", "Chili powder", "Paprika (smoked/sweet)",
                "Cinnamon", "Nutmeg", "Bay leaves.",
              ])}
              <h3 className="text-lg font-medium mb-1 mt-2">Fresh Herbs</h3> {/* Reduced mb-2 mt-4 to mb-1 mt-2 */}
              {renderIngredientList(["Basil", "Mint", "Rosemary", "Thyme", "Cilantro", "Dill."])}
            </div>
            <div>
              <h3 className="text-lg font-medium mb-1">Condiments & Sauces</h3> {/* Reduced mb-2 to mb-1 */}
              {renderIngredientList([
                "Mayonnaise", "Mustard (Dijon, yellow)", "Ketchup", "BBQ sauce",
                "Hot sauce (like Cayenne pepper sauce)", "Honey", "Maple syrup", "Chocolate syrup.",
              ])}
            </div>
            <div>
              <h3 className="text-lg font-medium mb-1">Baking/Dessert</h3> {/* Reduced mb-2 to mb-1 */}
              {renderIngredientList([
                "Sugar (granulated, brown, powdered)", "Vanilla extract", "Chocolate chips",
                "Cocoa powder", "Nuts (almonds, walnuts, pecans)", "Raisins", "Dried cranberries.",
              ])}
            </div>
            <div>
              <h3 className="text-lg font-medium mb-1">Canned/Jarred</h3> {/* Reduced mb-2 to mb-1 */}
              {renderIngredientList([
                "Canned tomatoes", "Tomato paste", "Olives", "Capers", "Pickles/relish", "Dried fruits.",
              ])}
            </div>
          </div>
        </section>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default Ingredients;