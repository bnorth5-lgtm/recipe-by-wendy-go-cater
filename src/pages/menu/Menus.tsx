"use client";

import { MadeWithDyad } from "@/components/made-with-dyad";

const Menus = () => {
  return (
    <div className="min-h-full flex flex-col items-center justify-center bg-background text-foreground p-6">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Menu Planning</h1>
        <p className="text-xl text-muted-foreground">
          Organize your recipes into pre-planned menus for various events.
        </p>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default Menus;