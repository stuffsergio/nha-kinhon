import { Marker, Tooltip } from "react-leaflet";
import L from "leaflet";

const TYPE_COLORS = {
  MERCADO_LOCAL: "#dc3545",
  SUPERMERCADO: "#0066cc",
  TIENDA_ESPECIALIZADA: "#7c3aed",
};

const iconCache = {};

function createIcon(type, isSelected) {
  const key = `${type}-${isSelected}`;
  if (iconCache[key]) return iconCache[key];

  const color = TYPE_COLORS[type] || TYPE_COLORS.MERCADO_LOCAL;
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
      ">
        <div style="
          width: ${ringSize}px;
          height: ${ringSize}px;
          border-radius: 50%;
          background: ${color}22;
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <div style="
            width: ${dotSize}px;
            height: ${dotSize}px;
            border-radius: 50%;
            background: ${color};
            border: 3px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.25);
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
      <Tooltip direction="top" offset={[0, -8]} opacity={0.95} permanent={false}>
        <div className="font-apple-body text-[13px] font-semibold whitespace-nowrap">
          {market.name}
        </div>
      </Tooltip>
    </Marker>
  );
}
