# Plan de Implementación: Sistema de Delivery People

## 1. Concepto

Crear un subsistema dentro de Nha Kinhon para que **repartidores (delivery people)** puedan registrarse, ver pedidos disponibles, asignarse entregas y gestionar su ruta desde un dashboard propio. Totalmente separado del flujo de usuarios normales (compradores y destinatarios), pero integrado en la misma base de datos y backend.

### Usuarios del sistema delivery
1. **Delivery Person** — Persona en Guinea-Bissau que recoge y entrega pedidos
2. **Admin** — Gestiona repartidores, asigna/reasigna pedidos, ve estadísticas
3. **Comprador** — Recibe notificaciones cuando su pedido es recogido/entregado

---

## 2. Modelos (Prisma)

### Modificar `User`
Ampliar el enum `Role` para incluir `DELIVERY`:

```prisma
enum Role {
  USER
  ADMIN
  DELIVERY
}
```

### Modificar `Order`
Añadir campos para tracking del delivery:

```prisma
model Order {
  // ...campos existentes...
  deliveryId    String?   // FK a User (delivery person)
  delivery      User?     @relation("DeliveryOrders", fields: [deliveryId], references: [id])
  pickedUpAt    DateTime?
  deliveredAt   DateTime?
}
```

### Nuevo modelo `DeliveryProfile`

```prisma
model DeliveryProfile {
  id              String   @id @default(cuid())
  userId          String   @unique
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  phone           String
  vehicle         String   // "bicicleta" | "moto" | "coche" | "a_pie"
  serviceArea     String?  // "Bissau", "Gabu", etc.
  isActive        Boolean  @default(false)
  totalDeliveries Int      @default(0)
  rating          Float    @default(0)
  currentLocation Json?    // { lat, lng } para tracking GPS
  createdAt       DateTime @default(now())

  @@map("delivery_profiles")
}
```

### Nuevos estados de pedido
Ampliar `OrderStatus` con estados intermedios de delivery:

```prisma
enum OrderStatus {
  PENDING
  CONFIRMED
  PROCESSING
  SHIPPED
  PICKED_UP
  IN_TRANSIT
  DELIVERED
  CANCELLED
}
```

### Máquina de estados completa

```
PENDING ──(admin)──→ CONFIRMED ──(delivery pickup)──→ PICKED_UP
                                                          │
                                                          ▼
PICKED_UP ──(delivery)──→ IN_TRANSIT ──(delivery)──→ DELIVERED

Cualquier estado excepto DELIVERED ──→ CANCELLED
```

---

## 3. Endpoints API

### Grupo `/api/delivery/auth` — Autenticación de delivery

| Endpoint | Método | Auth | Descripción |
|---|---|---|---|
| `/api/delivery/auth/register` | POST | No | Registro como delivery (crea User + DeliveryProfile) |
| `/api/delivery/auth/login` | POST | No | Login delivery, devuelve accessToken + cookie HttpOnly |

**Body del registro:**
```json
{
  "name": "João Mendes",
  "email": "joao@example.com",
  "password": "123456",
  "phone": "+245 955 123 456",
  "vehicle": "moto",
  "serviceArea": "Bissau"
}
```

**Respuesta del login:**
```json
{
  "user": { "id": "...", "name": "João Mendes", "email": "joao@example.com", "role": "DELIVERY" },
  "accessToken": "..."
}
```
El refresh token se setea como cookie HttpOnly (mismo mecanismo que auth normal).

### Grupo `/api/delivery/orders` — Gestión de pedidos delivery

| Endpoint | Método | Auth | Descripción |
|---|---|---|---|
| `/api/delivery/orders/available` | GET | Delivery | Pedidos CONFIRMED/READY sin delivery asignado |
| `/api/delivery/orders/my` | GET | Delivery | Pedidos asignados al delivery actual (activos + historial) |
| `/api/delivery/orders/:id/pickup` | POST | Delivery | Asignarse un pedido disponible (CONFIRMED → PICKED_UP) |
| `/api/delivery/orders/:id/status` | PUT | Delivery | Avanzar estado: PICKED_UP → IN_TRANSIT → DELIVERED |
| `/api/delivery/orders/:id/deliver` | POST | Delivery | Marcar como entregado + registrar timestamp |

**PUT /api/delivery/orders/:id/status — Body:**
```json
{ "status": "IN_TRANSIT" }
```

**POST /api/delivery/orders/:id/pickup — respuesta:**
```json
{
  "order": {
    "id": "...",
    "recipientName": "Carlos Pereira",
    "recipientAddress": "Bairro de Missira, Bissau",
    "recipientPhone": "+245 955 789 012",
    "items": [ { "name": "Arroz", "quantity": 2 }, ... ],
    "notes": "Tocar el timbre dos veces",
    "status": "PICKED_UP"
  }
}
```

