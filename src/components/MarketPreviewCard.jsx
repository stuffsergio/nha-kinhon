import { Store, Clock, MapPin } from "lucide-react";

export default function MarketPreviewCard({ market }) {
  const typeLabels = {
    mercado_local: "Mercado Local",
    supermercado: "Supermercado",
    tienda_especializada: "Tienda Especializada",
  };

  return (
    <div className="bg-[#ffffff] border border-[#e0e0e0] p-[24px] rounded-[18px] no-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <Store size={20} className="text-[#1d1d1f]" />
          <h3 className="font-apple-display text-[28px] font-semibold leading-[1.14] tracking-[0.196px] text-[#1d1d1f]">
            {market.name}
          </h3>
        </div>
        <span className="font-apple-body text-[14px] font-normal leading-[1.43] tracking-[-0.224px] text-[#7a7a7a]">
          {typeLabels[market.type]}
        </span>
      </div>
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <MapPin size={16} className="text-[#7a7a7a]" />
          <span className="font-apple-body text-[17px] font-normal leading-[1.47] tracking-[-0.374px] text-[#7a7a7a]">
            {market.location}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-[#7a7a7a]" />
          <span className="font-apple-body text-[17px] font-normal leading-[1.47] tracking-[-0.374px] text-[#7a7a7a]">
            {market.hours}
          </span>
        </div>
      </div>
    </div>
  );
}
