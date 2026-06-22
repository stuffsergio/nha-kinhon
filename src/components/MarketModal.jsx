import { X, Clock, MapPin, Phone, Package, ShoppingCart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMarket } from "../hooks/useMarkets";

const typeConfig = {
  MERCADO_LOCAL: { label: "Mercado Local", color: "#dc3545", bg: "#fef2f2" },
  SUPERMERCADO: { label: "Supermercado", color: "#0066cc", bg: "#eff6ff" },
  TIENDA_ESPECIALIZADA: { label: "Tienda Especializada", color: "#7c3aed", bg: "#f5f3ff" },
};

export default function MarketModal({ market, onClose }) {
  const navigate = useNavigate();
  const { data: marketRes } = useMarket(market.id);
  const marketProducts = marketRes?.market?.products || [];
  const cfg = typeConfig[market.type] || typeConfig.MERCADO_LOCAL;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-[20px] shadow-2xl w-full max-w-[520px] max-h-[85vh] overflow-y-auto animate-fade-in">
        <div className="h-[140px] flex items-end p-6" style={{ background: `linear-gradient(135deg, ${cfg.color}, ${cfg.color}cc)` }}>
          <div className="absolute top-4 right-4">
            <button
              onClick={onClose}
              className="w-9 h-9 flex items-center justify-center bg-white/20 backdrop-blur rounded-full hover:bg-white/30 transition-colors"
            >
              <X size={18} className="text-white" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-white/20 backdrop-blur rounded-full text-white font-apple-body text-[12px] font-semibold leading-[1.33] tracking-[0.5px] uppercase">
              {cfg.label}
            </span>
          </div>
        </div>

        <div className="px-6 pb-2">
          <h2 className="font-apple-display text-[32px] font-semibold leading-[1.15] tracking-[-0.224px] text-[#1d1d1f] mt-4 mb-1">
            {market.name}
          </h2>

          <div className="space-y-2.5 mt-4 pb-5 border-b border-[#e0e0e0]">
            <div className="flex items-center gap-3">
              <MapPin size={17} className="text-[#7a7a7a] shrink-0" />
              <span className="font-apple-body text-[15px] leading-[1.4] text-[#7a7a7a]">
                {market.address || market.location}
              </span>
            </div>
            {market.phone && (
              <div className="flex items-center gap-3">
                <Phone size={17} className="text-[#7a7a7a] shrink-0" />
                <a href={`tel:${market.phone}`} className="font-apple-body text-[15px] leading-[1.4] text-[#0066cc] hover:underline">
                  {market.phone}
                </a>
              </div>
            )}
            <div className="flex items-center gap-3">
              <Clock size={17} className="text-[#7a7a7a] shrink-0" />
              <span className="font-apple-body text-[15px] leading-[1.4] text-[#7a7a7a]">
                {market.hours}
              </span>
            </div>
          </div>

          <div className="py-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Package size={18} className="text-[#1d1d1f]" />
                <h3 className="font-apple-display text-[20px] font-semibold leading-[1.2] text-[#1d1d1f]">
                  Productos ({marketProducts.length})
                </h3>
              </div>
            </div>

            {marketProducts.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart size={40} className="mx-auto mb-3 text-[#7a7a7a]" />
                <p className="font-apple-body text-[15px] text-[#7a7a7a]">
                  No hay productos disponibles
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
                {marketProducts.map((product) => (
                  <div
                    key={product.id}
                    className="flex justify-between items-center px-4 py-3 bg-[#f5f5f7] rounded-[12px] hover:bg-[#e8e8ed] transition-colors"
                  >
                    <div>
                      <span className="font-apple-body text-[15px] font-semibold leading-[1.3] text-[#1d1d1f]">
                        {product.name}
                      </span>
                      <p className="font-apple-body text-[12px] text-[#7a7a7a]">{product.category?.name || ""}</p>
                    </div>
                    <span className="font-apple-body text-[15px] text-[#7a7a7a] shrink-0 ml-3">
                      {product.price.toLocaleString()} <span className="text-[12px]">/{product.unit}</span>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="px-6 pb-6">
          <button
            onClick={() => { onClose(); navigate(`/tienda/${market.id}`); }}
            className="w-full bg-[#0066cc] text-white font-apple-body text-[17px] font-normal leading-[1.47] tracking-[-0.374px] rounded-[9999px] px-[22px] py-[13px] hover:bg-[#0071e3] focus:outline-none focus:ring-2 focus:ring-[#0071e3] transition-colors btn-apple-active"
          >
            Ver Todos los Productos
          </button>
        </div>
      </div>
    </div>
  );
}
