import { ShoppingCart, MapPin, Search } from "lucide-react";
import ButtonPrimary from "../components/ButtonPrimary";
import ButtonSecondary from "../components/ButtonSecondary";
import { useCategories } from "../hooks/useCategories";
import { useMarkets } from "../hooks/useMarkets";

export default function Home() {
  const { data: categoriesRes, isLoading: catLoading } = useCategories();
  const { data: marketsRes, isLoading: marketsLoading } = useMarkets();

  const categories = categoriesRes?.data || [];
  const markets = marketsRes?.data || [];
  const popularCategories = categories.slice(0, 6);

  const getEmoji = (icon) => {
      const map = {
        Apple: "🍎", Carrot: "🥕", Beef: "🥩", Fish: "🐟",
        Milk: "🥛", Bread: "🍞", Wheat: "🌾", Potato: "🥔",
        Coffee: "☕", Droplet: "🫒", Sparkles: "✨", Cookie: "🍪",
        IceCream: "🍦", Nut: "🥜", Sunrise: "🌅", Candy: "🍬",
      };
      return map[icon] || "📦";
  };

  return (
    <div className="w-full">
      <section className="bg-[#ffffff] py-[80px] px-6">
        <div className="max-w-[980px] mx-auto text-center">
          <h1 className="font-apple-display text-[56px] font-semibold leading-[1.07] tracking-[-0.28px] text-[#1d1d1f] mb-4">
            NHA KINHON
          </h1>
          <p className="font-apple-body text-[28px] font-normal leading-[1.14] tracking-[0.196px] text-[#1d1d1f] mb-8">
            Servicio de envío de comida desde la diáspora
          </p>
          <div className="flex gap-4 justify-center">
            <ButtonPrimary onClick={() => window.location.href = "/buscar"}>
              Comenzar
            </ButtonPrimary>
            <ButtonSecondary onClick={() => window.location.href = "/mapa"}>
              Explorar
            </ButtonSecondary>
          </div>
        </div>
      </section>

      <section className="bg-[#f5f5f7] py-[80px] px-6">
        <div className="max-w-[980px] mx-auto">
          <h2 className="font-apple-display text-[40px] font-semibold leading-[1.1] text-[#1d1d1f] mb-8">
            Categorías Populares
          </h2>
          {catLoading ? (
            <p className="text-[#7a7a7a]">Cargando...</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {popularCategories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => window.location.href = `/buscar?categoryId=${category.id}`}
                  className="bg-[#ffffff] p-6 rounded-[18px] no-shadow hover:shadow-product transition-shadow"
                >
                  <div className="w-16 h-16 bg-[#f5f5f7] rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">{getEmoji(category.icon)}</span>
                  </div>
                  <span className="font-apple-body text-[17px] font-normal leading-[1.47] tracking-[-0.374px] text-[#1d1d1f] text-center">
                    {category.name}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="bg-[#272729] py-[80px] px-6">
        <div className="max-w-[980px] mx-auto">
          <h2 className="font-apple-display text-[40px] font-semibold leading-[1.1] text-[#ffffff] mb-8">
            Mercados y Tiendas
          </h2>
          {marketsLoading ? (
            <p className="text-[#7a7a7a]">Cargando...</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {markets.map((market) => (
                <div
                  key={market.id}
                  className="bg-[#2a2a2c] p-6 rounded-[18px] no-shadow"
                >
                  <h3 className="font-apple-display text-[28px] font-semibold leading-[1.14] tracking-[0.196px] text-[#ffffff] mb-2">
                    {market.name}
                  </h3>
                  <p className="font-apple-body text-[17px] font-normal leading-[1.47] tracking-[-0.374px] text-[#cccccc] mb-4">
                    {market.location} &bull; {market.hours}
                  </p>
                  <ButtonSecondary onClick={() => window.location.href = "/mapa"}>
                    Ver productos
                  </ButtonSecondary>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
