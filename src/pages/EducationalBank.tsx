"use client";

import React, { useState, useRef, useEffect } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  GraduationCap,
  BookMarked,
  ChefHat,
  TrendingUp,
  DollarSign,
  Lightbulb,
  Send,
  Bot,
  User,
  Sparkles,
  MailIcon,
} from "lucide-react";
import { TierGate } from "@/components/TierGate";
import { cn } from "@/lib/utils";
import {
  KNOWLEDGE_BASE,
  QUICK_QUESTIONS,
  ESCALATION_EMAIL,
  queryKnowledgeBase,
  buildConciergeResponse,
  getEscalationMessage,
  getConciergeGreeting,
  getKBByCategory,
} from "@/lib/educationalBank";

// ── Module catalogue ───────────────────────────────────────────────────────────

interface Module {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: React.ReactNode;
  lessons: number;
  badge: string;
}

const MODULES: Module[] = [
  {
    id: "cost-control",
    title: "Cost Control Fundamentals",
    description:
      "Master ingredient costing, portion control, food cost percentage, and profit margin analysis for catering events.",
    category: "Finance",
    icon: <DollarSign className="h-6 w-6" />,
    lessons: 8,
    badge: "bg-green-100 text-green-700 border-green-300",
  },
  {
    id: "menu-engineering",
    title: "Menu Engineering",
    description:
      "Learn to design menus that maximize profitability — stars, plowhorses, puzzles, and dogs framework applied to catering.",
    category: "Strategy",
    icon: <BookMarked className="h-6 w-6" />,
    lessons: 6,
    badge: "bg-blue-100 text-blue-700 border-blue-300",
  },
  {
    id: "culinary-technique",
    title: "Culinary Techniques at Scale",
    description:
      "Advanced prep and batch cooking methods for catering volumes — from 20-person dinners to 500-person galas.",
    category: "Culinary",
    icon: <ChefHat className="h-6 w-6" />,
    lessons: 12,
    badge: "bg-orange-100 text-orange-700 border-orange-300",
  },
  {
    id: "market-intelligence",
    title: "Market Intelligence & Pricing",
    description:
      "Understand seasonal price swings, supplier negotiation tactics, and building a competitive pricing strategy.",
    category: "Business",
    icon: <TrendingUp className="h-6 w-6" />,
    lessons: 5,
    badge: "bg-purple-100 text-purple-700 border-purple-300",
  },
  {
    id: "event-operations",
    title: "Event Operations & Logistics",
    description:
      "Staff scheduling, rental management, BEO interpretation, and day-of execution playbooks.",
    category: "Operations",
    icon: <GraduationCap className="h-6 w-6" />,
    lessons: 9,
    badge: "bg-teal-100 text-teal-700 border-teal-300",
  },
  {
    id: "client-experience",
    title: "Client Experience & Upselling",
    description:
      "Build lasting client relationships, handle tastings, close proposals, and create upsell opportunities.",
    category: "Sales",
    icon: <Lightbulb className="h-6 w-6" />,
    lessons: 7,
    badge: "bg-amber-100 text-amber-700 border-amber-300",
  },
];

// ── Concierge Chat ─────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: "assistant" | "user";
  text: string;
  followUps?: string[];
}

function ConciergeChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "greeting",
      role: "assistant",
      text: getConciergeGreeting(),
      followUps: QUICK_QUESTIONS.slice(0, 4),
    },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  function handleSend(question: string) {
    const q = question.trim();
    if (!q || typing) return;
    setInput("");

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: "user",
      text: q,
    };
    setMessages((prev) => [...prev, userMsg]);
    setTyping(true);

    const delay = 800 + Math.random() * 400;
    setTimeout(() => {
      const match = queryKnowledgeBase(q);
      const assistantMsg: Message = {
        id: `a-${Date.now()}`,
        role: "assistant",
        text: match
          ? buildConciergeResponse(match.entry)
          : getEscalationMessage(),
        followUps: match?.entry.followUps,
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setTyping(false);
    }, delay);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    handleSend(input);
  }

  return (
    <Card className="w-full border-amber-200/60 dark:border-amber-800/40 shadow-md">
      <CardHeader className="pb-3 bg-gradient-to-r from-amber-50/80 to-amber-100/40 dark:from-amber-950/30 dark:to-transparent rounded-t-xl border-b border-amber-200/40 dark:border-amber-800/30">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/40">
            <Bot className="h-5 w-5 text-amber-700 dark:text-amber-400" />
          </div>
          <div>
            <CardTitle className="text-base flex flex-wrap items-center gap-2">
              Ask the Concierge
              <Badge
                variant="outline"
                className="text-[10px] font-semibold bg-amber-100/60 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700 font-serif tracking-tight"
              >
                <Sparkles className="h-2.5 w-2.5 mr-1 shrink-0" aria-hidden />
                Delicious Catering &amp; Events · by Wendy
              </Badge>
            </CardTitle>
            <CardDescription className="text-xs">
              BEOs · service tiers · logistics · staffing · pricing · dietary
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      {/* Message thread */}
      <CardContent className="p-0">
        <div className="flex flex-col gap-3 p-4 max-h-[420px] overflow-y-auto">
          {messages.map((msg) => (
            <div key={msg.id} className="flex flex-col gap-2">
              <div
                className={cn(
                  "flex gap-2 items-start",
                  msg.role === "user" && "flex-row-reverse"
                )}
              >
                <div
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                    msg.role === "assistant"
                      ? "bg-amber-100 dark:bg-amber-900/40"
                      : "bg-primary/10"
                  )}
                >
                  {msg.role === "assistant" ? (
                    <Bot className="h-4 w-4 text-amber-700 dark:text-amber-400" />
                  ) : (
                    <User className="h-4 w-4 text-primary" />
                  )}
                </div>
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                    msg.role === "assistant"
                      ? "rounded-tl-sm bg-muted/70 text-foreground"
                      : "rounded-tr-sm bg-primary text-primary-foreground ml-auto"
                  )}
                >
                  {/* Render simple newlines; KB responses use \n\n */}
                  {msg.text.split("\n\n").map((para, i) => (
                    <p key={i} className={i > 0 ? "mt-2" : ""}>
                      {para}
                    </p>
                  ))}
                  {msg.text.includes(ESCALATION_EMAIL) && (
                    <a
                      href={`mailto:${ESCALATION_EMAIL}`}
                      className="inline-flex items-center gap-1 mt-2 text-primary-foreground underline opacity-90 hover:opacity-100"
                    >
                      <MailIcon className="h-3 w-3" />
                      {ESCALATION_EMAIL}
                    </a>
                  )}
                </div>
              </div>

              {/* Follow-up question chips */}
              {msg.followUps && msg.followUps.length > 0 && (
                <div className="pl-9 flex flex-wrap gap-1.5">
                  {msg.followUps.map((fq) => (
                    <button
                      key={fq}
                      onClick={() => handleSend(fq)}
                      disabled={typing}
                      className="text-[11px] px-2.5 py-1 rounded-full border border-amber-300/60 dark:border-amber-700/50 bg-amber-50/70 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {fq}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {typing && (
            <div className="flex gap-2 items-center">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/40">
                <Bot className="h-4 w-4 text-amber-700 dark:text-amber-400" />
              </div>
              <div className="rounded-2xl rounded-tl-sm bg-muted/70 px-4 py-3">
                <span className="flex gap-1 items-center">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:0ms]" />
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:180ms]" />
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:360ms]" />
                </span>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Composer */}
        <div className="border-t border-border/50 p-3">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about BEOs, pricing, setup times…"
              disabled={typing}
              className={cn(
                "flex-1 rounded-xl border border-input bg-background px-3 py-2 text-sm",
                "placeholder:text-muted-foreground outline-none ring-offset-background",
                "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                "disabled:opacity-50"
              )}
            />
            <button
              type="submit"
              disabled={!input.trim() || typing}
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                "bg-amber-600 hover:bg-amber-700 text-white transition-colors",
                "disabled:opacity-40 disabled:cursor-not-allowed"
              )}
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}

// ── KB Topic Cards ─────────────────────────────────────────────────────────────

