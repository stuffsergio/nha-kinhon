import * as LucideIcons from "lucide-react";

export default function CategorySuggestion({ categories, onCategoryClick }) {
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
        <h2 className="text-xl font-bold mb-4">Categorías</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories.slice(0, 8).map((category) => {
            const Icon = LucideIcons[category.icon] || LucideIcons.Circle;
            return (
              <button
                key={category.id}
                onClick={() => onCategoryClick(category.name)}
                className="bg-white border border-gray-200 p-4 rounded-xl hover:border-blue-500 hover:shadow-md transition-all flex flex-col items-center gap-3"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Icon size={24} className="text-blue-600" />
                </div>
                <span className="text-sm font-medium">{category.name}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold mb-4">Alimentos Populares</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {sampleProducts.map((product) => {
            const Icon = LucideIcons[product.icon] || LucideIcons.Circle;
            return (
              <button
                key={product.name}
                onClick={() => onCategoryClick(product.name)}
                className="bg-white border border-gray-200 p-4 rounded-xl hover:border-blue-500 hover:shadow-md transition-all flex items-center gap-3"
              >
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Icon size={20} className="text-green-600" />
                </div>
                <span className="text-sm font-medium">{product.name}</span>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
