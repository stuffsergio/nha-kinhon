import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MapPin, Clock, Phone, ArrowLeft, Apple, ShoppingCart, ChevronDown, ChevronUp } from "lucide-react";
import { useMarket } from "../hooks/useMarkets";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import ButtonPrimary from "../components/ButtonPrimary";

const typeConfig = {
  MERCADO_LOCAL: { label: "Mercado Local", color: "#dc3545" },
  SUPERMERCADO: { label: "Supermercado", color: "#0066cc" },
  TIENDA_ESPECIALIZADA: { label: "Tienda Especializada", color: "#7c3aed" },
};

function groupByCategory(products) {
  const groups = {};
  products.forEach((p) => {
    const cat = p.category?.name || "Otros";
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(p);
  });
  return groups;
}

export default function MarketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const toast = useToast();
  const { data: marketRes, isLoading } = useMarket(id);
  const [addingId, setAddingId] = useState(null);
  const [collapsedCats, setCollapsedCats] = useState({});

  const market = marketRes?.market;
  const products = market?.products || [];
  const cfg = typeConfig[market?.type] || typeConfig.MERCADO_LOCAL;

  const handleAddToCart = async (product) => {
    if (!user) { navigate("/login"); return; }
    setAddingId(product.id);
    try {
      await addToCart(product);
      toast(`${product.name} añadido al carrito`, "success");
    } catch {}
    setAddingId(null);
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-[980px] mx-auto py-[80px] px-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-[#f5f5f7] rounded w-1/4" />
          <div className="h-6 bg-[#f5f5f7] rounded w-1/2" />
          <div className="h-40 bg-[#f5f5f7] rounded" />
        </div>
      </div>
    );
  }

  if (!market) {
    return (
      <div className="w-full max-w-[980px] mx-auto py-[80px] px-6 text-center">
        <h1 className="font-apple-display text-[40px] text-[#1d1d1f] mb-4">Tienda no encontrada</h1>
        <ButtonPrimary onClick={() => navigate("/mapa")}>Volver al mapa</ButtonPrimary>
      </div>
    );
  }

  const grouped = groupByCategory(products);

  return (
    <div className="w-full max-w-[980px] mx-auto py-[40px] md:py-[60px] px-6 space-y-8">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 font-apple-body text-[15px] text-[#0066cc] hover:underline"
      >
        <ArrowLeft size={18} /> Volver
      </button>

      <div
        className="rounded-[18px] p-6 md:p-8 text-white"
        style={{ background: `linear-gradient(135deg, ${cfg.color}, ${cfg.color}cc)` }}
      >
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="space-y-1">
            <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur rounded-full text-white font-apple-body text-[12px] font-semibold uppercase tracking-[0.5px]">
              {cfg.label}
            </span>
            <h1 className="font-apple-display text-[30px] sm:text-[40px] font-semibold leading-[1.07] tracking-[-0.28px] text-white mt-2">
              {market.name}
            </h1>
          </div>
          <span className="font-apple-display text-[20px] sm:text-[28px] font-semibold text-white/90 shrink-0">{products.length} productos</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          <div className="flex items-center gap-2 text-white/80">
            <MapPin size={16} />
            <span className="font-apple-body text-[14px]">{market.address || market.location}</span>
          </div>
          {market.phone && (
            <div className="flex items-center gap-2 text-white/80">
              <Phone size={16} />
              <span className="font-apple-body text-[14px]">{market.phone}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-white/80">
            <Clock size={16} />
            <span className="font-apple-body text-[14px]">{market.hours}</span>
          </div>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-20">
          <ShoppingCart size={48} className="mx-auto mb-4 text-[#7a7a7a]" />
          <p className="font-apple-body text-[17px] text-[#7a7a7a]">Esta tienda aún no tiene productos disponibles.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([categoryName, catProducts]) => {
            const isCollapsed = collapsedCats[categoryName];
            return (
              <div key={categoryName} className="bg-white border border-[#e0e0e0] rounded-[18px] overflow-hidden no-shadow">
                <button
                  onClick={() => setCollapsedCats((prev) => ({ ...prev, [categoryName]: !prev[categoryName] }))}
                  className="w-full flex items-center justify-between px-6 py-4 hover:bg-[#f5f5f7] transition-colors"
                >
                  <h3 className="font-apple-display text-[22px] font-semibold leading-[1.14] text-[#1d1d1f]">
                    {categoryName}
                    <span className="ml-2 text-[15px] text-[#7a7a7a] font-normal">({catProducts.length})</span>
                  </h3>
                  {isCollapsed ? <ChevronDown size={20} className="text-[#7a7a7a]" /> : <ChevronUp size={20} className="text-[#7a7a7a]" />}
                </button>
                {!isCollapsed && (
                  <div className="divide-y divide-[#e0e0e0]">
                    {catProducts.map((product) => (
                      <div key={product.id} className="flex items-center justify-between px-6 py-3 hover:bg-[#f5f5f7] transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-[#f5f5f7] rounded-full flex items-center justify-center">
                            <Apple size={20} className="text-[#1d1d1f]" />
                          </div>
                          <div>
                            <p className="font-apple-body text-[16px] font-medium text-[#1d1d1f]">{product.name}</p>
                            <p className="font-apple-body text-[13px] text-[#7a7a7a]">
                              {product.price.toLocaleString()} FCFA / {product.unit}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleAddToCart(product)}
                          disabled={addingId === product.id}
                          className="px-4 py-2 bg-[#0066cc] text-white rounded-[9999px] font-apple-body text-[14px] hover:bg-[#0071e3] transition-colors disabled:bg-[#d2d2d7] disabled:cursor-not-allowed"
                        >
                          {addingId === product.id ? "..." : "Agregar"}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
