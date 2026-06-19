import { Apple, Store, Tag } from "lucide-react";
import { useCart } from "../context/CartContext";
import ButtonPrimary from "./ButtonPrimary";

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

  if (results.length === 0) {
    return (
      <div className="text-center py-[80px]">
        <p className="font-apple-body text-[17px] font-normal leading-[1.47] tracking-[-0.374px] text-[#7a7a7a]">
          No se encontraron resultados para "{searchQuery}"
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p className="font-apple-body text-[17px] font-normal leading-[1.47] tracking-[-0.374px] text-[#7a7a7a]">
        {results.length} resultado{results.length !== 1 ? "s" : ""} para "{searchQuery}"
      </p>
      
      <div className="space-y-4">
        {results.map((result) => {
          const Icon = getIcon(result.type);
          const typeLabel = getTypeLabel(result.type);

          return (
            <div
              key={`${result.type}-${result.id}`}
              className="bg-[#ffffff] border border-[#e0e0e0] p-[24px] rounded-[18px] no-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-[#f5f5f7] rounded-full flex items-center justify-center">
                    <Icon size={24} className="text-[#1d1d1f]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-apple-display text-[28px] font-semibold leading-[1.14] tracking-[0.196px] text-[#1d1d1f]">
                        {result.name}
                      </h3>
                      <span className="font-apple-body text-[14px] font-normal leading-[1.43] tracking-[-0.224px] text-[#7a7a7a]">
                        {typeLabel}
                      </span>
                    </div>
                    {result.type === "product" && (
                      <p className="font-apple-body text-[17px] font-normal leading-[1.47] tracking-[-0.374px] text-[#7a7a7a]">
                        {result.price} FCFA/{result.unit}
                      </p>
                    )}
                    {result.type === "market" && (
                      <p className="font-apple-body text-[17px] font-normal leading-[1.47] tracking-[-0.374px] text-[#7a7a7a]">
                        {result.location} • {result.hours}
                      </p>
                    )}
                    {result.type === "category" && (
                      <p className="font-apple-body text-[17px] font-normal leading-[1.47] tracking-[-0.374px] text-[#7a7a7a]">
                        {result.products.length} productos
                      </p>
                    )}
                  </div>
                </div>
                {result.type === "product" && (
                  <ButtonPrimary onClick={() => addToCart(result)}>
                    Agregar
                  </ButtonPrimary>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
