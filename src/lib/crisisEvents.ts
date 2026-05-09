/** CustomEvents for PWA-wide crisis coordination (installable: Visionary Map + shell). */

export const PWA_LANG_SYNC_STORAGE_KEY = "ebw-pwa-lang-sync";

export const CRISIS_COMMAND_EVENT = "nbs-crisis-command";
export const LANGUAGE_BROADCAST_EVENT = "nbs-language-broadcast";

export type CrisisCommand =
  | "all_clear"
  | "storm_lockdown"
  | "kitchen_hold"
  | "perimeter_check"
  | "evacuate"
  | "language_sync";

/** Map-reactive staff behavior (excludes language-only command). */
export type StaffCrisisPhase = "idle" | "storm_lockdown" | "kitchen_hold" | "perimeter_check" | "evacuate";

export interface CrisisCommandDetail {
  command: CrisisCommand;
}

export interface LanguageBroadcastDetail {
  lang: string;
}
