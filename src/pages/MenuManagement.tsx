"use client";

import { MadeWithDyad } from "@/components/made-with-dyad";

const MenuManagement = () => {
  return (
    <div className="min-h-full flex flex-col items-center justify-center bg-background text-foreground p-4">
      <div className="text-center mb-6">
        <h1 className="text-4xl font-bold mb-4">Menu & Recipe Management</h1>
        <p className="text-xl text-muted-foreground">
          This is where you'll build your ingredient inventory, recipes, and pre-planned menus.
        </p>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default MenuManagement;