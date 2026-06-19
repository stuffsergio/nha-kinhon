import { X, Clock, MapPin, Package } from "lucide-react";
import { products } from "../data/products";
import ButtonPrimary from "./ButtonPrimary";

export default function MarketModal({ market, onClose }) {
  const marketProducts = products.filter((p) => market.products.includes(p.id));
  const displayedProducts = marketProducts.slice(0, 5);

  const typeLabels = {
    mercado_local: "Mercado Local",
    supermercado: "Supermercado",
    tienda_especializada: "Tienda Especializada",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative bg-[#ffffff] rounded-[18px] no-shadow max-w-lg w-full max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="p-[24px] border-b border-[#e0e0e0]">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-apple-display text-[40px] font-semibold leading-[1.1] text-[#1d1d1f] mb-2">
                {market.name}
              </h2>
              <span className="inline-block px-3 py-1 bg-[#f5f5f7] text-[#1d1d1f] rounded-[9999px] font-apple-body text-[14px] font-normal leading-[1.43] tracking-[-0.224px]">
                {typeLabels[market.type]}
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[#f5f5f7] rounded-full transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-[24px] space-y-6">
          {/* Location and Hours */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 font-apple-body text-[17px] font-normal leading-[1.47] tracking-[-0.374px] text-[#7a7a7a]">
              <MapPin size={20} className="text-[#7a7a7a]" />
              <span>{market.location}</span>
            </div>
            <div className="flex items-center gap-3 font-apple-body text-[17px] font-normal leading-[1.47] tracking-[-0.374px] text-[#7a7a7a]">
              <Clock size={20} className="text-[#7a7a7a]" />
              <span>{market.hours}</span>
            </div>
          </div>

          {/* Products Preview */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Package size={20} className="text-[#1d1d1f]" />
              <h3 className="font-apple-display text-[21px] font-semibold leading-[1.19] tracking-[0.231px] text-[#1d1d1f]">
                Productos Disponibles
              </h3>
            </div>
            <div className="space-y-2">
              {displayedProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex justify-between items-center p-3 bg-[#f5f5f7] rounded-[8px]"
                >
                  <span className="font-apple-body text-[17px] font-semibold leading-[1.24] tracking-[-0.374px] text-[#1d1d1f]">
                    {product.name}
                  </span>
                  <span className="font-apple-body text-[17px] font-normal leading-[1.47] tracking-[-0.374px] text-[#7a7a7a]">
                    {product.price} FCFA/{product.unit}
                  </span>
                </div>
              ))}
              {marketProducts.length > 5 && (
                <p className="font-apple-body text-[14px] font-normal leading-[1.43] tracking-[-0.224px] text-[#7a7a7a] text-center pt-2">
                  y {marketProducts.length - 5} productos más...
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-[24px] border-t border-[#e0e0e0]">
          <ButtonPrimary onClick={onClose} className="w-full">
            Ver Todos los Productos
          </ButtonPrimary>
        </div>
      </div>
    </div>
  );
}
