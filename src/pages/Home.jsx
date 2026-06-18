import { ShoppingCart, MapPin, Search, Store } from "lucide-react";
import ActionCard from "../components/ActionCard";
import CategoryCard from "../components/CategoryCard";
import MarketPreviewCard from "../components/MarketPreviewCard";
import { markets } from "../data/markets";
import { categories } from "../data/categories";

export default function Home() {
  const popularCategories = categories.slice(0, 6);

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center py-4">
        <h1 className="text-4xl tracking-tighter font-bold mb-2">NHA KINHON</h1>
        <p className="text-gray-600">Servicio de envío de comida desde la diáspora</p>
      </div>

      {/* Action Cards */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Acciones Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ActionCard
            title="Iniciar Pedido"
            description="Realiza un nuevo pedido de alimentos"
            icon={ShoppingCart}
            to="/buscar"
            color="bg-blue-500"
          />
          <ActionCard
            title="Ver Mercados"
            description="Explora mercados y tiendas disponibles"
            icon={MapPin}
            to="/mapa"
            color="bg-green-500"
          />
          <ActionCard
            title="Buscar Productos"
            description="Encuentra alimentos específicos"
            icon={Search}
            to="/buscar"
            color="bg-purple-500"
          />
        </div>
      </section>

      {/* Category Shortcuts */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Categorías Populares</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {popularCategories.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
      </section>

      {/* Markets and Stores */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Mercados y Tiendas</h2>
          <button className="text-blue-600 hover:text-blue-700 font-medium">
            Ver todos
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {markets.map((market) => (
            <MarketPreviewCard key={market.id} market={market} />
          ))}
        </div>
      </section>
    </div>
  );
}
