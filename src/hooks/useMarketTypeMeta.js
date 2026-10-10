import { useTranslation } from "react-i18next";

const COLORS = {
  MERCADO_LOCAL: { color: "#dc3545", bg: "#fef2f2" },
  SUPERMERCADO: { color: "#0066cc", bg: "#eff6ff" },
  TIENDA_ESPECIALIZADA: { color: "#7c3aed", bg: "#f5f3ff" },
};

export function useMarketTypeMeta() {
  const { t } = useTranslation();
  const label = (key) => {
    const map = {
      MERCADO_LOCAL: t("map.typeMercadoLocal"),
      SUPERMERCADO: t("map.typeSupermercado"),
      TIENDA_ESPECIALIZADA: t("map.typeTienda"),
    };
    return map[key] || key;
  };
  return {
    label,
    get(key) {
      const style = COLORS[key] || { color: "#7a7a7a", bg: "#f5f5f7" };
      return { label: label(key), ...style };
    },
    filterTypes: [
      { key: "MERCADO_LOCAL", label: label("MERCADO_LOCAL"), color: COLORS.MERCADO_LOCAL.color },
      { key: "SUPERMERCADO", label: label("SUPERMERCADO"), color: COLORS.SUPERMERCADO.color },
      {
        key: "TIENDA_ESPECIALIZADA",
        label: label("TIENDA_ESPECIALIZADA"),
        color: COLORS.TIENDA_ESPECIALIZADA.color,
      },
    ],
  };
}
