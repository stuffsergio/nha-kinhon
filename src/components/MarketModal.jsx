import { X, Clock, MapPin, Store, Package } from "lucide-react";
import { products } from "../data/products";

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
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">{market.name}</h2>
              <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                {typeLabels[market.type]}
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Location and Hours */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-gray-600">
              <MapPin size={20} className="text-gray-400" />
              <span>{market.location}</span>
            </div>
            <div className="flex items-center gap-3 text-gray-600">
              <Clock size={20} className="text-gray-400" />
              <span>{market.hours}</span>
            </div>
          </div>

          {/* Products Preview */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Package size={20} className="text-gray-600" />
              <h3 className="font-semibold">Productos Disponibles</h3>
            </div>
            <div className="space-y-2">
              {displayedProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                >
                  <span className="font-medium">{product.name}</span>
                  <span className="text-gray-600">
                    {product.price} FCFA/{product.unit}
                  </span>
                </div>
              ))}
              {marketProducts.length > 5 && (
                <p className="text-sm text-gray-500 text-center pt-2">
                  y {marketProducts.length - 5} productos más...
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full bg-black text-white py-3 rounded-xl font-semibold hover:bg-gray-800 transition-colors"
          >
            Ver Todos los Productos
          </button>
        </div>
      </div>
    </div>
  );
}
