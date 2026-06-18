import { Link } from "react-router-dom";
import * as LucideIcons from "lucide-react";

export default function CategoryCard({ category }) {
  const Icon = LucideIcons[category.icon] || LucideIcons.Circle;

  return (
    <Link
      to="/buscar"
      state={{ category: category.id }}
      className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 flex flex-col items-center gap-3 hover:border-blue-500"
    >
      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
        <Icon size={32} className="text-blue-600" />
      </div>
      <span className="text-sm font-medium text-center">{category.name}</span>
    </Link>
  );
}
