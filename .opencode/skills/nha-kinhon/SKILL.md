---
name: nha-kinhon
description: Use for the nha-kinhon e-commerce project. Stack: Node.js + Express, JavaScript, PostgreSQL + Prisma, React 19 + Vite + Tailwind v4, JWT auth (access 15m + refresh 7d cookie HttpOnly), Stripe real (Checkout Sessions + Elements, XOF zero-decimal), TanStack React Query. Use when working on this codebase.
---

# Nha Kinhon — E-commerce Platform

## Stack
- **Frontend**: React 19, Vite 8, Tailwind CSS v4, React Router v7, TanStack React Query v5, Framer Motion, Leaflet, Lucide React
- **Backend**: Node.js, Express 5, Prisma ORM, PostgreSQL, JWT, Stripe, Zod, bcrypt, express-rate-limit
- **Testing**: Vitest, supertest (backend), @testing-library/react (frontend)
- **Moneda**: XOF (zero-decimal, no multiplicar por 100)

## Architecture
- Frontend en `/src`, backend en `/backend/src`
- Backend estructura: `controllers/`, `routes/`, `middleware/`, `config/`, `utils/`, `services/`
- Rutas API bajo `/api/...`
- PostgreSQL en Docker (contenedor `nha-postgres`, puerto 5433)
- Stripe CLI debe estar corriendo: `stripe listen --forward-to http://localhost:3000/api/stripe/webhook`
- Backend: `http://localhost:3000`, Frontend: `http://localhost:5173`
- Seed en `backend/prisma/seed.js` (admin@nhakinhon.com / admin1234)
- Refresh token en cookie HttpOnly (sameSite: "none", secure: true)

## Testing
- Backend: `npm test` en `backend/`
- Frontend: `npm test` en raíz
- Prisma mock en `backend/src/tests/helpers/mockPrisma.js`

## Rutas principales
- `/` — Home
- `/mapa` — Mapa con tiendas
- `/buscar` — Búsqueda
- `/carrito` — Carrito
- `/checkout` — Pago Stripe (página dedicada)
- `/perfil` — Perfil con pedidos, favoritos
- `/admin` — Panel admin (3 tabs: asignar delivery, pedidos, repartidores)
- `/delivery/login` — Login repartidores
- `/delivery/dashboard` — Panel repartidor
- `/tienda/:id` — Productos de un mercado

## Estados de pedido
`PENDING → CONFIRMED → PROCESSING → SHIPPED → PICKED_UP → IN_TRANSIT → DELIVERED`
- `CANCELLED` desde PENDING o CONFIRMED
- Admin cambia estados via `PUT /api/orders/:id/status`
- Delivery cambia PICKED_UP → IN_TRANSIT → DELIVERED

## Stripe
- Checkout Sessions con `ui_mode: "elements"`
- `@stripe/react-stripe-js` v6.6.0, `stripe` npm v22.2.2
- Webhook escucha: `checkout.session.completed`, `checkout.session.async_payment_failed`
- `confirm()` de Stripe redirige al `return_url` — el cleanup se hace en el webhook (borrar cart items)
- `useCheckout()` devuelve `{ type, checkout }`, no el checkout directo
- Llamar a `checkout.confirm({ email })` sin `loadActions` previo

## Seguridad
- JWT access token 15m, refresh token 7d en cookie
- rate-limit: 20 intentos / 15 min en login/register
- Roles: USER, ADMIN, DELIVERY

## Convenios de código
- Sin comentarios en JSX/components
- Design tokens Apple en `src/index.css`
- Code splitting con `React.lazy()` + `Suspense`
- `api.js` maneja refresh automático en 401
- `useMutation` invalida queries relacionadas en `onSuccess`
