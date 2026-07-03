import { useNavigate } from "react-router-dom";
import { ShoppingCart, Users, Plus, MapPin, Store } from "lucide-react";
import ButtonPrimary from "../components/ButtonPrimary";
import ButtonSecondary from "../components/ButtonSecondary";
import { useCategories } from "../hooks/useCategories";
import { useProducts } from "../hooks/useProducts";
import { useMarkets } from "../hooks/useMarkets";
import { useContacts } from "../hooks/useContacts";
import { useAuth } from "../context/AuthContext";

const emojiMap = {
  Apple: "\uD83C\uDF4E", Carrot: "\uD83E\uDD55", Beef: "\uD83E\uDD69", Fish: "\uD83D\uDC1F",
  Milk: "\uD83E\uDD5B", Bread: "\uD83C\uDF5E", Wheat: "\uD83C\uDF3E", Potato: "\uD83E\uDD54",
  Coffee: "\u2615", Droplet: "\uD83E\uDED2", Sparkles: "\u2728", Cookie: "\uD83C\uDF6A",
  IceCream: "\uD83C\uDF66", Nut: "\uD83E\uDD5C", Sunrise: "\uD83C\uDF05", Candy: "\uD83C\uDF6C",
};

const getEmoji = (icon) => emojiMap[icon] || "\uD83D\uDCE6";

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: categoriesRes, isLoading: catLoading } = useCategories();
  const { data: productsRes, isLoading: prodLoading } = useProducts({ limit: 6 }, { enabled: true });
  const { data: marketsRes, isLoading: marketsLoading } = useMarkets();
  const { data: contactsRes, isLoading: contactsLoading } = useContacts({ enabled: !!user });

  const categories = categoriesRes?.data || [];
  const products = productsRes?.data || [];
  const markets = marketsRes?.data || [];
  const contacts = contactsRes?.data || [];
  const popularCategories = categories.slice(0, 6);

  return (
    <div className="w-full">
      <section className="bg-[#ffffff] py-[40px] px-6">
        <div className="max-w-[980px] mx-auto flex items-center justify-between gap-6">
          <div>
            <h1 className="font-apple-display text-[28px] font-semibold leading-[1.14] text-[#1d1d1f]">
              NHA KINHON
            </h1>
            <p className="font-apple-body text-[17px] font-normal leading-[1.47] tracking-[-0.374px] text-[#7a7a7a] mt-1">
              Servicio de envío de comida desde la diáspora
            </p>
          </div>
          <div className="flex gap-3 shrink-0">
            <ButtonPrimary onClick={() => navigate("/buscar")}>
              Comenzar
            </ButtonPrimary>
            <ButtonSecondary onClick={() => navigate("/mapa")}>
              Explorar
            </ButtonSecondary>
          </div>
        </div>
      </section>

      <section className="bg-[#ffffff] py-[60px] px-6">
        <div className="max-w-[980px] mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-apple-display text-[32px] font-semibold leading-[1.1] text-[#1d1d1f]">
              Categorías Populares
            </h2>
            <button
              onClick={() => navigate("/buscar")}
              className="font-apple-body text-[15px] text-[#0066cc] hover:underline"
            >
              Ver todo
            </button>
          </div>
          {catLoading ? (
            <p className="text-[#7a7a7a]" role="status" aria-live="polite">Cargando…</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {popularCategories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => navigate(`/buscar?categoryId=${category.id}`)}
                    className="bg-[#f5f5f7] border border-[#d2d2d7]/40 px-3 py-2.5 rounded-[10px] hover:shadow-product hover:bg-[#fafafc] hover:scale-[1.02] active:scale-[0.98] transition-all duration-150 flex items-center gap-2 cursor-pointer h-fit"
                    aria-label={`Ver productos de ${category.name}`}
                  >
                    <div className="w-7 h-7 bg-[#ffffff] rounded-full flex items-center justify-center shrink-0">
                      <span className="text-sm" aria-hidden="true">{getEmoji(category.icon)}</span>
                    </div>
                    <span className="font-apple-body text-[13px] font-normal leading-[1.38] tracking-[-0.08px] text-[#1d1d1f] text-left">
                      {category.name}
                    </span>
                  </button>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="bg-[#ffffff] py-[60px] px-6">
        <div className="max-w-[980px] mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-apple-display text-[32px] font-semibold leading-[1.1] text-[#1d1d1f]">
              Productos Destacados
            </h2>
            <button
              onClick={() => navigate("/buscar")}
              className="font-apple-body text-[15px] text-[#0066cc] hover:underline"
            >
              Ver todo
            </button>
          </div>
          {prodLoading ? (
            <p className="text-[#7a7a7a]" role="status" aria-live="polite">Cargando…</p>
          ) : products.length === 0 ? (
            <p className="text-[#7a7a7a] font-apple-body text-[15px]">No hay productos disponibles</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {products.map((product) => (
                <button
                  key={product.id}
                  onClick={() => navigate(`/buscar?categoryId=${product.categoryId}`)}
                  className="bg-[#f5f5f7] border border-[#d2d2d7]/40 p-3 rounded-[12px] hover:shadow-product hover:scale-[1.02] active:scale-[0.98] transition-all duration-150 text-left cursor-pointer"
                >
                  <div className="w-full aspect-square bg-[#ffffff] rounded-[8px] flex items-center justify-center mb-2 overflow-hidden">
                    {product.image ? (
                      <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <Store size={20} className="text-[#d2d2d7]" strokeWidth={1} />
                    )}
                  </div>
                  <p className="font-apple-body text-[11px] font-normal leading-[1.3] tracking-[-0.06px] text-[#7a7a7a] mb-0.5 truncate">
                    {product.market?.name}
                  </p>
                  <p className="font-apple-body text-[13px] font-semibold leading-[1.38] tracking-[-0.08px] text-[#1d1d1f] truncate">
                    {product.name}
                  </p>
                  <p className="font-apple-body text-[13px] font-normal leading-[1.38] tracking-[-0.08px] text-[#1d1d1f] mt-0.5">
                    {(product.price / 655.957).toLocaleString("fr-FR", { style: "currency", currency: "XOF", maximumFractionDigits: 0 })}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="bg-[#ffffff] py-[60px] px-6">
        <div className="max-w-[980px] mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-apple-display text-[32px] font-semibold leading-[1.1] text-[#1d1d1f]">
              Mercados y Tiendas
            </h2>
            <button
              onClick={() => navigate("/mapa")}
              className="font-apple-body text-[15px] text-[#0066cc] hover:underline"
            >
              Ver en mapa
            </button>
          </div>
          {marketsLoading ? (
            <p className="text-[#7a7a7a]" role="status" aria-live="polite">Cargando…</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {markets.map((market) => (
                <div
                  key={market.id}
                  className="bg-[#f5f5f7] border border-[#d2d2d7]/40 p-6 rounded-[18px]"
                >
                  <h3 className="font-apple-display text-[24px] font-semibold leading-[1.16] text-[#1d1d1f] mb-2">
                    {market.name}
                  </h3>
                  <p className="font-apple-body text-[15px] font-normal leading-[1.47] tracking-[-0.374px] text-[#7a7a7a] mb-4">
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

      <section className="bg-[#ffffff] py-[60px] px-6">
        <div className="max-w-[980px] mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-apple-display text-[32px] font-semibold leading-[1.1] text-[#1d1d1f]">
              Mis Contactos
            </h2>
            <button
              onClick={() => navigate("/perfil?tab=contacts")}
              className="font-apple-body text-[15px] text-[#0066cc] hover:underline inline-flex items-center gap-1.5"
            >
              <Plus size={16} />
              Añadir contacto
            </button>
          </div>
          {contactsLoading ? (
            <p className="text-[#7a7a7a]" role="status" aria-live="polite">Cargando…</p>
          ) : contacts.length === 0 ? (
            <div className="text-center py-16">
              <Users size={48} className="text-[#d2d2d7] mx-auto mb-4" strokeWidth={1} />
              <p className="font-apple-body text-[17px] font-normal leading-[1.47] tracking-[-0.374px] text-[#7a7a7a] mb-4">
                No tienes contactos guardados
              </p>
              <ButtonPrimary onClick={() => navigate("/perfil?tab=contacts")}>
                Añadir tu primer contacto
              </ButtonPrimary>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {contacts.slice(0, 6).map((contact) => (
                <div
                  key={contact.id}
                  className="bg-[#f5f5f7] border border-[#d2d2d7]/40 p-6 rounded-[18px]"
                >
                  <h3 className="font-apple-display text-[20px] font-semibold leading-[1.2] text-[#1d1d1f] mb-1">
                    {contact.name}
                  </h3>
                  {contact.email && (
                    <p className="font-apple-body text-[15px] font-normal leading-[1.47] tracking-[-0.374px] text-[#7a7a7a]">
                      {contact.email}
                    </p>
                  )}
                  {contact.phone && (
                    <p className="font-apple-body text-[15px] font-normal leading-[1.47] tracking-[-0.374px] text-[#7a7a7a]">
                      {contact.phone}
                    </p>
                  )}
                  {contact.address && (
                    <p className="font-apple-body text-[15px] font-normal leading-[1.47] tracking-[-0.374px] text-[#7a7a7a] flex items-center gap-1 mt-2">
                      <MapPin size={14} />
                      {contact.address}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
