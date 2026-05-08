import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      dashboard: {
        title: "The Three Doors",
        subtitle: "Select your operational path",
        quickDropOff: "Quick Drop-Off",
        quickDropOffDesc:
          "Events By Wendy: Minimalist view for simple deliveries. Recipes and basic BEOs without heavy logistics.",
        staffedBuffet: "Staffed Buffet",
        staffedBuffetDesc:
          "Events By Wendy: Adds labor, bartenders, and inventory toggles—comprehensive BEOs with profit shields.",
        fullProduction: "Full Production",
        fullProductionDesc:
          "Events By Wendy: Unlocks the Bird's-Eye Command Map, magnetic layouts, atmosphere layer, and full production tooling."
      }
    }
  },
  es: {
    translation: {
      dashboard: {
        title: "Las Tres Puertas",
        subtitle: "Seleccione su ruta operativa",
        quickDropOff: "Entrega Rápida",
        quickDropOffDesc:
          "Events By Wendy: Vista minimalista para entregas simples. Recetas y BEOs básicos sin logística pesada.",
        staffedBuffet: "Buffet con Personal",
        staffedBuffetDesc:
          "Events By Wendy: Agrega mano de obra, camareros y controles de inventario; BEOs completos con escudos de beneficio.",
        fullProduction: "Producción Completa",
        fullProductionDesc:
          "Events By Wendy: Desbloquea el mapa de comando desde el aire, trazados magnéticos, capa de atmósfera y herramientas de producción completa."
      }
    }
  },
  pt: {
    translation: {
      dashboard: {
        title: "As Três Portas",
        subtitle: "Selecione seu caminho operacional",
        quickDropOff: "Entrega Rápida",
        quickDropOffDesc:
          "Events By Wendy: Visão minimalista para entregas simples. Receitas e BEOs básicos sem logística pesada.",
        staffedBuffet: "Buffet com Equipe",
        staffedBuffetDesc:
          "Events By Wendy: Adiciona mão de obra, bartenders e controles de inventário—BEOs completos com escudos de margem.",
        fullProduction: "Produção Completa",
        fullProductionDesc:
          "Events By Wendy: Desbloqueia o mapa de comando aéreo, layouts magnéticos, camada de atmosfera e ferramentas de produção completa."
      }
    }
  },
  fr: {
    translation: {
      dashboard: {
        title: "Les Trois Portes",
        subtitle: "Sélectionnez votre voie opérationnelle",
        quickDropOff: "Livraison Rapide",
        quickDropOffDesc:
          "Events By Wendy : vue minimaliste pour les livraisons simples — recettes et BEO légers sans logistique lourde.",
        staffedBuffet: "Buffet avec Personnel",
        staffedBuffetDesc:
          "Events By Wendy : ajoute la main-d'œuvre, les barmans et les inventaires ; BEO complets avec barrières de marge.",
        fullProduction: "Production Complète",
        fullProductionDesc:
          "Events By Wendy : débloque la carte de commandement aérienne, les plans magnétiques, la couche d'ambiance et l'outilage production complète."
      }
    }
  },
  zh: {
    translation: {
      dashboard: {
        title: "三扇门",
        subtitle: "选择您的运营路径",
        quickDropOff: "快速送达",
        quickDropOffDesc:
          "Events By Wendy：简单送货的极简视图；食谱与轻量宴会活动单（BEO），无需繁重物流。",
        staffedBuffet: "员工自助餐",
        staffedBuffetDesc:
          "Events By Wendy：增加人手、调酒师与库存控制；完整宴会活动单与利润护盾。",
        fullProduction: "全面生产",
        fullProductionDesc:
          "Events By Wendy：解锁鸟瞰指挥地图、磁吸排版、氛围层及全套制片工具。"
      }
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "en",
    fallbackLng: "en",
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;