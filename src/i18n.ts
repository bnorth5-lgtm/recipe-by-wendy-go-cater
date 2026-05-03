import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      dashboard: {
        title: "The Three Doors",
        subtitle: "Select your operational path",
        quickDropOff: "Quick Drop-Off",
        quickDropOffDesc: "Minimalist view for simple deliveries",
        staffedBuffet: "Staffed Buffet",
        staffedBuffetDesc: "Adds labor, bartenders, and inventory toggles",
        fullProduction: "Full Production",
        fullProductionDesc: "Unlocks the Bird's-Eye Command Map and Atmosphere layer"
      }
    }
  },
  es: {
    translation: {
      dashboard: {
        title: "Las Tres Puertas",
        subtitle: "Seleccione su ruta operativa",
        quickDropOff: "Entrega Rápida",
        quickDropOffDesc: "Vista minimalista para entregas simples",
        staffedBuffet: "Buffet con Personal",
        staffedBuffetDesc: "Agrega mano de obra, camareros y controles de inventario",
        fullProduction: "Producción Completa",
        fullProductionDesc: "Desbloquea el mapa de comando general y la capa de atmósfera"
      }
    }
  },
  pt: {
    translation: {
      dashboard: {
        title: "As Três Portas",
        subtitle: "Selecione seu caminho operacional",
        quickDropOff: "Entrega Rápida",
        quickDropOffDesc: "Visão minimalista para entregas simples",
        staffedBuffet: "Buffet com Equipe",
        staffedBuffetDesc: "Adiciona mão de obra, bartenders e controles de inventário",
        fullProduction: "Produção Completa",
        fullProductionDesc: "Desbloqueia o mapa de comando geral e a camada de atmosfera"
      }
    }
  },
  fr: {
    translation: {
      dashboard: {
        title: "Les Trois Portes",
        subtitle: "Sélectionnez votre voie opérationnelle",
        quickDropOff: "Livraison Rapide",
        quickDropOffDesc: "Vue minimaliste pour les livraisons simples",
        staffedBuffet: "Buffet avec Personnel",
        staffedBuffetDesc: "Ajoute la main-d'œuvre, les barmans et les contrôles d'inventaire",
        fullProduction: "Production Complète",
        fullProductionDesc: "Débloque la carte de commandement globale et la couche d'atmosphère"
      }
    }
  },
  zh: {
    translation: {
      dashboard: {
        title: "三扇门",
        subtitle: "选择您的运营路径",
        quickDropOff: "快速送达",
        quickDropOffDesc: "简单送货的极简视图",
        staffedBuffet: "员工自助餐",
        staffedBuffetDesc: "增加劳动力、调酒师和库存切换",
        fullProduction: "全面生产",
        fullProductionDesc: "解锁鸟瞰指挥地图和氛围层"
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