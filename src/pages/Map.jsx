import { useState } from "react";
import { markets } from "../data/markets";
import MarketMarker from "../components/MarketMarker";
import MarketModal from "../components/MarketModal";

export default function Map() {
  const [selectedMarket, setSelectedMarket] = useState(null);

  return (
    <div className="w-full max-w-[980px] mx-auto py-[80px] px-6">
      <h1 className="font-apple-display text-[56px] font-semibold leading-[1.07] tracking-[-0.28px] text-[#1d1d1f] mb-6">
        Mapa de Guinea Bissau
      </h1>
      
      {/* Map Placeholder */}
      <div className="relative bg-gradient-to-br from-[#f5f5f7] to-[#e0e0e0] rounded-[18px] h-[60vh] border border-[#e0e0e0] overflow-hidden no-shadow">
        {/* Map Background Pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="w-full h-full" style={{
            backgroundImage: `
              radial-gradient(circle at 20% 30%, rgba(0, 102, 204, 0.3) 0%, transparent 50%),
              radial-gradient(circle at 80% 70%, rgba(0, 102, 204, 0.3) 0%, transparent 50%)
            `
          }} />
        </div>

        {/* Map Labels */}
        <div className="absolute top-4 left-4 bg-[#ffffff]/80 backdrop-blur px-4 py-2 rounded-[8px] no-shadow">
          <p className="font-apple-body text-[14px] font-normal leading-[1.43] tracking-[-0.224px] text-[#1d1d1f]">
            Guinea Bissau
          </p>
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
          <div className="w-4 h-4 bg-[#0066cc] rounded-full"></div>
          <span className="font-apple-body text-[17px] font-normal leading-[1.47] tracking-[-0.374px] text-[#7a7a7a]">
            Mercado Local
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-[#0066cc] rounded-full"></div>
          <span className="font-apple-body text-[17px] font-normal leading-[1.47] tracking-[-0.374px] text-[#7a7a7a]">
            Supermercado
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-[#0066cc] rounded-full"></div>
          <span className="font-apple-body text-[17px] font-normal leading-[1.47] tracking-[-0.374px] text-[#7a7a7a]">
            Tienda Especializada
          </span>
        </div>
      </div>
    </div>
  );
}
