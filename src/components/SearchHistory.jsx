import { Clock, X } from "lucide-react";

export default function SearchHistory({ history, onHistoryClick, onClearHistory }) {
  return (
    <div className="bg-[#ffffff] border border-[#e0e0e0] rounded-[18px] p-[24px] no-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock size={20} className="text-[#7a7a7a]" />
          <h3 className="font-apple-display text-[21px] font-semibold leading-[1.19] tracking-[0.231px] text-[#1d1d1f]">
            Búsquedas recientes
          </h3>
        </div>
        <button
          onClick={onClearHistory}
          className="font-apple-body text-[14px] font-normal leading-[1.29] tracking-[-0.224px] text-[#7a7a7a] hover:text-[#1d1d1f] flex items-center gap-1"
        >
          <X size={16} />
          Limpiar
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {history.map((query, index) => (
          <button
            key={index}
            onClick={() => onHistoryClick(query)}
            className="px-4 py-2 bg-[#f5f5f7] hover:bg-[#e0e0e0] rounded-[9999px] font-apple-body text-[17px] font-normal leading-[1.47] tracking-[-0.374px] text-[#1d1d1f] transition-colors"
          >
            {query}
          </button>
        ))}
      </div>
    </div>
  );
}
