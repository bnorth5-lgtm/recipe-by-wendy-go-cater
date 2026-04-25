import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

interface HeroStoryProps {
  title?: string;
  subtitle?: string;
  imageUrl?: string;
}

export const HeroStory: React.FC<HeroStoryProps> = ({
  title = "Catering By Wendy",
  subtitle = "Heritage-forward catering for luxury galas and weddings.",
  imageUrl = "https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?q=80&w=2400&auto=format&fit=crop",
}) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "22%"]);
  const vignetteOpacity = useTransform(scrollYProgress, [0, 1], [0.65, 0.9]);
  const titleY = useTransform(scrollYProgress, [0, 1], ["0px", "48px"]);

  return (
    <section ref={ref} className="relative h-[100vh] w-full overflow-hidden">
      <motion.div
        className="absolute inset-0"
        style={{
          y: bgY,
          backgroundImage: `url('${imageUrl}')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

      <motion.div
        className="absolute inset-0"
        style={{
          opacity: vignetteOpacity,
          background:
            "radial-gradient(ellipse at center, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.78) 60%, rgba(0,0,0,0.92) 100%)",
        }}
      />

      <div className="relative z-10 flex h-full items-end">
        <div className="mx-auto w-full max-w-5xl px-6 pb-16">
          <motion.div style={{ y: titleY }} className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/30 px-4 py-2 text-xs tracking-[0.18em] text-white/90 backdrop-blur">
              HERITAGE • STONINGTON • CRONKHITE
            </div>
            <h1 className="text-balance font-serif text-4xl text-white sm:text-6xl">
              {title}
            </h1>
            <p className="max-w-2xl text-pretty text-base text-white/85 sm:text-lg">
              {subtitle}
            </p>
            <p className="text-xs text-white/60">
              Heritage imagery placeholder — replace with brand photography.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

