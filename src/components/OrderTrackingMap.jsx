import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import { Navigation, MapPin, Radio } from "lucide-react";
import "leaflet/dist/leaflet.css";

const DEFAULT_CENTER = [11.863, -15.597];

function courierDivIcon(stale) {
  const bg = stale ? "#d97706" : "#0066cc";
  return L.divIcon({
    className: "",
    html: `<div style="width:36px;height:36px;border-radius:50%;background:${bg};border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.25);display:flex;align-items:center;justify-content:center;">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>
    </div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
}

const destinationIcon = L.divIcon({
  className: "",
  html: `<div style="width:32px;height:32px;border-radius:50%;background:#059669;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.2);display:flex;align-items:center;justify-content:center;">
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
  </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

function FitRouteBounds({ courier, destination }) {
  const map = useMap();
  const points = useMemo(() => {
    const list = [];
    if (courier) list.push([courier.lat, courier.lng]);
    if (destination?.lat != null && destination?.lng != null) {
      list.push([destination.lat, destination.lng]);
    }
    return list;
  }, [courier, destination]);

  useEffect(() => {
    if (points.length === 0) {
      map.setView(DEFAULT_CENTER, 13);
      return;
    }
    if (points.length === 1) {
      map.setView(points[0], 14);
      return;
    }
    map.fitBounds(L.latLngBounds(points), { padding: [48, 48], maxZoom: 15 });
  }, [map, points]);

  return null;
}

function formatUpdatedAt(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    day: "numeric",
    month: "short",
  });
}

export default function OrderTrackingMap({ tracking, isFetching = false }) {
  const courier = tracking?.courierLocation;
  const destination = tracking?.destination;
  const hasDestination =
    destination?.lat != null && destination?.lng != null;
  const hasCourier = courier != null;

  const polyline = useMemo(() => {
    if (!hasCourier || !hasDestination) return null;
    return [
      [courier.lat, courier.lng],
      [destination.lat, destination.lng],
    ];
  }, [courier, destination, hasCourier, hasDestination]);

  const statusChip = tracking?.isLive
    ? { label: "En vivo", className: "bg-[#ecfdf5] text-[#059669]" }
    : tracking?.courierLocationStale
      ? { label: "Ubicación desactualizada", className: "bg-[#fffbeb] text-[#d97706]" }
      : hasCourier
        ? { label: "Última ubicación", className: "bg-[#f5f5f7] text-[#1d1d1f]" }
        : { label: "Esperando GPS del repartidor", className: "bg-[#f5f5f7] text-[#7a7a7a]" };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Radio
            size={16}
            className={tracking?.isLive ? "text-[#059669]" : "text-[#7a7a7a]"}
          />
          <span
            className={`px-3 py-1 rounded-[9999px] font-apple-body text-[13px] font-medium ${statusChip.className}`}
          >
            {statusChip.label}
          </span>
          {isFetching && tracking?.isLive && (
            <span className="font-apple-body text-[12px] text-[#7a7a7a]">Actualizando…</span>
          )}
        </div>
        {courier?.updatedAt && (
          <p className="font-apple-body text-[13px] text-[#7a7a7a]">
            GPS: {formatUpdatedAt(courier.updatedAt)}
          </p>
        )}
      </div>

      {!hasCourier && !hasDestination && (
        <div className="rounded-[12px] border border-dashed border-[#e0e0e0] bg-[#f5f5f7] p-6 text-center">
          <Navigation size={28} className="mx-auto text-[#7a7a7a] mb-2" />
          <p className="font-apple-body text-[15px] text-[#1d1d1f]">
            El repartidor aún no ha compartido su ubicación.
          </p>
          <p className="font-apple-body text-[14px] text-[#7a7a7a] mt-1">
            Cuando active el GPS verás su posición aquí en tiempo casi real.
          </p>
        </div>
      )}

      {(hasCourier || hasDestination) && (
        <div className="relative h-[280px] sm:h-[320px] rounded-[14px] overflow-hidden border border-[#e0e0e0]">
          <MapContainer
            center={DEFAULT_CENTER}
            zoom={13}
            className="h-full w-full z-0"
            zoomControl
            scrollWheelZoom
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <FitRouteBounds courier={hasCourier ? courier : null} destination={destination} />
            {hasCourier && (
              <Marker
                position={[courier.lat, courier.lng]}
                icon={courierDivIcon(Boolean(tracking?.courierLocationStale))}
              />
            )}
            {hasDestination && (
              <Marker position={[destination.lat, destination.lng]} icon={destinationIcon} />
            )}
            {polyline && (
              <Polyline
                positions={polyline}
                pathOptions={{ color: "#0066cc", weight: 4, opacity: 0.75, dashArray: "8 8" }}
              />
            )}
          </MapContainer>
        </div>
      )}

      {destination?.address && (
        <div className="flex items-start gap-2 text-[14px] text-[#7a7a7a]">
          <MapPin size={16} className="shrink-0 mt-0.5 text-[#059669]" />
          <span className="font-apple-body">
            Entrega: <span className="text-[#1d1d1f]">{destination.name}</span>
            {destination.address ? ` — ${destination.address}` : ""}
          </span>
        </div>
      )}
    </div>
  );
}
