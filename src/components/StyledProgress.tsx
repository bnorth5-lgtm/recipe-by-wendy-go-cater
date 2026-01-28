"use client";

import * as React from "react";
import { Progress } from "@/components/ui/progress"; // Import the original Progress component

// Define a type that includes the missing prop
interface CustomProgressProps extends React.ComponentPropsWithoutRef<typeof Progress> {
  indicatorClassName?: string;
}

// Wrap the original Progress component, using type assertion to allow the indicatorClassName prop
// This assumes the underlying implementation of "@/components/ui/progress" handles this prop 
// even if its public types are incorrect/missing.
const StyledProgress = React.forwardRef<
  React.ElementRef<typeof Progress>,
  CustomProgressProps
>(({ indicatorClassName, ...props }, ref) => {
  return (
    <Progress
      ref={ref}
      {...props}
      indicatorClassName={indicatorClassName as any}
    />
  );
});

StyledProgress.displayName = "StyledProgress";

export { StyledProgress };