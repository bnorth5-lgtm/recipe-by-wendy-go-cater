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

/** Total Manifest coordinate lock handshake (Visionary Map → installing PWA / crew clients). */
export const MANIFEST_COORDINATE_LOCK_EVENT = "nbs-manifest-coordinate-lock";
export const MANIFEST_COORDINATE_LOCK_CHANNEL = "nbs-manifest-coordinate-lock";
/** Legacy inline script / storage fallback when BroadcastChannel unavailable */
export const MANIFEST_COORDINATE_LOCK_STORAGE_KEY = "nbs_harrison_manifest_pins";

export interface SerializedManifestElement {
  id: string;
  type: string;
  x: number;
  y: number;
  rotation: number;
  guests: number;
}

export interface ManifestCoordinateLockDetail {
  eventId: string;
  snapMode: "Diamond";
  guestCount: number;
  staffCount: number;
  masterElevationFt: number;
  elements: SerializedManifestElement[];
  pinnedAt: number;
}
