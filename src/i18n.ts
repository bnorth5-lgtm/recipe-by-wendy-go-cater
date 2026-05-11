import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { PWA_LANGUAGE_CODES } from "@/lib/pwaLanguageEngine";
import { PWA_LANG_SYNC_STORAGE_KEY } from "@/lib/crisisEvents";

const dashboardEn = {
  title: "The Three Doors",
  subtitle: "Select your operational path",
  quickDropOff: "Quick Drop-Off",
  quickDropOffDesc:
    "Delicious Catering & Events: Minimalist view for simple deliveries. Menu dishes and basic BEOs without heavy logistics.",
  staffedBuffet: "Staffed Buffet",
  staffedBuffetDesc:
    "Delicious Catering & Events: Adds labor, bartenders, and inventory toggles—comprehensive BEOs with profit shields.",
  fullProduction: "Full Production",
  fullProductionDesc:
    "Delicious Catering & Events: Unlocks the Bird's-Eye Command Map, magnetic layouts, atmosphere layer, and full production tooling.",
} as const;

const dashboardLocalized: Partial<Record<string, typeof dashboardEn>> = {
  es: {
    title: "Las Tres Puertas",
    subtitle: "Seleccione su ruta operativa",
    quickDropOff: "Entrega Rápida",
    quickDropOffDesc:
      "Delicious Catering & Events: Vista minimalista para entregas simples. Platos del menú y BEOs básicos sin logística pesada.",
    staffedBuffet: "Buffet con Personal",
    staffedBuffetDesc:
      "Delicious Catering & Events: Agrega mano de obra, camareros y controles de inventario; BEOs completos con escudos de beneficio.",
    fullProduction: "Producción Completa",
    fullProductionDesc:
      "Delicious Catering & Events: Desbloquea el mapa de comando desde el aire, trazados magnéticos, capa de atmósfera y herramientas de producción completa.",
  },
  pt: {
    title: "As Três Portas",
    subtitle: "Selecione seu caminho operacional",
    quickDropOff: "Entrega Rápida",
    quickDropOffDesc:
      "Delicious Catering & Events: Visão minimalista para entregas simples. Pratos do cardápio e BEOs básicos sem logística pesada.",
    staffedBuffet: "Buffet com Equipe",
    staffedBuffetDesc:
      "Delicious Catering & Events: Adiciona mão de obra, bartenders e controles de inventário—BEOs completos com escudos de margem.",
    fullProduction: "Produção Completa",
    fullProductionDesc:
      "Delicious Catering & Events: Desbloqueia o mapa de comando aéreo, layouts magnéticos, camada de atmosfera e ferramentas de produção completa.",
  },
  fr: {
    title: "Les Trois Portes",
    subtitle: "Sélectionnez votre voie opérationnelle",
    quickDropOff: "Livraison Rapide",
    quickDropOffDesc:
      "Delicious Catering & Events : vue minimaliste pour les livraisons simples — plats du menu et BEO légers sans logistique lourde.",
    staffedBuffet: "Buffet avec Personnel",
    staffedBuffetDesc:
      "Delicious Catering & Events : ajoute la main-d'œuvre, les barmans et les inventaires ; BEO complets avec barrières de marge.",
    fullProduction: "Production Complète",
    fullProductionDesc:
      "Delicious Catering & Events : débloque la carte de commandement aérienne, les plans magnétiques, la couche d'ambiance et l'outilage production complète.",
  },
  zh: {
    title: "三扇门",
    subtitle: "选择您的运营路径",
    quickDropOff: "快速送达",
    quickDropOffDesc:
      "Delicious Catering & Events：简单送货的极简视图；菜品与轻量宴会活动单（BEO），无需繁重物流。",
    staffedBuffet: "员工自助餐",
    staffedBuffetDesc:
      "Delicious Catering & Events：增加人手、调酒师与库存控制；完整宴会活动单与利润护盾。",
    fullProduction: "全面生产",
    fullProductionDesc:
      "Delicious Catering & Events：解锁鸟瞰指挥地图、磁吸排版、氛围层及全套制片工具。",
  },
};

