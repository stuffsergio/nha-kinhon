import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export default function ActionCard({ title, description, icon: Icon, to, color = "bg-blue-500" }) {
  return (
    <Link
      to={to}
      className={`${color} text-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col justify-between h-40`}
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-xl font-bold mb-2">{title}</h3>
          <p className="text-sm opacity-90">{description}</p>
        </div>
        {Icon && <Icon size={32} aria-hidden="true" />}
      </div>
      <div className="flex items-center gap-2 text-sm font-semibold">
        <span>Acceder</span>
        <ArrowRight size={16} />
      </div>
    </Link>
  );
}