function KBTopicGrid() {
  const byCategory = getKBByCategory();
  const categoryColors: Record<string, string> = {
    BEO: "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700",
    "Service Tiers":
      "bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700",
    Logistics:
      "bg-teal-100 text-teal-700 border-teal-300 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-700",
    Staffing:
      "bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700",
    Finance:
      "bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700",
    Culinary:
      "bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700",
  };

  return (
    <div className="w-full space-y-3">
      <div className="flex items-center gap-2">
        <GraduationCap className="h-5 w-5 text-amber-600" />
        <h2 className="text-lg font-semibold">Knowledge Base Topics</h2>
        <Badge variant="secondary" className="text-xs ml-1">
          {KNOWLEDGE_BASE.length} articles
        </Badge>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {Object.entries(byCategory).map(([cat, entries]) => (
          <Card key={cat} className="border hover:border-amber-300 transition-colors">
            <CardHeader className="pb-2 pt-4 px-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">{cat}</CardTitle>
                <Badge
                  variant="outline"
                  className={cn("text-[10px] border", categoryColors[cat])}
                >
                  {entries.length} {entries.length === 1 ? "article" : "articles"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <ul className="space-y-1.5">
                {entries.map((e) => (
                  <li key={e.id} className="flex items-start gap-1.5">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                    <div>
                      <p className="text-xs font-medium leading-snug">{e.title}</p>
                      <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">
                        {e.shortAnswer}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

const EducationalBank = () => {
  return (
    <div className="min-h-full flex flex-col items-center bg-background text-foreground p-3 gap-6">
      <div className="text-center mb-2">
        <div className="flex flex-col items-center gap-2 mb-3">
          <GraduationCap className="h-10 w-10 text-amber-600 shrink-0" aria-hidden />
          <div className="text-center space-y-1">
            <p className="font-serif text-sm font-semibold uppercase tracking-[0.25em] text-amber-600/95">
              Delicious Catering &amp; Events
            </p>
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground tracking-tight">
              by Wendy · Knowledge Desk
            </h1>
          </div>
        </div>
        <p className="text-xl text-muted-foreground max-w-2xl">
          Enterprise-level culinary training, cost-control modules, and catering best
          practices — built for Delicious Catering & Events professionals.
        </p>
      </div>

      <TierGate feature="educational_bank" className="w-full max-w-4xl min-h-[300px]">
        <div className="w-full max-w-4xl space-y-8">

          {/* Stats bar */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="text-center">
              <CardContent className="pt-4 pb-3">
                <p className="text-3xl font-bold text-amber-600">{MODULES.length}</p>
                <p className="text-sm text-muted-foreground mt-0.5">Modules</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-4 pb-3">
                <p className="text-3xl font-bold text-amber-600">
                  {MODULES.reduce((s, m) => s + m.lessons, 0)}
                </p>
                <p className="text-sm text-muted-foreground mt-0.5">Lessons</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-4 pb-3">
                <p className="text-3xl font-bold text-amber-600">
                  {KNOWLEDGE_BASE.length}
                </p>
                <p className="text-sm text-muted-foreground mt-0.5">KB Articles</p>
              </CardContent>
            </Card>
          </div>

          {/* Concierge chat */}
          <ConciergeChat />

          {/* KB topic index */}
          <KBTopicGrid />

          {/* Module cards */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <BookMarked className="h-5 w-5 text-amber-600" />
              <h2 className="text-lg font-semibold">Training Modules</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {MODULES.map((mod) => (
                <Card
                  key={mod.id}
                  className="border hover:border-amber-300 transition-colors group"
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted group-hover:bg-amber-100 transition-colors">
                          {mod.icon}
                        </div>
                        <div>
                          <CardTitle className="text-base leading-snug">
                            {mod.title}
                          </CardTitle>
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn(
                          "shrink-0 text-xs font-semibold border",
                          mod.badge
                        )}
                      >
                        {mod.category}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <CardDescription className="text-sm leading-relaxed">
                      {mod.description}
                    </CardDescription>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {mod.lessons} lessons
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        Coming Soon
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <Card className="border-dashed border-amber-300 bg-amber-50/50 dark:bg-amber-950/20">
            <CardContent className="pt-5 pb-5 text-center space-y-1">
              <p className="text-sm font-semibold text-amber-700">
                Content is being built out for each module.
              </p>
              <p className="text-xs text-muted-foreground">
                Enterprise subscribers get early access as each lesson set ships.
                Questions? Ask the concierge above or email{" "}
                <a
                  href={`mailto:${ESCALATION_EMAIL}`}
                  className="underline text-amber-700"
                >
                  {ESCALATION_EMAIL}
                </a>
                .
              </p>
            </CardContent>
          </Card>
        </div>
      </TierGate>

      <MadeWithDyad />
    </div>
  );
};

export default EducationalBank;
