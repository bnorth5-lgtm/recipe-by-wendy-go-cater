import React from "react";
import { useTranslation } from "react-i18next";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";
import { PWA_LANGUAGE_SLOTS } from "@/lib/pwaLanguageEngine";

export const LanguageToggle = () => {
  const { i18n } = useTranslation();

  const resolvedBase = (i18n.resolvedLanguage ?? i18n.language ?? "en").split("-")[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-slate-400 hover:text-[#fbbf24] transition-colors"
        >
          <Globe className="h-5 w-5" />
          <span className="sr-only">Toggle language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="max-h-[min(420px,70vh)] overflow-y-auto bg-slate-900 border-slate-800 text-slate-200"
      >
        {PWA_LANGUAGE_SLOTS.map((lang) => {
          const active = resolvedBase === lang.code;
          return (
            <DropdownMenuItem
              key={lang.code}
              onClick={() => i18n.changeLanguage(lang.code)}
              className={`cursor-pointer hover:bg-slate-800 hover:text-[#fbbf24] ${
                active ? "bg-slate-800 text-[#fbbf24]" : ""
              }`}
            >
              <span className="mr-2" aria-hidden>
                {lang.flag}
              </span>
              <span className="flex min-w-0 flex-col gap-0">
                <span className="truncate font-medium leading-tight">{lang.nativeLabel}</span>
                <span className="truncate text-[10px] uppercase tracking-wider text-slate-500">
                  {lang.label} · {lang.code}
                </span>
              </span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};