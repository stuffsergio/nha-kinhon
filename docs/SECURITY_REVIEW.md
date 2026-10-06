# Revisión de seguridad OWASP — Nha Kinhon

Fecha: 2026-10-06  
Alcance: API Express (`backend/`), SPA React (`src/`), integraciones Stripe / OSRM / Expo.  
Referencia: [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/index.html).

Leyenda: **Severidad** Critical / High / Medium / Low · **Estado** fixed / accepted / needs follow-up

---

## Resumen ejecutivo

| Severidad | Hallazgos | Corregidos en PR |
|-----------|-----------|------------------|
| Critical  | 1         | 1                |
| High      | 4         | 3                |
| Medium    | 12        | 9                |
| Low       | 6         | 2                |

---

## Authentication / Password Storage / Session Management / JWT

| Hallazgo | Sev. | Estado | Notas |
|----------|------|--------|-------|
| Contraseñas con bcrypt (cost 10) | — | accepted | Alineado con Password Storage CS |
| JWT access + refresh rotado en DB | — | accepted | Session Management CS |
| Rate limit login/registro (20/15 min) | Low | fixed | Centralizado en `rateLimits.js` |
| Refresh sin límite | Medium | fixed | `refreshLimiter` 60/15 min |
| Refresh cookie `SameSite=none` + CSRF | High | fixed (parcial) | `requireSameSiteOrigin` en `/auth/refresh` y `/auth/logout` cuando hay `Origin`/`Referer`. Clientes nativos sin cabeceras: **accepted** — documentar migración a refresh en body si se expone cookie en WebView |
| Sin política de complejidad de contraseña en registro | Low | needs follow-up | Valorar zod mín. 8 caracteres |
| Forgot password | — | N/A | No implementado en la app |

## Authorization / IDOR

| Ruta / recurso | Sev. | Estado | Notas |
|----------------|------|--------|-------|
| `POST /orders/:id/confirm-payment` sin pago | **Critical** | **fixed** | Verificación Stripe server-side (`assertStripePaymentSucceededForOrder`) |
| Pedidos, recibo, fotos, tracking | — | accepted | Ya filtraban por `userId` / ADMIN |
| Carrito `items/:id` | — | accepted | `userId` en query |
| Contactos `PUT` mass assignment | Medium | **fixed** | Solo `name` / `phone` |
| `DELETE /notifications/push-token` | Medium | **fixed** | Borra solo tokens del usuario autenticado |
| Admin `PUT /orders/:id/status` | — | accepted | `requireAdmin` |
| Delivery pickup/status/fotos | — | accepted | `deliveryId` |

## REST / Input Validation / Mass Assignment / Injection

| Hallazgo | Sev. | Estado |
|----------|------|--------|
| Prisma ORM (sin `$queryRaw` en app) | — | accepted |
| Checkout body amplio | Low | accepted | Campos acotados en controller |
| JSON body 5mb | Medium | accepted | Necesario para fotos; límites por imagen añadidos |

## File Upload (fotos de entrega)

| Hallazgo | Sev. | Estado |
|----------|------|--------|
| Solo regex MIME en data URL | High | **fixed** | Magic bytes JPEG/PNG/WebP + tamaño decodificado ≤ 2MB |
| Sin límite de fotos | Medium | **fixed** | 5/solicitud, 12/pedido |
| URLs `http(s)` arbitrarias | Low | accepted | Solo repartidor asignado; Cloudinary no usado |

## Node.js / NPM / Error Handling / Logging

| Hallazgo | Sev. | Estado |
|----------|------|--------|
| `npm audit`: bcrypt→tar, vitest mocker, etc. | High | needs follow-up | Ver sección Dependencias |
| Errores 500 filtraban `err.message` | Medium | **fixed** | Mensaje genérico en producción |
| Logs de notificación con userId | Low | accepted | Sin tokens ni contraseñas |
| `payment.service.js` stub | Low | accepted | No expuesto en rutas |

## HTTP Headers / HSTS / CSP / CORS / CSRF / Clickjacking

| Hallazgo | Sev. | Estado |
|----------|------|--------|
| Sin Helmet | Medium | **fixed** | HSTS (prod), `frameguard: deny`, Referrer-Policy |
| CSP | Medium | needs follow-up | Desactivado en API JSON; configurar en Vercel para SPA |
| CORS: lista vacía permitía todo | **High** | **fixed** | En producción exige `CLIENT_URL`; dev permisivo si vacío |
| CSRF refresh (véase Auth) | High | fixed (parcial) | Ver arriba |
| `X-Powered-By` | Low | **fixed** | `app.disable("x-powered-by")` |

## XSS (React)

