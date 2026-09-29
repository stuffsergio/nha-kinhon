import { useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { MapPin } from "lucide-react";
import "leaflet/dist/leaflet.css";

const BISSAU_CENTER = [11.863, -15.597];

const pinIcon = L.divIcon({
  className: "",
  html: `<div style="width:28px;height:28px;border-radius:50% 50% 50% 0;background:#0066cc;border:2px solid white;transform:rotate(-45deg);box-shadow:0 2px 6px rgba(0,0,0,0.25);"></div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 28],
});

function ClickHandler({ onPick }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function RecipientMapPicker({ lat, lng, onChange }) {
  const [open, setOpen] = useState(lat != null && lng != null);

  const position = lat != null && lng != null ? [lat, lng] : null;

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="font-apple-body text-[14px] text-[#0066cc] hover:underline flex items-center gap-1"
      >
        <MapPin size={14} />
        {open ? "Ocultar mapa de entrega" : "Marcar ubicación en mapa (opcional)"}
      </button>
      {open && (
        <>
          <p className="font-apple-body text-[13px] text-[#7a7a7a]">
            Toca el mapa donde debe entregarse el pedido. Ayuda al repartidor y al seguimiento en vivo.
          </p>
          <div className="h-[220px] rounded-[12px] overflow-hidden border border-[#e0e0e0]">
            <MapContainer center={BISSAU_CENTER} zoom={13} className="h-full w-full">
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <ClickHandler
                onPick={(newLat, newLng) => onChange({ lat: newLat, lng: newLng })}
              />
              {position && <Marker position={position} icon={pinIcon} />}
            </MapContainer>
          </div>
          {position && (
            <p className="font-apple-body text-[12px] text-[#7a7a7a] tabular-nums">
              Coordenadas: {lat.toFixed(5)}, {lng.toFixed(5)}{" "}
              <button
                type="button"
                className="text-[#0066cc] ml-2"
                onClick={() => onChange({ lat: null, lng: null })}
              >
                Quitar
              </button>
            </p>
          )}
        </>
      )}
    </div>
  );
}
