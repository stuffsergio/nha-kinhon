import { useNavigate } from "react-router-dom";
import { ShoppingCart, MapPin, Search } from "lucide-react";
import ButtonPrimary from "../components/ButtonPrimary";
import ButtonSecondary from "../components/ButtonSecondary";
import { useCategories } from "../hooks/useCategories";
import { useMarkets } from "../hooks/useMarkets";

export default function Home() {
  const navigate = useNavigate();
  const { data: categoriesRes, isLoading: catLoading } = useCategories();
  const { data: marketsRes, isLoading: marketsLoading } = useMarkets();

  const categories = categoriesRes?.data || [];
  const markets = marketsRes?.data || [];
  const popularCategories = categories.slice(0, 6);

  const getEmoji = (icon) => {
      const map = {
        Apple: "\uD83C\uDF4E", Carrot: "\uD83E\uDD55", Beef: "\uD83E\uDD69", Fish: "\uD83D\uDC1F",
        Milk: "\uD83E\uDD5B", Bread: "\uD83C\uDF5E", Wheat: "\uD83C\uDF3E", Potato: "\uD83E\uDD54",
        Coffee: "\u2615", Droplet: "\uD83E\uDED2", Sparkles: "\u2728", Cookie: "\uD83C\uDF6A",
        IceCream: "\uD83C\uDF66", Nut: "\uD83E\uDD5C", Sunrise: "\uD83C\uDF05", Candy: "\uD83C\uDF6C",
      };
      return map[icon] || "\uD83D\uDCE6";
  };

  return (
    <div className="w-full">
      {/* Hero */}
      <section className="bg-[#ffffff] py-[80px] px-6">
        <div className="max-w-[980px] mx-auto text-center">
          <h1 className="font-apple-display text-[56px] font-semibold leading-[1.07] tracking-[-0.28px] text-[#1d1d1f] mb-4">
            NHA KINHON
          </h1>
          <p className="font-apple-body text-[28px] font-normal leading-[1.14] tracking-[0.196px] text-[#1d1d1f] mb-8">
            Servicio de env&iacute;o de comida desde la di&aacute;spora
          </p>
          <div className="flex gap-4 justify-center">
            <ButtonPrimary onClick={() => navigate("/buscar")}>
              Comenzar
            </ButtonPrimary>
            <ButtonSecondary onClick={() => navigate("/mapa")}>
              Explorar
            </ButtonSecondary>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="bg-[#f5f5f7] py-[80px] px-6">
        <div className="max-w-[980px] mx-auto">
          <h2 className="font-apple-display text-[40px] font-semibold leading-[1.1] text-[#1d1d1f] mb-8">
            Categor&iacute;as Populares
          </h2>
          {catLoading ? (
            <p className="text-[#7a7a7a]" role="status" aria-live="polite">Cargando&hellip;</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {popularCategories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => navigate(`/buscar?categoryId=${category.id}`)}
                  className="bg-[#ffffff] p-6 rounded-[18px] no-shadow hover:shadow-product transition-shadow duration-250"
                  aria-label={`Ver productos de ${category.name}`}
                >
                  <div className="w-16 h-16 bg-[#f5f5f7] rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl" aria-hidden="true">{getEmoji(category.icon)}</span>
                  </div>
                  <span className="font-apple-body text-[17px] font-normal leading-[1.47] tracking-[-0.374px] text-[#1d1d1f] text-center block">
                    {category.name}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Markets */}
      <section className="bg-[#272729] py-[80px] px-6">
        <div className="max-w-[980px] mx-auto">
          <h2 className="font-apple-display text-[40px] font-semibold leading-[1.1] text-[#ffffff] mb-8">
            Mercados y Tiendas
          </h2>
          {marketsLoading ? (
            <p className="text-[#cccccc]" role="status" aria-live="polite">Cargando&hellip;</p>
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
                  <ButtonSecondary onClick={() => navigate("/mapa")}>
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
