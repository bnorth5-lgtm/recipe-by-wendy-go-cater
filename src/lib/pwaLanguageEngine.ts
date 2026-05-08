/**
 * Fixed 20-slot PWA / i18n language registry — BCP-47 style codes consumed by react-i18next.
 * Fully translated dashboards: en es pt fr zh. Remaining slots fall back to English strings until staffed.
 */

export type PwaLanguageSlot = {
  code: string;
  label: string;
  nativeLabel: string;
  flag: string;
  rtl: boolean;
};

export const PWA_LANGUAGE_SLOTS: readonly PwaLanguageSlot[] = [
  { code: "en", label: "English", nativeLabel: "English", flag: "🇺🇸", rtl: false },
  { code: "es", label: "Spanish", nativeLabel: "Español", flag: "🇪🇸", rtl: false },
  { code: "pt", label: "Portuguese", nativeLabel: "Português", flag: "🇧🇷", rtl: false },
  { code: "fr", label: "French", nativeLabel: "Français", flag: "🇫🇷", rtl: false },
  { code: "zh", label: "Chinese (Simplified)", nativeLabel: "中文", flag: "🇨🇳", rtl: false },
  { code: "de", label: "German", nativeLabel: "Deutsch", flag: "🇩🇪", rtl: false },
  { code: "it", label: "Italian", nativeLabel: "Italiano", flag: "🇮🇹", rtl: false },
  { code: "nl", label: "Dutch", nativeLabel: "Nederlands", flag: "🇳🇱", rtl: false },
  { code: "ja", label: "Japanese", nativeLabel: "日本語", flag: "🇯🇵", rtl: false },
  { code: "ko", label: "Korean", nativeLabel: "한국어", flag: "🇰🇷", rtl: false },
  { code: "hi", label: "Hindi", nativeLabel: "हिन्दी", flag: "🇮🇳", rtl: false },
  { code: "ar", label: "Arabic", nativeLabel: "العربية", flag: "🇸🇦", rtl: true },
  { code: "ru", label: "Russian", nativeLabel: "Русский", flag: "🇷🇺", rtl: false },
  { code: "pl", label: "Polish", nativeLabel: "Polski", flag: "🇵🇱", rtl: false },
  { code: "uk", label: "Ukrainian", nativeLabel: "Українська", flag: "🇺🇦", rtl: false },
  { code: "sv", label: "Swedish", nativeLabel: "Svenska", flag: "🇸🇪", rtl: false },
  { code: "da", label: "Danish", nativeLabel: "Dansk", flag: "🇩🇰", rtl: false },
  { code: "nb", label: "Norwegian", nativeLabel: "Norsk bokmål", flag: "🇳🇴", rtl: false },
  { code: "tr", label: "Turkish", nativeLabel: "Türkçe", flag: "🇹🇷", rtl: false },
  { code: "cs", label: "Czech", nativeLabel: "Čeština", flag: "🇨🇿", rtl: false },
] as const;

export const PWA_LANGUAGE_CODES = PWA_LANGUAGE_SLOTS.map((s) => s.code);