### Grupo `/api/delivery/profile` — Perfil del delivery

| Endpoint | Método | Auth | Descripción |
|---|---|---|---|
| `/api/delivery/profile` | GET | Delivery | Obtener perfil completo |
| `/api/delivery/profile` | PUT | Delivery | Actualizar vehículo, zona, teléfono |
| `/api/delivery/profile/toggle-active` | POST | Delivery | Cambiar isActive (disponible/no disponible) |
| `/api/delivery/stats` | GET | Delivery | Estadísticas: total entregas, rating, entregas hoy/semana |
| `/api/delivery/location` | PUT | Delivery | Actualizar ubicación GPS |

---

## 4. Nuevas Rutas Frontend

| Ruta | Componente | Descripción |
|---|---|---|
| `/delivery/login` | `DeliveryLogin.jsx` | Login/registro con formulario específico |
| `/delivery/dashboard` | `DeliveryDashboard.jsx` | Dashboard principal con tabs |

### NavBar — Botón "Quiero repartir"

- Usuario anónimo → link a `/delivery/login`
- Usuario delivery → link a `/delivery/dashboard` con texto "Panel Repartidor"
- Usuario normal → link a `/delivery/login` con texto "Quiero repartir"

Estilo: botón outline verde o con icono `Truck` de Lucide, claramente diferenciado del resto de navegación.

---

## 5. Páginas Frontend

### DeliveryLogin.jsx

Diseño similar a Login.jsx pero con campos extra para delivery:

- **Login tab**: email + password
- **Registro tab**: nombre, email, password, confirmar password, teléfono, vehículo (select: bicicleta/moto/coche/a pie), zona (select: Bissau/Gabu/etc.)

Al registrarse/loguearse, redirige a `/delivery/dashboard`.

### DeliveryDashboard.jsx

Dashboard con tabs:

#### Tab 1: Disponibles
- Lista de pedidos CONFIRMED sin delivery asignado
- Cada card muestra: nombre del destinatario, dirección, items, total FCFA, notas
- Botón "Tomar pedido" → asigna el delivery al pedido
- Filtros: por zona/área de servicio
- Badge con cuenta de pedidos disponibles

#### Tab 2: Mis Activos
- Pedidos que el delivery tiene asignados en estado PICKED_UP o IN_TRANSIT
- Timeline visual del estado actual con los 3 pasos:
  - 🟢 Recogido ✓
  - 🟡 En camino (pendiente)
  - ⚪ Entregado (pendiente)
- Botón para avanzar al siguiente estado:
  - "Confirmar recogida" (si está en PICKED_UP)
  - "En camino" (si está en PICKED_UP)
  - "Marcar como entregado" (si está en IN_TRANSIT)
- Dirección del destinatario con botón para abrir en Google Maps
- Número de teléfono del destinatario con botón "Llamar" (tel: link)
- Notas del pedido visibles

#### Tab 3: Mi Perfil
- Datos personales: nombre, email, teléfono (editables)
- Vehículo y zona (editables)
- Toggle "Disponible para repartir" (isActive)
- Estadísticas: total entregas, rating promedio, entregas hoy, entregas esta semana

#### Tab 4: Historial
- Lista de pedidos entregados por este delivery
- Filtro por fecha (desde/hasta)
- Búsqueda por nombre de destinatario
- Total de entregas en el período filtrado

---

## 6. Componentes Nuevos

| Componente | Descripción |
|---|---|
| `DeliveryOrderCard.jsx` | Card de pedido para delivery: destinatario, dirección, items, acciones |
| `DeliveryStatusBadge.jsx` | Badge visual con el estado y color correspondiente |
| `DeliveryTimeline.jsx` | Timeline horizontal con 3 pasos (recogido → en camino → entregado) |
| `ActiveToggle.jsx` | Toggle switch para activar/desactivar disponibilidad |
| `DeliveryStats.jsx` | Panel de estadísticas con números grandes (Apple style) |

---

## 7. Hooks Nuevos

| Hook | Descripción |
|---|---|
| `useDeliveryAuth.js` | `useDeliveryLogin()`, `useDeliveryRegister()` — mutations de auth delivery |
| `useDeliveryOrders.js` | `useAvailableOrders()`, `useMyOrders()`, `usePickupOrder()`, `useUpdateDeliveryStatus()`, `useDeliverOrder()` |
| `useDeliveryProfile.js` | `useDeliveryProfile()`, `useUpdateProfile()`, `useToggleActive()`, `useDeliveryStats()` |

