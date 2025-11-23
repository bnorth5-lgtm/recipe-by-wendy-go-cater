"use client";

import { MadeWithDyad } from "@/components/made-with-dyad";
import { Link } from "react-router-dom"; // Import Link

const Ingredients = () => {
  // Helper function to render a list of items with links
  const renderIngredientList = (items: string[]) => (
    <ul className="list-disc list-inside space-y-2 text-muted-foreground">
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
              {renderIngredientList([
                "Chicken Breast", "Chicken Half", "Whole Chicken", "Chicken Thighs", "Chicken Wings", "Ground Chicken", "Turkey Breast"
              ])}
            </div>
            <div>
              <h3 className="text-lg font-medium mb-2">Beef</h3>
              {renderIngredientList([
                "Beef Sirloin", "Beef Tenderloin", "Porterhouse Steak (16oz)", "Filet Mignon (8oz)", "Filet Mignon (12oz)", "Top Round Roast", "Strip Steak (12oz)", "Strip Steak (16oz)", "Rib-Eye Steak (16oz)", "Ground Beef (80/20)"
              ])}
            </div>
            <div>
              <h3 className="text-lg font-medium mb-2">Pork</h3>
              {renderIngredientList(["Pork Loin", "Pulled Pork", "Bacon", "Ham", "Sausage", "Pork Shoulder"])}
            </div>
            <div>
              <h3 className="text-lg font-medium mb-2">Seafood</h3>
              {renderIngredientList(["Salmon Fillets", "Shrimp (Peeled & Deveined)", "Cod", "Smoked Salmon", "Tuna (Fresh)", "Oysters"])}
            </div>
            <div>
              <h3 className="text-lg font-medium mb-2">Vegetarian/Vegan</h3>
              {renderIngredientList(["Tofu (Firm)", "Tempeh", "Chickpeas (Dried)", "Black Beans (Dried)", "Lentils (Green)", "Nutritional Yeast"])}
            </div>
          </div>
        </section>

        {/* Grains, Starches, & Flours */}
        <section className="bg-card p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4 text-primary">🌾 Grains, Starches, & Flours</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <h3 className="text-lg font-medium mb-2">Grains</h3>
              {renderIngredientList(["Rice (white, brown, wild)", "Quinoa", "Couscous", "Farro", "Oats"])}
            </div>
            <div>
              <h3 className="text-lg font-medium mb-2">Starches</h3>
              {renderIngredientList(["Potatoes (russet, red, sweet)", "Pasta (penne, spaghetti, lasagna sheets)", "Corn", "Cornstarch"])}
            </div>
            <div>
              <h3 className="text-lg font-medium mb-2">Flours/Baking</h3>
              {renderIngredientList(["All-purpose flour", "Bread flour", "Cornmeal", "Breadcrumbs", "Baking powder", "Baking soda"])}
            </div>
            <div>
              <h3 className="text-lg font-medium mb-2">Breads</h3>
              {renderIngredientList(["Slider buns", "Various rolls", "Baguettes", "Tortillas", "Pita bread"])}
            </div>
          </div>
        </section>

        {/* Dairy & Cheeses */}
        <section className="bg-card p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4 text-primary">🧀 Dairy & Cheeses</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium mb-2">Dairy</h3>
              {renderIngredientList(["Milk", "Butter", "Heavy cream", "Sour cream", "Yogurt (plain, Greek)", "Eggs"])}
            </div>
            <div>
              <h3 className="text-lg font-medium mb-2">Cheeses (Hard/Aged)</h3>
              {renderIngredientList(["Parmesan", "Gruyère", "Aged cheddar"])}
            </div>
            <div>
              <h3 className="text-lg font-medium mb-2">Cheeses (Soft/Fresh)</h3>
              {renderIngredientList(["Mozzarella", "Feta", "Goat cheese", "Cream cheese", "Ricotta", "Brie"])}
            </div>
            <div>
              <h3 className="text-lg font-medium mb-2">Sauces/Mixes</h3>
              {renderIngredientList(["Cheddar cheese sauce mix", "Dry milk"])}
            </div>
          </div>
        </section>

        {/* Fresh Produce (Fruits & Vegetables) */}
        <section className="bg-card p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4 text-primary">🥦 Fresh Produce (Fruits & Vegetables)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium mb-2">Vegetables</h3>
              {renderIngredientList([
                "Greens: Mixed salad greens, spinach, romaine lettuce, kale, cabbage.",
                "Root Vegetables: Carrots, onions (red, white, yellow), garlic, beets, radishes.",
                "Cruciferous/Fruiting Veg: Broccoli, cauliflower, bell peppers (assorted colors), zucchini, eggplant, mushrooms.",
                "Alliums: Scallions, leeks, shallots, chives.",
                "Dips/Sides: Potatoes, celery, cucumbers (for veggie platters), avocados.",
              ])}
            </div>
            <div>
              <h3 className="text-lg font-medium mb-2">Fruits</h3>
              {renderIngredientList([
                "Berries: Strawberries, blueberries, raspberries, blackberries.",
                "Citrus: Lemons, limes, oranges, grapefruits.",
                "Other: Apples, bananas, grapes, melon (watermelon, cantaloupe), peaches, pineapple, tomatoes (botanically a fruit!).",
              ])}
            </div>
          </div>
        </section>

        {/* Pantry Staples & Spices */}
        <section className="bg-card p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4 text-primary">🥫 Pantry Staples & Spices</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <h3 className="text-lg font-medium mb-2">Oils, Fats, & Liquids</h3>
              {renderIngredientList([
                "Olive oil (extra virgin and regular)", "Vegetable oil", "Canola oil", "Sesame oil",
                "Vinegar (balsamic, red wine, white wine, apple cider)", "Soy sauce", "Vegetable/chicken/beef broth.",
              ])}
            </div>
            <div>
              <h3 className="text-lg font-medium mb-2">Spices & Herbs</h3>
              {renderIngredientList([
                "Salt (kosher, sea)", "Black pepper", "Granulated garlic", "Granulated onion",
                "Dried parsley", "Oregano", "Cumin", "Chili powder", "Paprika (smoked/sweet)",
                "Cinnamon", "Nutmeg", "Bay leaves.",
              ])}
              <h3 className="text-lg font-medium mb-2 mt-4">Fresh Herbs</h3>
              {renderIngredientList(["Basil", "Mint", "Rosemary", "Thyme", "Cilantro", "Dill."])}
            </div>
            <div>
              <h3 className="text-lg font-medium mb-2">Condiments & Sauces</h3>
              {renderIngredientList([
                "Mayonnaise", "Mustard (Dijon, yellow)", "Ketchup", "BBQ sauce",
                "Hot sauce (like Cayenne pepper sauce)", "Honey", "Maple syrup", "Chocolate syrup.",
              ])}
            </div>
            <div>
              <h3 className="text-lg font-medium mb-2">Baking/Dessert</h3>
              {renderIngredientList([
                "Sugar (granulated, brown, powdered)", "Vanilla extract", "Chocolate chips",
                "Cocoa powder", "Nuts (almonds, walnuts, pecans)", "Raisins", "Dried cranberries.",
              ])}
            </div>
            <div>
              <h3 className="text-lg font-medium mb-2">Canned/Jarred</h3>
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