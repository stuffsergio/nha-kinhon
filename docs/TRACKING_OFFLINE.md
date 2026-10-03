# Seguimiento y APIs en redes lentas (2G / intermitentes)

Contrato pensado para clientes móviles en Guinea-Bissau. **Compatibilidad:** las respuestas completas siguen siendo el comportamiento por defecto; lo descrito aquí es opt-in.

## Compresión HTTP

- El backend comprime respuestas JSON con **gzip/deflate** (`compression`) y **brotli** cuando el cliente envía `Accept-Encoding: br`.
- Umbral aproximado: 512 bytes. Cabecera de respuesta: `Content-Encoding: gzip` o `br`.
- Los clientes deben enviar `Accept-Encoding: gzip, deflate, br` en todas las peticiones API.

## Seguimiento en vivo — respuesta completa (default)

`GET /api/orders/:id/tracking` (comprador) y `GET /api/admin/orders/:id/tracking` (admin).

Sin cambios respecto al payload histórico: `courierSignalState`, `courierLocation`, `routePolyline`, `etaLabel`, `destination` con nombre/dirección, teléfono del repartidor, etc.

## Seguimiento lean (menor ancho de banda)

Opt-in de una de estas formas:

| Método | Ejemplo |
|--------|---------|
| Query | `GET .../tracking?fields=lean` |
| Ruta dedicada | `GET .../tracking/lean` |
| Accept | `Accept: application/vnd.nhakinhon.tracking.lean+json` |

Respuesta:

```json
{
  "lean": true,
  "tracking": {
    "orderId": "...",
    "status": "IN_TRANSIT",
    "courierSignalState": "LIVE",
    "courierLocation": { "lat": 11.86, "lng": -15.59, "updatedAt": "...", "heading": 90 },
    "lastLocationAgeSeconds": 12,
    "etaSeconds": 420,
    "etaLabel": "~7 min",
    "destination": { "lat": 11.87, "lng": -15.60 },
    "routePolyline": [[11.86, -15.59], [11.865, -15.595]]
  }
}
```

**Omite:** `deliveryName`, `deliveryPhone`, `deliveryId`, `destination.name/address`, `isLive`, `courierLocationStale`, `lastLocationAt`, `routeDistanceMeters`.

**Polyline:** decimación uniforme (máx. ~32 vértices) manteniendo inicio y fin. Para dibujar mapa detallado en Wi‑Fi, usar la respuesta completa ocasionalmente.

### Señal GPS (`courierSignalState`)

- `LIVE` — pedido en `PICKED_UP` o `IN_TRANSIT` y `courierLocation.updatedAt` ≤ 2 min.
- `STALE` — hay coordenadas pero más antiguas; **no animar** el marcador como si se moviera.
- `NO_GPS` — en reparto pero sin coordenadas válidas.
- `null` — estados anteriores al reparto en vivo.

## Intervalos de polling recomendados

| Red | `GET .../tracking` (lean) | Notas |
|-----|---------------------------|--------|
| Buena (4G/Wi‑Fi) | 5–10 s | Solo mientras `status` ∈ `PICKED_UP`, `IN_TRANSIT` |
| Débil (2G/3G inestable) | 20–30 s | Usar siempre `?fields=lean` |
| Pestaña/app en segundo plano | 60 s o pausar | Respetar ahorro de batería |
| Pedido no en reparto | No hacer polling | Usar detalle de pedido |

El servidor **no** impone estos intervalos (no rompe clientes antiguos). Evitar polling < 5 s salvo necesidad extrema.

## Ingesta GPS del repartidor

`PUT /api/delivery/location` (auth repartidor).

### Punto único (compatible)

```json
{ "lat": 11.86, "lng": -15.59, "heading": 180, "accuracy": 15, "speed": 6.5 }
```

`updatedAt` opcional (ISO 8601). Si falta, el servidor usa la hora de recepción.

### Lote (cola offline)

```json
{
  "points": [
    { "lat": 11.86, "lng": -15.59, "updatedAt": "2026-10-03T12:00:01.000Z" },
    { "lat": 11.861, "lng": -15.591, "updatedAt": "2026-10-03T12:00:15.000Z" }
  ]
}
```

- Máximo **64** puntos por petición.
- Ordenados por el servidor según `updatedAt` (más antiguo primero).
- **Idempotente:** puntos con timestamp ≤ ubicación almacenada se ignoran (`skippedOlder` en respuesta).
- Tras aplicar el lote, solo la posición **más reciente** queda en `deliveryProfile.currentLocation`.

Respuesta:

```json
{
  "message": "Ubicación actualizada",
  "location": { "lat": 11.861, "lng": -15.591, "updatedAt": "..." },
  "applied": 2,
  "skippedOlder": 0
}
```

Recomendación móvil: acumular puntos localmente cada 5–15 s en reparto; flush en lote al recuperar red.

## Listados más ligeros

- `GET /api/orders` (mis pedidos): ya no incluye `deliveryPhotos` en el listado; las fotos siguen en `GET /api/orders/:id` y `GET /api/orders/:id/delivery-photos`.
