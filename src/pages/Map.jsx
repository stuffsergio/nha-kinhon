import { useState, useMemo, useCallback, useEffect } from "react";
import { MapContainer, TileLayer, ZoomControl, useMap } from "react-leaflet";
import L from "leaflet";
import { Search, Crosshair } from "lucide-react";
import { useMarkets } from "../hooks/useMarkets";
import MarketMarker from "../components/MarketMarker";
import MarketModal from "../components/MarketModal";
import "leaflet/dist/leaflet.css";

const typeFilters = [
  { key: "MERCADO_LOCAL", label: "Mercado Local", color: "#dc3545" },
  { key: "SUPERMERCADO", label: "Supermercado", color: "#0066cc" },
  { key: "TIENDA_ESPECIALIZADA", label: "Tienda Especializada", color: "#7c3aed" },
];

const center = [11.95, -15.25];
const bounds = [
  [10.8, -17.0],
  [13.0, -13.5],
];

function FitBoundsOnLoad({ markets }) {
  const map = useMap();

  const validMarkets = useMemo(
    () => markets.filter((m) => m.lat != null && m.lng != null),
    [markets]
  );

  useEffect(() => {
    if (validMarkets.length === 0) return;
    const coords = validMarkets.map((m) => [m.lat, m.lng]);
    const group = L.latLngBounds(coords);
    map.fitBounds(group, { padding: [50, 50], maxZoom: 12 });
  }, [validMarkets, map]);

  const fit = useCallback(() => {
    if (validMarkets.length === 0) {
      map.setView(center, 8);
      return;
    }
    const coords = validMarkets.map((m) => [m.lat, m.lng]);
    const group = L.latLngBounds(coords);
    map.fitBounds(group, { padding: [50, 50], maxZoom: 12 });
  }, [validMarkets, map]);

  return (
    <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
      <button
        onClick={fit}
        className="w-10 h-10 bg-white rounded-[10px] shadow-lg flex items-center justify-center hover:bg-[#f5f5f7] transition-colors border border-[#e0e0e0]"
        title="Centrar en todos los mercados"
      >
        <Crosshair size={18} className="text-[#1d1d1f]" />
      </button>
    </div>
  );
}

export default function Map() {
  const [selectedMarket, setSelectedMarket] = useState(null);
  const [search, setSearch] = useState("");
  const [activeTypes, setActiveTypes] = useState(["MERCADO_LOCAL", "SUPERMERCADO", "TIENDA_ESPECIALIZADA"]);
  const { data: marketsRes, isLoading } = useMarkets();
  const markets = marketsRes?.data || [];

  const filteredMarkets = useMemo(() => {
    return markets.filter((m) => {
      if (!activeTypes.includes(m.type)) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        m.name.toLowerCase().includes(q) ||
        m.location.toLowerCase().includes(q)
      );
    });
  }, [markets, activeTypes, search]);

  const toggleType = (type) => {
    setActiveTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  return (
    <div className="w-full max-w-[1280px] mx-auto pt-[40px] pb-[80px] px-6">
      <div className="mb-8">
        <h1 className="font-apple-display text-[48px] lg:text-[56px] font-semibold leading-[1.07] tracking-[-0.28px] text-[#1d1d1f] mb-2">
          Mapa de Mercados
        </h1>
        <p className="font-apple-body text-[17px] text-[#7a7a7a] leading-[1.6]">
          Encuentra mercados, supermercados y tiendas especializadas en Guinea Bissau
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 mb-5">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7a7a7a] pointer-events-none" />
          <label htmlFor="map-search" className="sr-only">Buscar por nombre o ubicación</label>
          <input
            id="map-search"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o ubicación…"
            autoComplete="off"
            spellCheck={false}
            className="w-full pl-11 pr-4 py-3 bg-white border border-[#e0e0e0] rounded-[12px] focus-visible:outline-2 focus-visible:outline-[#0071e3] focus-visible:outline-offset-2 focus:border-transparent font-apple-body text-[15px] text-[#1d1d1f] placeholder:text-[#7a7a7a] transition-shadow duration-150"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        {typeFilters.map((f) => {
          const active = activeTypes.includes(f.key);
          return (
            <button
              key={f.key}
              onClick={() => toggleType(f.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-[9999px] font-apple-body text-[14px] font-normal leading-[1.43] tracking-[-0.224px] transition-all ${
                active
                  ? "text-white shadow-sm"
                  : "text-[#7a7a7a] bg-white border border-[#e0e0e0] hover:bg-[#f5f5f7]"
              }`}
              style={active ? { backgroundColor: f.color } : {}}
            >
              <span className={`w-2.5 h-2.5 rounded-full ${active ? "bg-white/80" : ""}`}
                style={!active ? { backgroundColor: f.color } : {}}
              />
              {f.label}
            </button>
          );
        })}
        <div className="ml-auto flex items-center gap-2 font-apple-body text-[13px] text-[#7a7a7a]">
          <span>{filteredMarkets.length} mercados</span>
        </div>
      </div>

      <div className="relative rounded-[18px] overflow-hidden border border-[#e0e0e0] shadow-lg h-[65vh] lg:h-[72vh]">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-[#f5f5f7] z-50">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-[#0066cc] border-t-transparent rounded-full animate-spin" />
              <p className="font-apple-body text-[15px] text-[#7a7a7a]">Cargando mapa...</p>
            </div>
          </div>
        ) : null}

        <MapContainer
          center={center}
          zoom={8}
          minZoom={7}
          maxBounds={bounds}
          maxBoundsViscosity={1}
          zoomControl={false}
          className="w-full h-full"
        >
          <ZoomControl position="bottomright" />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {filteredMarkets.map((market) => (
            <MarketMarker
              key={market.id}
              market={market}
              onClick={setSelectedMarket}
              isSelected={selectedMarket?.id === market.id}
            />
          ))}
          <FitBoundsOnLoad markets={filteredMarkets} />
        </MapContainer>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        {filteredMarkets.length === 0 ? (
          <p className="font-apple-body text-[15px] text-[#7a7a7a] col-span-full text-center py-12">
            No se encontraron mercados con los filtros actuales.
          </p>
        ) : (
          filteredMarkets.map((m) => {
            const f = typeFilters.find((t) => t.key === m.type) || typeFilters[0];
            return (
              <button
                key={m.id}
                onClick={() => setSelectedMarket(m)}
                className="text-left bg-white border border-[#e0e0e0] p-4 rounded-[14px] no-shadow hover:border-[#0071e3] hover:shadow-sm transition-all group"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: f.color }} />
                  <div className="flex-1 min-w-0">
                    <p className="font-apple-body text-[15px] font-semibold text-[#1d1d1f] truncate group-hover:text-[#0066cc] transition-colors">
                      {m.name}
                    </p>
                    <p className="font-apple-body text-[12px] text-[#7a7a7a] truncate">{m.location}</p>
                  </div>
                  <span className="px-2 py-0.5 bg-[#f5f5f7] rounded-full font-apple-body text-[11px] text-[#7a7a7a] whitespace-nowrap">{f.label}</span>
                </div>
                <div className="flex items-center justify-between text-[12px] text-[#7a7a7a]">
                  <span>{m._count?.products || 0} productos</span>
                  <span className="font-apple-body text-[11px] text-[#0066cc] opacity-0 group-hover:opacity-100 transition-opacity">Ver productos →</span>
                </div>
              </button>
            );
          })
        )}
      </div>

      {selectedMarket && (
        <MarketModal
          market={selectedMarket}
          onClose={() => setSelectedMarket(null)}
        />
      )}
    </div>
  );
}
