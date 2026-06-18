import { Clock, X } from "lucide-react";

export default function SearchHistory({ history, onHistoryClick, onClearHistory }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock size={20} className="text-gray-500" />
          <h3 className="font-semibold">Búsquedas recientes</h3>
        </div>
        <button
          onClick={onClearHistory}
          className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
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
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-sm transition-colors"
          >
            {query}
          </button>
        ))}
      </div>
    </div>
  );
}
