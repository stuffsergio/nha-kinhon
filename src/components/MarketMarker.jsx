import { MapPin } from "lucide-react";

export default function MarketMarker({ market, onClick, isSelected }) {
  const typeColors = {
    mercado_local: "bg-red-500",
    supermercado: "bg-blue-500",
    tienda_especializada: "bg-purple-500",
  };

  return (
    <div
      className={`absolute cursor-pointer transform hover:scale-110 transition-transform ${
        isSelected ? "scale-125 z-10" : "z-0"
      }`}
      style={{
        left: `${market.coordinates.x}%`,
        top: `${market.coordinates.y}%`,
        transform: "translate(-50%, -50%)"
      }}
      onClick={onClick}
    >
      <div className={`${typeColors[market.type]} p-2 rounded-full shadow-lg`}>
        <MapPin size={24} className="text-white" />
      </div>
      {isSelected && (
        <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-white px-3 py-1 rounded-lg shadow-md whitespace-nowrap">
          <p className="text-sm font-medium">{market.name}</p>
        </div>
      )}
    </div>
  );
}
