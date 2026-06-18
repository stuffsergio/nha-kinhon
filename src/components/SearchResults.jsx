import { Apple, Store, Tag, X } from "lucide-react";
import { useCart } from "../context/CartContext";

export default function SearchResults({ results, searchQuery }) {
  const { addToCart } = useCart();

  const getIcon = (type) => {
    switch (type) {
      case "product":
        return Apple;
      case "market":
        return Store;
      case "category":
        return Tag;
      default:
        return Apple;
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case "product":
        return "Producto";
      case "market":
        return "Tienda";
      case "category":
        return "Categoría";
      default:
        return "";
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case "product":
        return "text-green-600 bg-green-100";
      case "market":
        return "text-blue-600 bg-blue-100";
      case "category":
        return "text-purple-600 bg-purple-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  if (results.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">No se encontraron resultados para "{searchQuery}"</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-gray-600">
        {results.length} resultado{results.length !== 1 ? "s" : ""} para "{searchQuery}"
      </p>
      
      <div className="space-y-3">
        {results.map((result) => {
          const Icon = getIcon(result.type);
          const typeColor = getTypeColor(result.type);
          const typeLabel = getTypeLabel(result.type);

          return (
            <div
              key={`${result.type}-${result.id}`}
              className="bg-white border border-gray-200 p-4 rounded-xl hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${typeColor}`}>
                    <Icon size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-lg">{result.name}</h3>
                      <span className={`text-xs px-2 py-1 rounded-full ${typeColor}`}>
                        {typeLabel}
                      </span>
                    </div>
                    {result.type === "product" && (
                      <p className="text-gray-600">
                        {result.price} FCFA/{result.unit}
                      </p>
                    )}
                    {result.type === "market" && (
                      <p className="text-gray-600">
                        {result.location} • {result.hours}
                      </p>
                    )}
                    {result.type === "category" && (
                      <p className="text-gray-600">
                        {result.products.length} productos
                      </p>
                    )}
                  </div>
                </div>
                {result.type === "product" && (
                  <button
                    onClick={() => addToCart(result)}
                    className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    Agregar
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
