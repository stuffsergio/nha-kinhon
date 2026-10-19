# Backend: prueba real con dispositivos (España / Guinea-Bissau)

Guía para desplegar el API de Nha Kinhon en **Railway** con un entorno **staging** (Stripe test, Sentry opcional) y validar que la app nativa y la web pueden consumir el API sin pagos reales.

## Resumen de entornos

| Entorno | `APP_ENV` | `NODE_ENV` (Railway) | Clave Stripe (`STRIPE_SECRET_KEY`) |
|---------|-----------|----------------------|-------------------------------------|
| Desarrollo local | *(vacío o `development`)* | `development` | `sk_test_…` permitido |
| Staging Railway | **`staging`** | `production` | **solo** `sk_test_…` |
| Producción Railway | **`production`** (default si no pones `APP_ENV`) | `production` | **solo** `sk_live_…` |

Si `APP_ENV=production` (o no defines `APP_ENV` con `NODE_ENV=production`) y la clave empieza por `sk_test_`, el servidor **no arranca**. Si `APP_ENV=staging` y la clave es `sk_live_`, tampoco arranca.

## Variables de entorno (lista exacta)

Crea estas variables en Railway (staging) o en tu `.env` local. Las marcadas con **\* obligatoria** deben existir siempre.

### Obligatorias (todos los entornos)

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `DATABASE_URL` **\* | PostgreSQL (Railway plugin o Supabase) | `postgresql://user:pass@host:5432/railway?sslmode=require` |
| `JWT_SECRET` **\* | Secreto para tokens (≥ 32 bytes hex) | `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `NODE_ENV` | En Railway suele ser `production` | `production` |

### Identidad del entorno y Stripe (staging / prod)

| Variable | Staging | Producción | Local dev |
|----------|---------|------------|-----------|
| `APP_ENV` | **`staging`** | **`production`** | omitir o `development` |
| `STRIPE_SECRET_KEY` | `sk_test_…` | `sk_live_…` | `sk_test_…` |
| `STRIPE_WEBHOOK_SECRET` | `whsec_…` del endpoint **test** en Stripe Dashboard | `whsec_…` live | `whsec_…` test (Stripe CLI) |
| `STRIPE_PUBLISHABLE_KEY` | `pk_test_…` | `pk_live_…` | `pk_test_…` |

No ejecutes reembolsos ni pagos live desde esta guía. Staging debe usar **modo test** de Stripe.

### Cliente web y CORS

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `CLIENT_URL` | Orígenes permitidos (coma-separados) | `https://staging.nhakinhon.com,http://localhost:5173` |

La app nativa (React Native / Expo) suele **no enviar cabecera `Origin`**. El middleware CORS permite esas peticiones. Orígenes `exp://` y `nhakinhon://` también están permitidos.

### JWT (opcionales, valores por defecto en código)

| Variable | Default |
|----------|---------|
| `JWT_ACCESS_EXPIRES` | `15m` |
| `JWT_REFRESH_EXPIRES` | `7d` |

### Observabilidad

| Variable | Descripción |
|----------|-------------|
| `SENTRY_DSN` | DSN del proyecto Sentry (backend). **Si falta, Sentry no se inicializa.** |

Sentry está configurado con `sendDefaultPii: false` y saneado de cabeceras (`Authorization`, cookies) y campos (`password`, `email`, `phone`, direcciones, tokens).

### Servicios opcionales (fail soft)

Pueden quedar vacíos en staging; la app arranca igual salvo la función concreta:

| Variable |
|----------|
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` |
| `OSRM_URL` (rutas ETA; default servidor público OSRM) |
| `ALLOW_UNVERIFIED_PAYMENT_CONFIRM` | Solo dev local sin Stripe; **nunca** en Railway prod |

### Puerto

| Variable | Default |
|----------|---------|
| `PORT` | `3000` (Railway inyecta el suyo) |

---

## Crear staging en Railway

1. Duplica el servicio backend de producción o crea un **nuevo servicio** desde el mismo repo (`backend/` como root o monorepo según tu config).
2. Añade un **PostgreSQL** dedicado a staging (no compartas la BD de producción).
3. En **Variables**, configura la tabla anterior con `APP_ENV=staging` y claves **test** de Stripe.
4. Build: `railway.json` ejecuta `npx prisma migrate deploy` en la fase build y `npm start` en deploy (que vuelve a ejecutar `prisma migrate deploy` antes de `node index.js`).
5. Healthcheck: Railway usa `GET /api/health` (timeout 60 s).

---

## Webhook Stripe (modo test)

1. En [Stripe Dashboard → Developers → Webhooks](https://dashboard.stripe.com/test/webhooks) (modo **Test**).
2. **Add endpoint**: URL `https://<tu-dominio-railway-staging>/api/stripe/webhook`.
3. Eventos mínimos recomendados (según tu flujo actual): `payment_intent.succeeded`, `checkout.session.completed`, y los que ya uses para reembolsos si aplica en test.
4. Copia el **Signing secret** (`whsec_…`) a `STRIPE_WEBHOOK_SECRET` en Railway staging.

