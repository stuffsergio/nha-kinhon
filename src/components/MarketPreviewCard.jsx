import { Store, Clock, MapPin } from "lucide-react";

export default function MarketPreviewCard({ market }) {
  const typeColors = {
    mercado_local: "bg-green-100 text-green-700",
    supermercado: "bg-blue-100 text-blue-700",
    tienda_especializada: "bg-purple-100 text-purple-700",
  };

  const typeLabels = {
    mercado_local: "Mercado Local",
    supermercado: "Supermercado",
    tienda_especializada: "Tienda Especializada",
  };

  return (
    <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-300">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Store size={20} className="text-gray-600" />
          <h3 className="font-semibold text-lg">{market.name}</h3>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full ${typeColors[market.type]}`}>
          {typeLabels[market.type]}
        </span>
      </div>
      <div className="space-y-2 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <MapPin size={16} />
          <span>{market.location}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock size={16} />
          <span>{market.hours}</span>
        </div>
      </div>
    </div>
  );
}