const crisisEn = {
  menuLabel: "Crisis Command",
  menuShort: "Crisis",
  menuHint: "PWA field protocols — broadcasts to Visionary Map and toasts crew.",
  cmdStorm: "Storm lockdown",
  cmdStormDesc: "Wind + rain sim, shelter staff toward tent anchors",
  cmdKitchen: "Kitchen hold",
  cmdKitchenDesc: "Pause floor traffic — staff rally to kitchen",
  cmdPerimeter: "Perimeter sweep",
  cmdPerimeterDesc: "Oscillating checks along runways / edge",
  cmdEvac: "Evacuate to exits",
  cmdEvacDesc: "Staff vectors toward exit signage",
  cmdLang: "Sync language pack",
  cmdLangDesc: "Store locale + broadcast to open clients",
  cmdClear: "All clear",
  toastStorm: "STORM LOCKDOWN — Anchor tents, kill uplighters if unsafe.",
  toastKitchen: "KITCHEN HOLD — Servers pause outbound, expediter only.",
  toastPerimeter: "PERIMETER — Sweep guy lines, sandbags, power drops.",
  toastEvac: "EVACUATE — Calm guests to marked exits; staff last.",
  toastClear: "ALL CLEAR — Resume normal service timing.",
  toastLanguageSynced: "Language sync pushed to PWA clients on this device.",
} as const;

const crisisLocalized: Partial<Record<string, typeof crisisEn>> = {
  es: {
    menuLabel: "Mando de crisis",
    menuShort: "Crisis",
    menuHint: "Protocolos PWA — avisos al mapa y al equipo.",
    cmdStorm: "Cierre por tormenta",
    cmdStormDesc: "Viento + lluvia; personal hacia carpas",
    cmdKitchen: "Alto en cocina",
    cmdKitchenDesc: "Congelar piso — equipo a cocina",
    cmdPerimeter: "Perímetro",
    cmdPerimeterDesc: "Barridos en perímetro/pistas",
    cmdEvac: "Evacuación",
    cmdEvacDesc: "Personal hacia salidas señalizadas",
    cmdLang: "Sincronizar idioma",
    cmdLangDesc: "Guardar idioma y difundir",
    cmdClear: "Fin de alerta",
    toastStorm: "CIERRE POR TORMENTA — Anclar carpas.",
    toastKitchen: "ALTO COCINA — Solo expedición.",
    toastPerimeter: "PERÍMETRO — Revisar líneas y tomas.",
    toastEvac: "EVACUAR — Salidas marcadas.",
    toastClear: "FIN DE ALERTA — Servicio normal.",
    toastLanguageSynced: "Idioma sincronizado en clientes PWA.",
  },
  pt: {
    menuLabel: "Comando de crise",
    menuShort: "Crise",
    menuHint: "Protocolos PWA — avisos ao mapa e à equipe.",
    cmdStorm: "Encerramento por tempestade",
    cmdStormDesc: "Vento + chuva; equipe para tendas",
    cmdKitchen: "Parada na cozinha",
    cmdKitchenDesc: "Congelar salão — equipe na cozinha",
    cmdPerimeter: "Perímetro",
    cmdPerimeterDesc: "Varredura nas bordas/pistas",
    cmdEvac: "Evacuar",
    cmdEvacDesc: "Equipe em direção às saídas",
    cmdLang: "Sincronizar idioma",
    cmdLangDesc: "Salvar e difundir locale",
    cmdClear: "Situação normalizada",
    toastStorm: "TEMPESTADE — Ancorar tendas.",
    toastKitchen: "PARADA NA COZINHA — Só expedição.",
    toastPerimeter: "PERÍMETRO — Verificar cabos e energia.",
    toastEvac: "EVACUAR — Saídas marcadas.",
    toastClear: "SITUAÇÃO NORMALIZADA.",
    toastLanguageSynced: "Idioma sincronizado nos clientes PWA.",
  },
  fr: {
    menuLabel: "Commandement crise",
    menuShort: "Crise",
    menuHint: "Protocoles PWA — alertes carte et équipe.",
    cmdStorm: "Verrouillage tempête",
    cmdStormDesc: "Vent + pluie — personnel vers chapiteaux",
    cmdKitchen: "Stop cuisine",
    cmdKitchenDesc: "Pause salle — équipe cuisine",
    cmdPerimeter: "Périmètre",
    cmdPerimeterDesc: "Balayage des bords et allées",
    cmdEvac: "Évacuation",
    cmdEvacDesc: "Personnel vers sorties balisées",
    cmdLang: "Sync langue",
    cmdLangDesc: "Enregistrer et diffuser la langue",
    cmdClear: "Fin d’alerte",
    toastStorm: "TEMPÊTE — Ancrer tentes.",
    toastKitchen: "STOP CUISINE — Expédition seule.",
    toastPerimeter: "PÉRIMÈTRE — Vérifier lignes et prises.",
    toastEvac: "ÉVACUER — Sorties balisées.",
    toastClear: "FIN D’ALERTE — Service normal.",
    toastLanguageSynced: "Langue synchronisée sur les clients PWA.",
  },
  zh: {
    menuLabel: "危机指挥",
    menuShort: "危机",
    menuHint: "PWA 现场协议 — 同步地图与提示。",
    cmdStorm: "暴风雨封锁",
    cmdStormDesc: "风雨模拟，人员靠近帐篷锚点",
    cmdKitchen: "厨房暂停",
    cmdKitchenDesc: "楼面停动 — 人员集结厨房",
    cmdPerimeter: "外围巡查",
    cmdPerimeterDesc: "沿跑道/边缘摆动巡查",
    cmdEvac: "疏散至出口",
    cmdEvacDesc: "人员朝向出口标识",
    cmdLang: "同步语言包",
    cmdLangDesc: "保存语言并广播到客户端",
    cmdClear: "解除警报",
    toastStorm: "暴风雨封锁 — 固定帐篷，注意用电。",
    toastKitchen: "厨房暂停 — 仅出菜口通行。",
    toastPerimeter: "外围巡查 — 检查缆绳与电源。",
    toastEvac: "疏散 — 引导至标明出口。",
    toastClear: "解除警报 — 恢复正常服务。",
    toastLanguageSynced: "语言已同步到本机 PWA 客户端。",
  },
};