| Hallazgo | Sev. | Estado |
|----------|------|--------|
| Sin `dangerouslySetInnerHTML` en `src/` | — | accepted |
| Fotos data URL en UI | Low | accepted | Solo datos propios del pedido |

## Secrets Management

| Hallazgo | Sev. | Estado |
|----------|------|--------|
| Secretos en env (Railway/Vercel) | — | accepted | No rotados en este PR |
| Variables requeridas | — | — | `DATABASE_URL`, `JWT_SECRET`, prod: `CLIENT_URL`, `STRIPE_*`, `STRIPE_WEBHOOK_SECRET` |

## Denial of Service / Rate limiting

| Endpoint | Sev. | Estado |
|----------|------|--------|
| Login / delivery login | — | fixed (existente) |
| Refresh | Medium | **fixed** |
| `confirm-payment` | Medium | **fixed** | 30/15 min |
| GPS `PUT /delivery/location` | Medium | **fixed** | 120/min |
| Fotos delivery | Medium | **fixed** | 40/15 min |

## Stripe / Payment Gateway

| Hallazgo | Sev. | Estado |
|----------|------|--------|
| Confirmación sin Stripe | **Critical** | **fixed** |
| Webhook sin firma en prod | **High** | **fixed** | 503 si falta `STRIPE_WEBHOOK_SECRET` |
| Webhook sin validar importe PI | High | **fixed** | `assertPaymentIntentMatchesOrder` + importe sesión checkout |
| Dev bypass confirmación | Medium | **fixed** | Solo `NODE_ENV≠production`, sin `STRIPE_SECRET_KEY`, `ALLOW_UNVERIFIED_PAYMENT_CONFIRM=true` |

## SSRF (OSRM)

| Hallazgo | Sev. | Estado |
|----------|------|--------|
| `OSRM_URL` apuntando a red interna | Medium | **fixed** | `resolveOsrmBase` bloquea localhost/IP privada en prod |

## User Privacy

| Hallazgo | Sev. | Estado |
|----------|------|--------|
| Tracking oculta teléfono en modo lean | — | accepted |
| Tracking bloqueado si no pagado (usuario) | — | accepted |
| Repartidor ve destinatario en pedidos asignados | — | accepted | Por diseño |

---

## Acciones manuales (despliegue)

1. **Railway**
   - Confirmar `CLIENT_URL=https://nha-kinhon.vercel.app` (coma-separado si hay más orígenes).
   - Confirmar `STRIPE_WEBHOOK_SECRET` y endpoint webhook apuntando a `/api/stripe/webhook`.
   - Opcional dev local: `ALLOW_UNVERIFIED_PAYMENT_CONFIRM=true` **solo** en entornos no productivos sin Stripe.
   - `NODE_ENV=production`.
2. **Vercel**
   - Mantener `VITE_STRIPE_PUBLISHABLE_KEY`; CSP recomendada para el SPA (follow-up).
3. **Stripe Dashboard**
   - Eventos: `payment_intent.succeeded`, `checkout.session.completed`, fallos/cancelaciones.
4. **Migraciones DB**: ninguna requerida por este PR.

---

## Contrato API / app móvil

- **`POST /api/orders/:id/confirm-payment`**: con Stripe activo, el servidor **exige** pago `succeeded` en Stripe (PaymentIntent o sesión Checkout vinculada). Sigue siendo válido como *fallback* tras Payment Sheet si el cliente espera éxito en Stripe; el webhook sigue siendo la vía preferida.
- Respuesta **idempotente** si el pedido ya está `CONFIRMED` (200 + pedido).
- Sin cambio en rutas de Payment Sheet / Checkout Session.
- Push unregister: mismo body; solo elimina tokens del usuario autenticado.

---

## Dependencias (`npm audit`)

| Paquete | Sev. | Estado |
|---------|------|--------|
| `bcrypt@5` → `tar` | High | needs follow-up | Evaluar `bcrypt@6` (major) en ventana de mantenimiento |
| `vitest` / `@vitest/mocker` | Moderate | needs follow-up | Actualizar a ≥4.1.11 cuando npm lo permita en CI |
| Transitive `brace-expansion` | High | needs follow-up | `npm audit fix` en monorepo |

---

## Pruebas añadidas

- Verificación Stripe (`stripe.service.test.js`)
- Confirmación de pedidos (`orders.controller.test.js`)
- Webhook con importe PI (`stripe.controller.test.js`)
- Fotos entrega magic bytes (`deliveryPhoto.test.js`)
- OSRM SSRF (`osrmUrl.test.js`)
- Cabeceras seguridad, CSRF origen, rate limiters, runtime CORS helpers

Ejecutar: `cd backend && npm test`
