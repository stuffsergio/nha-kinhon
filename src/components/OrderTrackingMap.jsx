import { useCallback, useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import { Crosshair, MapPin, Navigation, Radio, Route } from "lucide-react";
import "leaflet/dist/leaflet.css";

const DEFAULT_CENTER = [11.863, -15.597];

const SIGNAL_CHIPS = {
  LIVE: { label: "En vivo", className: "bg-[#ecfdf5] text-[#059669]" },
  STALE: { label: "Señal antigua", className: "bg-[#fffbeb] text-[#d97706]" },
  NO_GPS: { label: "Repartidor sin señal", className: "bg-[#f5f5f7] text-[#7a7a7a]" },
};

function courierDivIcon(stale, frozen) {
  const bg = stale ? "#d97706" : "#0066cc";
  const opacity = frozen ? "0.92" : "1";
  const outline = frozen ? "2px dashed rgba(255,255,255,0.9)" : "3px solid white";
  return L.divIcon({
    className: "",
    html: `<div style="width:36px;height:36px;border-radius:50%;background:${bg};border:${outline};box-shadow:0 2px 8px rgba(0,0,0,0.25);display:flex;align-items:center;justify-content:center;opacity:${opacity};">
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

function MapViewportController({ mode, courier, destination, boundsKey }) {
  const map = useMap();

  useEffect(() => {
    if (!mode) return;

    if (mode === "courier" && courier) {
      map.setView([courier.lat, courier.lng], Math.max(map.getZoom(), 15), { animate: true });
      return;
    }

    if (mode === "destination" && destination?.lat != null && destination?.lng != null) {
      map.setView([destination.lat, destination.lng], Math.max(map.getZoom(), 15), { animate: true });
      return;
    }

    if (mode === "both") {
      const points = [];
      if (courier) points.push([courier.lat, courier.lng]);
      if (destination?.lat != null && destination?.lng != null) {
        points.push([destination.lat, destination.lng]);
      }
      if (points.length === 0) {
        map.setView(DEFAULT_CENTER, 13);
      } else if (points.length === 1) {
        map.setView(points[0], 14, { animate: true });
      } else {
        map.fitBounds(L.latLngBounds(points), { padding: [48, 48], maxZoom: 15, animate: true });
      }
    }
  }, [mode, courier, destination, map, boundsKey]);

  return null;
}

function formatRelativeAgeSeconds(totalSeconds) {
  if (totalSeconds == null) return null;
  if (totalSeconds < 8) return "ahora";
  if (totalSeconds < 60) return `hace ${totalSeconds} s`;
  const minutes = Math.floor(totalSeconds / 60);
  if (minutes === 1) return "hace 1 min";
  return `hace ${minutes} min`;
}

function resolveSignalState(tracking) {
  if (tracking?.courierSignalState) return tracking.courierSignalState;
  if (tracking?.isLive) return "LIVE";
  if (tracking?.courierLocationStale) return "STALE";
  if (tracking?.courierLocation) return "STALE";
  return "NO_GPS";
}

export default function OrderTrackingMap({
  tracking,
  isFetching = false,
  compact = false,
  destinationOnly = null,
}) {
  const courier = tracking?.courierLocation;
  const destination = tracking?.destination ?? destinationOnly;
  const hasDestination = destination?.lat != null && destination?.lng != null;
  const hasCourier = courier != null;

  const signalState = resolveSignalState(tracking);
  const isFrozen = signalState === "STALE";
  const statusChip = SIGNAL_CHIPS[signalState] ?? SIGNAL_CHIPS.NO_GPS;

  const [ageTick, setAgeTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setAgeTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    setAgeTick(0);
  }, [tracking?.lastLocationAgeSeconds, tracking?.lastLocationAt]);

  const displayedAgeSeconds =
    tracking?.lastLocationAgeSeconds != null
      ? tracking.lastLocationAgeSeconds + ageTick
      : null;

  const routePositions = useMemo(() => {
    if (tracking?.routePolyline?.length >= 2) return tracking.routePolyline;
    if (!hasCourier || !hasDestination) return null;
    return [
      [courier.lat, courier.lng],
      [destination.lat, destination.lng],
    ];
  }, [tracking?.routePolyline, courier, destination, hasCourier, hasDestination]);

  const [cameraMode, setCameraMode] = useState("both");
  const [boundsKey, setBoundsKey] = useState(0);

  const triggerCamera = useCallback((mode) => {
    setCameraMode(mode);
    setBoundsKey((k) => k + 1);
  }, []);

  const mapHeight = compact ? "h-[140px]" : "h-[280px] sm:h-[320px]";

  const showStaleHint = isFrozen && hasCourier;

  return (
    <div className="space-y-3">
      {!destinationOnly && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Radio
              size={16}
              className={signalState === "LIVE" ? "text-[#059669]" : "text-[#7a7a7a]"}
            />
            <span
              className={`px-3 py-1 rounded-[9999px] font-apple-body text-[13px] font-medium ${statusChip.className}`}
            >
              {statusChip.label}
            </span>
            {isFetching && signalState === "LIVE" && (
              <span className="font-apple-body text-[12px] text-[#7a7a7a]">Actualizando…</span>
            )}
            {tracking?.etaLabel && hasCourier && hasDestination && (
              <span className="font-apple-body text-[13px] text-[#1d1d1f] bg-[#ffffff] border border-[#e0e0e0] px-2.5 py-1 rounded-[9999px]">
                ETA {tracking.etaLabel}
              </span>
            )}
          </div>
          <div className="text-right">
            {displayedAgeSeconds != null && (
              <p className="font-apple-body text-[13px] text-[#7a7a7a]">
                Última señal: {formatRelativeAgeSeconds(displayedAgeSeconds)}
              </p>
            )}
            {showStaleHint && (
              <p className="font-apple-body text-[12px] text-[#d97706] max-w-[240px]">
                Ubicación congelada; el repartidor puede estar sin señal.
              </p>
            )}
          </div>
        </div>
      )}

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
        <div
          className={`relative ${mapHeight} rounded-[14px] overflow-hidden border border-[#e0e0e0]`}
        >
          <MapContainer
            center={DEFAULT_CENTER}
            zoom={13}
            className="h-full w-full z-0"
            zoomControl={!compact}
            scrollWheelZoom={!compact}
            dragging={!compact}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapViewportController
              mode={cameraMode}
              courier={hasCourier ? courier : null}
              destination={destination}
              boundsKey={boundsKey}
            />
            {hasCourier && (
              <Marker
                position={[courier.lat, courier.lng]}
                icon={courierDivIcon(isFrozen, isFrozen)}
              />
            )}
            {hasDestination && (
              <Marker position={[destination.lat, destination.lng]} icon={destinationIcon} />
            )}
            {routePositions && !destinationOnly && (
              <Polyline
                positions={routePositions}
                pathOptions={{
                  color: isFrozen ? "#d97706" : "#0066cc",
                  weight: compact ? 3 : 4,
                  opacity: isFrozen ? 0.55 : 0.8,
                  dashArray: isFrozen ? "6 10" : undefined,
                }}
              />
            )}
          </MapContainer>

          {!compact && (hasCourier || hasDestination) && (
            <div className="absolute bottom-3 right-3 z-[400] flex flex-col gap-1.5">
              {hasCourier && (
                <button
                  type="button"
                  onClick={() => triggerCamera("courier")}
                  className="flex items-center gap-1.5 rounded-[10px] bg-[#ffffff]/95 backdrop-blur px-3 py-2 text-[12px] font-medium text-[#1d1d1f] shadow-sm border border-[#e0e0e0] hover:bg-[#f5f5f7]"
                  title="Centrar en repartidor"
                >
                  <Crosshair size={14} className="text-[#0066cc]" />
                  Repartidor
                </button>
              )}
              {hasDestination && (
                <button
                  type="button"
                  onClick={() => triggerCamera("destination")}
                  className="flex items-center gap-1.5 rounded-[10px] bg-[#ffffff]/95 backdrop-blur px-3 py-2 text-[12px] font-medium text-[#1d1d1f] shadow-sm border border-[#e0e0e0] hover:bg-[#f5f5f7]"
                  title="Centrar en destino"
                >
                  <MapPin size={14} className="text-[#059669]" />
                  Destino
                </button>
              )}
              {hasCourier && hasDestination && (
                <button
                  type="button"
                  onClick={() => triggerCamera("both")}
                  className="flex items-center gap-1.5 rounded-[10px] bg-[#ffffff]/95 backdrop-blur px-3 py-2 text-[12px] font-medium text-[#1d1d1f] shadow-sm border border-[#e0e0e0] hover:bg-[#f5f5f7]"
                  title="Encuadrar repartidor y destino"
                >
                  <Route size={14} className="text-[#7a7a7a]" />
                  Ver ambos
                </button>
              )}
            </div>
          )}
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
