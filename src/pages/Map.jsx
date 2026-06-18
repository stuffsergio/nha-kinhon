import { useState } from "react";
import { markets } from "../data/markets";
import MarketMarker from "../components/MarketMarker";
import MarketModal from "../components/MarketModal";

export default function Map() {
  const [selectedMarket, setSelectedMarket] = useState(null);

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Mapa de Guinea Bissau</h1>
      
      {/* Map Placeholder */}
      <div className="relative bg-gradient-to-br from-green-100 to-blue-100 rounded-2xl h-[60vh] border-2 border-gray-300 overflow-hidden">
        {/* Map Background Pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="w-full h-full" style={{
            backgroundImage: `
              radial-gradient(circle at 20% 30%, rgba(34, 197, 94, 0.3) 0%, transparent 50%),
              radial-gradient(circle at 80% 70%, rgba(59, 130, 246, 0.3) 0%, transparent 50%)
            `
          }} />
        </div>

        {/* Map Labels */}
        <div className="absolute top-4 left-4 bg-white/80 backdrop-blur px-4 py-2 rounded-lg shadow">
          <p className="text-sm font-medium text-gray-700">Guinea Bissau</p>
        </div>

        {/* Market Markers */}
        {markets.map((market) => (
          <MarketMarker
            key={market.id}
            market={market}
            onClick={() => setSelectedMarket(market)}
            isSelected={selectedMarket?.id === market.id}
          />
        ))}
      </div>

      {/* Market Modal */}
      {selectedMarket && (
        <MarketModal
          market={selectedMarket}
          onClose={() => setSelectedMarket(null)}
        />
      )}

      {/* Legend */}
      <div className="mt-6 flex gap-6 justify-center">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 rounded-full"></div>
          <span className="text-sm">Mercado Local</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
          <span className="text-sm">Supermercado</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-purple-500 rounded-full"></div>
          <span className="text-sm">Tienda Especializada</span>
        </div>
      </div>
    </div>
  );
}