---

## 8. Middleware Backend

### `backend/src/middleware/delivery.js`

```js
import { ForbiddenError } from "../utils/errors.js";

export function requireDelivery(req, res, next) {
  if (req.user?.role !== "DELIVERY") {
    throw new ForbiddenError("Se requieren permisos de repartidor");
  }
  next();
}
```

Se usa en todas las rutas de `/api/delivery/orders/*` y `/api/delivery/profile/*`.

---

## 9. Integración con Sistema Existente

- **AuthContext** — El delivery tiene `role: DELIVERY` en el JWT. El frontend puede condicionar UI basado en `user.role`.
- **CartSummary/Checkout** — Cuando un pedido se crea y es confirmado (por admin o por pago Stripe), aparece automáticamente en la lista de disponibles del delivery.
- **Admin panel** — En `/admin`, los pedidos muestran si tienen delivery asignado. El admin puede ver qué delivery está asignado y reasignar si es necesario.
- **Notificaciones** — Cuando un delivery toma un pedido, el usuario comprador recibe una notificación. Cuando se entrega, también.
- **Toast** — Feedback visual para todas las acciones (tomar pedido, cambiar estado, actualizar perfil).
- **ErrorBoundary** — Las páginas de delivery están envueltas por el ErrorBoundary global.
- **Code splitting** — Las páginas de delivery se cargan con lazy loading para no afectar el bundle principal.

---

## 10. Plan de Implementación (Orden Sugerido)

| Paso | Descripción | Archivos |
|---|---|---|
| 1 | Modificar schema: nuevo `Role`, `DeliveryProfile`, `deliveryId` en Order, nuevos status | `backend/prisma/schema.prisma` |
| 2 | Ejecutar migración + crear seed de delivery de prueba | `npx prisma migrate dev`, `backend/prisma/seed.js` |
| 3 | Controlador auth delivery (register + login con perfil) | `backend/src/controllers/delivery.auth.controller.js` |
| 4 | Rutas auth delivery | `backend/src/routes/delivery.auth.routes.js` |
| 5 | Middleware `requireDelivery` | `backend/src/middleware/delivery.js` |
| 6 | Controlador delivery (orders available, pickup, status, deliver, stats, profile) | `backend/src/controllers/delivery.controller.js` |
| 7 | Rutas delivery orders + profile | `backend/src/routes/delivery.routes.js` |
| 8 | Registrar rutas en `backend/index.js` | `backend/index.js` |
| 9 | Hooks `useDeliveryAuth.js`, `useDeliveryOrders.js`, `useDeliveryProfile.js` | `src/hooks/useDelivery*.js` |
| 10 | Componente `DeliveryOrderCard.jsx` | `src/components/DeliveryOrderCard.jsx` |
| 11 | Componente `DeliveryStatusBadge.jsx` | `src/components/DeliveryStatusBadge.jsx` |
| 12 | Componente `DeliveryTimeline.jsx` | `src/components/DeliveryTimeline.jsx` |
| 13 | Página `DeliveryLogin.jsx` | `src/pages/DeliveryLogin.jsx` |
| 14 | Página `DeliveryDashboard.jsx` (con tabs) | `src/pages/DeliveryDashboard.jsx` |
| 15 | Añadir rutas `/delivery/*` en App.jsx (con lazy loading) | `src/App.jsx` |
| 16 | Añadir botón "Quiero repartir" en NavBar | `src/components/NavBar.jsx` |
| 17 | Verificar build completo | `npm run build` |

---

## 11. Consideraciones Futuras

- **GPS tracking en tiempo real**: El delivery envía ubicación cada N segundos. El backend almacena la última posición. Futuro: mostrar en el mapa del comprador dónde está su pedido.
- **Rating al delivery**: Al marcar como entregado, el sistema (o el destinatario, vía SMS/enlace) puede valorar al delivery del 1 al 5. Esto construye reputación.
- **Zonas geográficas**: Los deliveries tienen un área de servicio. Los pedidos disponibles se filtran por zona para mostrar solo los relevantes.
- **Push notifications**: Cuando hay un pedido disponible cerca del delivery, notificar push. Cuando un delivery toma un pedido, notificar al comprador.
- **Earnings tracking**: Futuro: los deliveries cobran por entrega. El sistema trackea ganancias, pagos pendientes y pagos realizados.
- **WebSockets**: Para actualización en tiempo real de la lista de disponibles (cuando un admin confirma un pedido, aparece inmediatamente).
- **Panel admin de deliveries**: Lista de repartidores activos, ver sus rutas, estadísticas, habilitar/deshabilitar.