Prueba local con Stripe CLI (opcional):

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Usa el `whsec_…` que imprime la CLI en tu `.env` local.

---

## Migraciones Prisma pendientes en el repo

El historial actual (orden cronológico) en `backend/prisma/migrations/`:

1. `20260620151414_init` — esquema inicial (incluye campo `User.avatar`)
2. `20260621004759_add_delivery_system`
3. `20260622200425_add_order_cancelled_notification`
4. `20260707191353_add_push_tokens`
5. `20260708085930_add_stripe_customer_id`
6. `20260710091045_add_delivery_photo`
7. `20260717120000_add_pending_payment`
8. `20260812120000_add_order_in_transit_notification`
9. `20260929140000_add_recipient_coordinates`
10. `20260930120000_delivery_receipt_proof`
11. `20261005120000_notification_order_id`
12. `20261010180000_user_locale`
13. `20261012180000_refunds_failed_delivery`
14. `20261012190000_request_idempotency`
15. `20261012200000_idempotency_courier_order`

No hay migración SQL separada solo para avatar: el avatar de usuario ya existe desde `init`. La validación de avatar es lógica de API (data URL, ≤ 2 MB, magic bytes).

Verificar en Railway o local:

```bash
cd backend
DATABASE_URL="..." npx prisma migrate deploy
DATABASE_URL="..." npx prisma migrate status
```

Debe mostrar **Database schema is up to date**.

---

## Avatar de usuario (API)

| Método | Ruta | Cuerpo | Notas |
|--------|------|--------|-------|
| `PUT` | `/api/auth/me` | `{ "avatar": "<data URL>" \| null, … }` | Compatible con la app móvil actual |
| `POST` | `/api/auth/me/avatar` | `{ "avatar": "<data URL>" }` | Subida explícita |
| `DELETE` | `/api/auth/me/avatar` | — | Borra avatar (`null`) |

Reglas: JPEG/PNG/WebP en `data:image/…;base64,…`, magic bytes coherentes, máximo ~2 MB decodificados. Peticiones inválidas → **400** con mensaje claro en español.

---

## Comprobaciones antes de la prueba con dispositivos

### 1. Health

```bash
curl -sS "https://<staging>/api/health"
```

Respuesta esperada (campos extra informativos):

```json
{
  "status": "ok",
  "timestamp": "...",
  "appEnv": "staging",
  "stripeConfigured": true,
  "stripeMode": "test"
}
```

### 2. Sin Origin (simula app nativa)

```bash
curl -sS -H "Authorization: Bearer <token>" "https://<staging>/api/auth/me"
```

No hace falta cabecera `Origin`.

### 3. CORS web (opcional)

```bash
curl -sS -I -H "Origin: https://tu-frontend" "https://<staging>/api/health"
```

Debe incluir `Access-Control-Allow-Origin` si el origen está en `CLIENT_URL`.

### 4. Tests automatizados

```bash
cd backend && npm test
```

---

## Sentry

1. Crea un proyecto **Node.js** en Sentry.
2. Añade `SENTRY_DSN=https://…@….ingest.sentry.io/…` en Railway staging.
3. Despliega y provoca un error 5xx en staging (solo test) para verificar captura.
4. Confirma en Sentry que no aparecen emails, teléfonos ni cabeceras `Authorization` en el evento.

---

## Checklist rápido staging

- [ ] `APP_ENV=staging`
- [ ] `STRIPE_SECRET_KEY=sk_test_…`
- [ ] `STRIPE_WEBHOOK_SECRET` del webhook **test**
- [ ] `DATABASE_URL` de BD staging
- [ ] `JWT_SECRET` único (distinto de producción)
- [ ] `CLIENT_URL` con URL del frontend de prueba
- [ ] `npx prisma migrate deploy` OK / health `status: ok`
- [ ] App móvil apunta a URL staging; login y `PUT /api/auth/me` con avatar válido
- [ ] `SENTRY_DSN` (opcional pero recomendado)

---

## Contacto y cuentas de prueba

Tras `npm run db:seed` en local (con `DATABASE_URL`):

| Rol | Email | Contraseña |
|-----|-------|------------|
| Usuario | `carlos@example.com` | `123456` |
| Admin | `admin@nhakinhon.com` | `admin1234` |
| Repartidor | `joao@example.com` | `123456` |

En staging Railway, ejecuta el seed solo si lo necesitas (misma orden: migraciones primero).
