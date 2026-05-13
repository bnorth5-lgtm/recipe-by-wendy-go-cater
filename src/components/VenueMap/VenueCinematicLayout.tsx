import React from "react";
import { cn } from "@/lib/utils";

export interface VenueCinematicLayoutProps
  extends Omit<React.ComponentPropsWithoutRef<"main">, "style" | "children"> {
  children: React.ReactNode;
  salesMode?: boolean;
  isZenMode?: boolean;
  /** Value for `background-image: var(--blueprint-grid)` (multi-layer gradient stack). */
  blueprintGridCss: string;
  gridBackgroundSize: string;
  gridBackgroundPosition?: string;
  style?: React.CSSProperties;
}

/**
 * Cinematic venue shell: sub-surface grid (z-index -1 + screen blend) and an isolated stage for map UI.
 * `#venue-map-canvas` stays on `<main>` so PDF / fullscreen targets match the full floor + furniture stack.
 */
export const VenueCinematicLayout = React.forwardRef<HTMLMainElement, VenueCinematicLayoutProps>(
  function VenueCinematicLayout(
    {
      children,
      className,
      salesMode = false,
      isZenMode = false,
      blueprintGridCss,
      gridBackgroundSize,
      gridBackgroundPosition = "-1px -1px, -1px -1px, -1px -1px, -1px -1px",
      style,
      ...rest
    },
    ref,
  ) {
    const cinematic = salesMode || isZenMode;

    return (
      <main
        ref={ref}
        className={cn(
          "relative flex min-h-0 flex-1 flex-col overflow-hidden isolate cursor-crosshair transition-colors duration-700 pointer-events-auto",
          cinematic && "nbs-venue-cinematic-sales",
          className,
        )}
        style={
          {
            ...style,
            "--blueprint-grid": blueprintGridCss,
          } as React.CSSProperties
        }
        {...rest}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 select-none transition-opacity duration-1000"
          style={{
            zIndex: -1,
            backgroundImage: "var(--blueprint-grid)",
            backgroundSize: gridBackgroundSize,
            backgroundPosition: gridBackgroundPosition,
            mixBlendMode: "screen",
            opacity: cinematic ? 0.05 : 0.15,
          }}
        />

        <div className="relative z-10 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">{children}</div>
      </main>
    );
  },
);
