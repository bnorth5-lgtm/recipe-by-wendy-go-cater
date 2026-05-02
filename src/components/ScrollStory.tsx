import React from "react";
import { motion, useScroll, useTransform } from "framer-motion";

interface ScrollStoryProps {
  storyText?: string;
  scrollRef: React.RefObject<HTMLElement | null>;
}

export const ScrollStory: React.FC<ScrollStoryProps> = ({ storyText, scrollRef }) => {
  const { scrollYProgress } = useScroll({
    container: scrollRef,
    offset: ["start start", "end end"]
  });

  // Fade in the vellum overlay and text as the user scrolls down towards the method section
  const opacity = useTransform(scrollYProgress, [0.2, 0.7], [0, 1]);
  const scale = useTransform(scrollYProgress, [0.2, 0.7], [0.95, 1]);

  if (!storyText) return null;

  return (
    <motion.div 
      className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center p-12 bg-amber-50/20 dark:bg-amber-950/20"
      style={{ opacity }}
    >
      <motion.div 
        className="relative z-10 max-w-2xl text-center"
        style={{ scale }}
      >
        <p 
          className="font-serif text-4xl md:text-5xl lg:text-6xl leading-relaxed italic text-amber-900/50 dark:text-amber-100/30 drop-shadow-sm"
        >
          {storyText}
        </p>
      </motion.div>
    </motion.div>
  );
};