const resources = Object.fromEntries(
  PWA_LANGUAGE_CODES.map((code) => [
    code,
    {
      translation: {
        dashboard: dashboardLocalized[code] ?? dashboardEn,
        crisis: crisisLocalized[code] ?? crisisEn,
      },
    },
  ])
);

function syncDocumentLanguage(lng: string) {
  if (typeof document === "undefined") return;
  document.documentElement.lang = lng;
  const rtl =
    lng === "ar" || lng.startsWith("ar-");
  document.documentElement.dir = rtl ? "rtl" : "ltr";
  try {
    if (typeof localStorage !== "undefined") {
      const code = lng.split("-")[0];
      if ((PWA_LANGUAGE_CODES as readonly string[]).includes(code)) {
        localStorage.setItem(PWA_LANG_SYNC_STORAGE_KEY, code);
      }
    }
  } catch {
    /* private mode */
  }
}

i18n.use(initReactI18next).init({
  resources,
  supportedLngs: PWA_LANGUAGE_CODES,
  nonExplicitSupportedLngs: true,
  load: "languageOnly",
  lng: "en",
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

try {
  if (typeof localStorage !== "undefined") {
    const stored = localStorage.getItem(PWA_LANG_SYNC_STORAGE_KEY);
    if (stored && (PWA_LANGUAGE_CODES as readonly string[]).includes(stored)) {
      void i18n.changeLanguage(stored);
    }
  }
} catch {
  /* private mode */
}

syncDocumentLanguage(i18n.language);
i18n.on("languageChanged", syncDocumentLanguage);

export default i18n;
