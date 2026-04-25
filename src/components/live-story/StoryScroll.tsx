import React, { useMemo, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";
import luxuryStoryMd from "../../../catering_luxury_v1.md?raw";

type StoryChapter = {
  header: string;
  kicker: string;
  narrative: string;
  bullets?: string[];
};

function parseLuxuryMarkdown(md: string): StoryChapter[] {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const chapters: StoryChapter[] = [];

  let current: StoryChapter | null = null;
  let paragraphBuffer: string[] = [];

  const flushParagraph = () => {
    const text = paragraphBuffer.join(" ").trim();
    paragraphBuffer = [];
    if (!current || !text) return;

    // Use the first paragraph after the header as the narrative.
    if (!current.narrative) {
      current.narrative = text;
      return;
    }

    // Additional paragraphs become bullets if no bullets yet; otherwise append as a bullet.
    current.bullets = current.bullets ?? [];
    current.bullets.push(text);
  };

  const startChapter = (header: string) => {
    if (current) {
      flushParagraph();
      chapters.push(current);
    }
    current = { header, kicker: "", narrative: "", bullets: [] };
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (line.startsWith("## ")) {
      startChapter(line.replace(/^##\s+/, "").trim());
      continue;
    }

    if (!current) continue;

    // Ignore separators / empty lines, but flush paragraph boundaries.
    if (!line || line === "---") {
      flushParagraph();
      continue;
    }

    // Bold lead-ins like "**A Heritage Collection experience often includes**"
    // become the kicker (if empty), otherwise a bullet.
    const boldHeading = line.match(/^\*\*(.+?)\*\*$/);
    if (boldHeading) {
      flushParagraph();
      const value = boldHeading[1].trim();
      if (!current.kicker) current.kicker = value;
      else (current.bullets = current.bullets ?? []).push(value);
      continue;
    }

    // List bullets: "- **Welcome bites** ..." -> store as plain text
    if (line.startsWith("- ")) {
      flushParagraph();
      const bullet = line.replace(/^-+\s+/, "").trim();
      (current.bullets = current.bullets ?? []).push(bullet);
      continue;
    }

    // Otherwise, treat as paragraph content.
    paragraphBuffer.push(line);
  }

  if (current) {
    flushParagraph();
    chapters.push(current);
  }

  return chapters
    .map((c) => ({
      ...c,
      kicker: c.kicker || "Cronkhite legacy • Stonington connection",
      bullets: c.bullets?.filter(Boolean),
    }))
    .filter((c) => c.header && c.narrative);
}

export const StoryScroll: React.FC<{
  title?: string;
  chapters?: StoryChapter[];
}> = ({ title = "Live Story", chapters }) => {
  const items = useMemo(
    () => chapters ?? parseLuxuryMarkdown(luxuryStoryMd),
    [chapters],
  );
  const ref = useRef<HTMLDivElement | null>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });

  const rail = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <section className="bg-background">
      <div className="mx-auto max-w-5xl px-6 py-16">
        <div className="mb-10 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-serif text-3xl">{title}</h2>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Scroll-linked reveal of the luxury narrative (sourced from{" "}
              <span className="font-medium">catering_luxury_v1.md</span>).
            </p>
          </div>
          <div className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex">
            <span>Scroll</span>
            <span className="h-px w-10 bg-muted-foreground/40" />
          </div>
        </div>

        <div ref={ref} className="relative grid gap-10 md:grid-cols-[28px_1fr]">
          <div className="relative hidden md:block">
            <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-border" />
            <motion.div
              className="absolute left-1/2 top-0 w-px -translate-x-1/2 bg-primary"
              style={{ height: rail }}
            />
          </div>

          <div className="space-y-10">
            {items.map((chapter, idx) => (
              <ChapterCard key={`${chapter.header}-${idx}`} chapter={chapter} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

const ChapterCard: React.FC<{ chapter: StoryChapter }> = ({ chapter }) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.85", "start 0.35"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [22, 0]);
  const opacity = useTransform(scrollYProgress, [0, 1], [0.25, 1]);
  const blur = useTransform(scrollYProgress, [0, 1], [10, 0]);

  return (
    <motion.article
      ref={ref}
      style={{ y, opacity, filter: blur as unknown as string }}
      className={cn(
        "rounded-xl border bg-card/80 p-6 shadow-sm backdrop-blur",
        "transition-colors",
      )}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h3 className="font-serif text-2xl">{chapter.header}</h3>
        <span className="text-xs tracking-[0.14em] text-muted-foreground">
          {chapter.kicker.toUpperCase()}
        </span>
      </div>

      <p className="mt-3 text-sm leading-7 text-foreground/90">
        {chapter.narrative}
      </p>

      {chapter.bullets?.length ? (
        <ul className="mt-4 grid gap-2 text-sm text-muted-foreground">
          {chapter.bullets.map((b) => (
            <li key={b} className="flex gap-3">
              <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary/70" />
              <span>{b}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </motion.article>
  );
};

