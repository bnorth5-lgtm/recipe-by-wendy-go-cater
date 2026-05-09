import React from "react";
import { useTranslation } from "react-i18next";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Radio, ShieldAlert, ChefHat, Route, DoorOpen, CheckCircle2, Globe2 } from "lucide-react";
import { toast } from "sonner";
import {
  CRISIS_COMMAND_EVENT,
  LANGUAGE_BROADCAST_EVENT,
  PWA_LANG_SYNC_STORAGE_KEY,
  type CrisisCommand,
  type CrisisCommandDetail,
  type LanguageBroadcastDetail,
} from "@/lib/crisisEvents";

function dispatchCrisis(command: CrisisCommand) {
  window.dispatchEvent(
    new CustomEvent<CrisisCommandDetail>(CRISIS_COMMAND_EVENT, { detail: { command } }),
  );
}

export const CrisisCommandMenu = () => {
  const { i18n, t } = useTranslation();

  const broadcastLanguage = () => {
    const lang = (i18n.resolvedLanguage ?? i18n.language ?? "en").split("-")[0];
    try {
      localStorage.setItem(PWA_LANG_SYNC_STORAGE_KEY, lang);
    } catch {
      /* ignore quota */
    }
    void i18n.changeLanguage(lang);
    window.dispatchEvent(
      new CustomEvent<LanguageBroadcastDetail>(LANGUAGE_BROADCAST_EVENT, { detail: { lang } }),
    );
    toast.success(t("crisis.toastLanguageSynced"), { duration: 5000 });
    dispatchCrisis("language_sync");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-9 gap-1.5 border border-rose-900/50 bg-rose-950/40 px-2 text-rose-100 hover:bg-rose-900/60 hover:text-white sm:px-3"
        >
          <Radio className="h-4 w-4 shrink-0 text-rose-300" />
          <span className="hidden font-semibold sm:inline">{t("crisis.menuLabel")}</span>
          <span className="sm:hidden">{t("crisis.menuShort")}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-[min(100vw-2rem,22rem)] border-rose-900/40 bg-slate-950 text-slate-100"
      >
        <DropdownMenuLabel className="text-xs font-normal text-slate-400">
          {t("crisis.menuHint")}
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-slate-800" />
        <DropdownMenuItem
          className="cursor-pointer gap-2 focus:bg-rose-950 focus:text-rose-50"
          onClick={() => {
            dispatchCrisis("storm_lockdown");
            toast.error(t("crisis.toastStorm"), { duration: 8000 });
          }}
        >
          <ShieldAlert className="h-4 w-4 text-amber-400" />
          <span className="flex flex-col gap-0">
            <span>{t("crisis.cmdStorm")}</span>
            <span className="text-[10px] uppercase tracking-wide text-slate-500">{t("crisis.cmdStormDesc")}</span>
          </span>
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer gap-2 focus:bg-slate-800"
          onClick={() => {
            dispatchCrisis("kitchen_hold");
            toast(t("crisis.toastKitchen"), { duration: 7000 });
          }}
        >
          <ChefHat className="h-4 w-4 text-[#fbbf24]" />
          <span className="flex flex-col gap-0">
            <span>{t("crisis.cmdKitchen")}</span>
            <span className="text-[10px] uppercase tracking-wide text-slate-500">{t("crisis.cmdKitchenDesc")}</span>
          </span>
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer gap-2 focus:bg-slate-800"
          onClick={() => {
            dispatchCrisis("perimeter_check");
            toast(t("crisis.toastPerimeter"), { duration: 6000 });
          }}
        >
          <Route className="h-4 w-4 text-cyan-400" />
          <span className="flex flex-col gap-0">
            <span>{t("crisis.cmdPerimeter")}</span>
            <span className="text-[10px] uppercase tracking-wide text-slate-500">{t("crisis.cmdPerimeterDesc")}</span>
          </span>
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer gap-2 focus:bg-slate-800"
          onClick={() => {
            dispatchCrisis("evacuate");
            toast.error(t("crisis.toastEvac"), { duration: 12000 });
          }}
        >
          <DoorOpen className="h-4 w-4 text-red-400" />
          <span className="flex flex-col gap-0">
            <span>{t("crisis.cmdEvac")}</span>
            <span className="text-[10px] uppercase tracking-wide text-slate-500">{t("crisis.cmdEvacDesc")}</span>
          </span>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-slate-800" />
        <DropdownMenuItem className="cursor-pointer gap-2 focus:bg-slate-800" onClick={broadcastLanguage}>
          <Globe2 className="h-4 w-4 text-emerald-400" />
          <span className="flex flex-col gap-0">
            <span>{t("crisis.cmdLang")}</span>
            <span className="text-[10px] uppercase tracking-wide text-slate-500">{t("crisis.cmdLangDesc")}</span>
          </span>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-slate-800" />
        <DropdownMenuItem
          className="cursor-pointer gap-2 focus:bg-emerald-950 focus:text-emerald-50"
          onClick={() => {
            dispatchCrisis("all_clear");
            toast.success(t("crisis.toastClear"), { duration: 5000 });
          }}
        >
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          {t("crisis.cmdClear")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
