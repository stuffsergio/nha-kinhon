import { Link } from "react-router-dom";
import * as LucideIcons from "lucide-react";

export default function CategoryCard({ category }) {
  const Icon = LucideIcons[category.icon] || LucideIcons.Circle;

  return (
    <Link
      to="/buscar"
      state={{ category: category.id }}
      className="bg-[#ffffff] border border-[#e0e0e0] p-[24px] rounded-[18px] no-shadow hover:border-[#0066cc] transition-colors flex flex-col items-center gap-4"
    >
      <div className="w-16 h-16 bg-[#f5f5f7] rounded-full flex items-center justify-center">
        <Icon size={32} className="text-[#1d1d1f]" />
      </div>
      <span className="font-apple-body text-[17px] font-normal leading-[1.47] tracking-[-0.374px] text-[#1d1d1f] text-center">
        {category.name}
      </span>
    </Link>
  );
}
