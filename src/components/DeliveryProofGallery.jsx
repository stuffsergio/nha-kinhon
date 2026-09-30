export default function DeliveryProofGallery({ photos = [], legacyPhoto = null }) {
  const urls = [
    ...photos.map((p) => (typeof p === "string" ? p : p.url)),
    ...(legacyPhoto && !photos.some((p) => (p.url || p) === legacyPhoto) ? [legacyPhoto] : []),
  ].filter(Boolean);

  if (urls.length === 0) return null;

  return (
    <div>
      <p className="font-apple-body text-[13px] text-[#7a7a7a] mb-2">
        {urls.length > 1 ? "Pruebas de entrega" : "Prueba de entrega"}
      </p>
      <div className={`grid gap-3 ${urls.length > 1 ? "grid-cols-2 sm:grid-cols-3" : ""}`}>
        {urls.map((url, index) => (
          <img
            key={`${url.slice(0, 32)}-${index}`}
            src={url}
            alt={`Prueba de entrega ${index + 1}`}
            className="w-full max-h-[260px] object-cover rounded-[12px] border border-[#e0e0e0]"
          />
        ))}
      </div>
    </div>
  );
}
