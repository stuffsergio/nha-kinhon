import { Marker, Tooltip } from "react-leaflet";
import L from "leaflet";

const typeConfig = {
  MERCADO_LOCAL: { color: "#dc3545", label: "Mercado Local" },
  SUPERMERCADO: { color: "#0066cc", label: "Supermercado" },
  TIENDA_ESPECIALIZADA: { color: "#7c3aed", label: "Tienda Especializada" },
};

const iconCache = {};

function createIcon(type, isSelected) {
  const key = `${type}-${isSelected}`;
  if (iconCache[key]) return iconCache[key];

  const cfg = typeConfig[type] || typeConfig.MERCADO_LOCAL;
  const size = isSelected ? 56 : 44;
  const dotSize = isSelected ? 22 : 16;
  const ringSize = isSelected ? 48 : 36;

  const icon = L.divIcon({
    className: "",
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
      ">
        <div style="
          position: absolute;
          width: ${ringSize}px;
          height: ${ringSize}px;
          background: ${cfg.color}22;
          border-radius: 50%;
          animation: ${isSelected ? "marker-pulse 2s ease-in-out infinite" : "none"};
        "></div>
        <div style="
          position: relative;
          width: ${dotSize}px;
          height: ${dotSize}px;
          background: ${cfg.color};
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 3px 12px rgba(0,0,0,0.35);
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <div style="
            width: ${isSelected ? 8 : 6}px;
            height: ${isSelected ? 8 : 6}px;
            background: white;
            border-radius: 50%;
            opacity: 0.9;
          "></div>
        </div>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });

  iconCache[key] = icon;
  return icon;
}

export default function MarketMarker({ market, onClick, isSelected }) {
  return (
    <Marker
      position={[market.lat, market.lng]}
      icon={createIcon(market.type, isSelected)}
      eventHandlers={{ click: () => onClick(market) }}
    >
      <Tooltip
        direction="top"
        offset={[0, -8]}
        opacity={0.95}
        permanent={false}
      >
        <div className="font-apple-body text-[13px] font-semibold whitespace-nowrap">
          {market.name}
        </div>
      </Tooltip>
    </Marker>
  );
}
