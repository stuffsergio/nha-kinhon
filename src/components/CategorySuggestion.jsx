import * as LucideIcons from "lucide-react";

export default function CategorySuggestion({ categories, onCategoryClick, onSearchClick }) {
  const sampleProducts = [
    { name: "Arroz", icon: "Wheat" },
    { name: "Tomates", icon: "Carrot" },
    { name: "Pollo", icon: "Beef" },
    { name: "Pescado", icon: "Fish" },
    { name: "Leche", icon: "Milk" },
    { name: "Pan", icon: "Bread" },
  ];

  return (
    <div className="space-y-6">
      <section>
        <h2 className="font-apple-display text-[34px] font-semibold leading-[1.47] tracking-[-0.374px] text-[#1d1d1f] mb-4">
          Categorías
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories.slice(0, 8).map((category) => {
            const Icon = LucideIcons[category.icon] || LucideIcons.Circle;
            return (
              <button
                key={category.id}
                onClick={() => onCategoryClick(category)}
                className="bg-[#ffffff] border border-[#e0e0e0] p-[24px] rounded-[18px] no-shadow hover:border-[#0066cc] transition-colors flex flex-col items-center gap-4"
              >
                <div className="w-12 h-12 bg-[#f5f5f7] rounded-full flex items-center justify-center">
                  <Icon size={24} className="text-[#1d1d1f]" />
                </div>
                <span className="font-apple-body text-[17px] font-normal leading-[1.47] tracking-[-0.374px] text-[#1d1d1f]">
                  {category.name}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="font-apple-display text-[34px] font-semibold leading-[1.47] tracking-[-0.374px] text-[#1d1d1f] mb-4">
          Alimentos Populares
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {sampleProducts.map((product) => {
            const Icon = LucideIcons[product.icon] || LucideIcons.Circle;
            return (
              <button
                key={product.name}
                onClick={() => onSearchClick(product.name)}
                className="bg-[#ffffff] border border-[#e0e0e0] p-[24px] rounded-[18px] no-shadow hover:border-[#0066cc] transition-colors flex items-center gap-4"
              >
                <div className="w-10 h-10 bg-[#f5f5f7] rounded-full flex items-center justify-center">
                  <Icon size={20} className="text-[#1d1d1f]" />
                </div>
                <span className="font-apple-body text-[17px] font-normal leading-[1.47] tracking-[-0.374px] text-[#1d1d1f]">
                  {product.name}
                </span>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
