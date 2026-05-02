/**
 * SignaturePad.tsx
 *
 * Reusable signature capture widget built on react-signature-canvas.
 * Expose the canvas ref to the parent so it can call
 * `ref.current.getTrimmedCanvas().toDataURL("image/png")` on submit.
 *
 * Usage:
 *   const sigRef = useRef<SignatureCanvas>(null);
 *   const [isEmpty, setIsEmpty] = useState(true);
 *
 *   function handleClear() {
 *     sigRef.current?.clear();
 *     setIsEmpty(true);
 *   }
 *
 *   <SignaturePad
 *     ref={sigRef}
 *     isEmpty={isEmpty}
 *     onBegin={() => setIsEmpty(false)}
 *     onClear={handleClear}
 *   />
 */

import { forwardRef } from "react";
import SignatureCanvas from "react-signature-canvas";
import { PenLine, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SignaturePadProps {
  /** True when no strokes have been drawn (or the pad was cleared). */
  isEmpty: boolean;
  /** Called the moment the user starts drawing their first stroke. */
  onBegin: () => void;
  /** Called when the user clicks the Clear button. */
  onClear: () => void;
  /** Optional additional class name for the outer wrapper. */
  className?: string;
  /** Ink colour — defaults to near-black (#1c1917). */
  penColor?: string;
  /** Canvas height in pixels — defaults to 160. */
  height?: number;
}

const SignaturePad = forwardRef<SignatureCanvas, SignaturePadProps>(
  (
    {
      isEmpty,
      onBegin,
      onClear,
      className,
      penColor = "#1c1917",
      height = 160,
    },
    ref
  ) => {
    return (
      <div className={cn("space-y-2", className)}>
        {/* Label + clear action */}
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            <PenLine className="h-3.5 w-3.5 inline mr-1.5 text-amber-500" />
            Signature
          </label>
          <button
            type="button"
            onClick={onClear}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            <RefreshCw className="h-3 w-3" />
            Clear
          </button>
        </div>

        {/* Canvas wrapper */}
        <div className="relative rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 overflow-hidden transition-colors focus-within:border-amber-400">
          <SignatureCanvas
            ref={ref}
            penColor={penColor}
            canvasProps={{
              width: 640,
              height,
              className: cn(
                "w-full touch-none cursor-crosshair",
                `h-[${height}px]`
              ),
              style: { height },
            }}
            onBegin={onBegin}
          />

          {/* Placeholder text shown until the user starts drawing */}
          {isEmpty && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
              <p className="text-sm text-gray-300">
                Sign here with your mouse or finger
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }
);

SignaturePad.displayName = "SignaturePad";

export default SignaturePad;
