# Plan del Backend — Nha Kinhon

## Stack

| Capa | Tecnología |
|---|---|
| Runtime | Node.js + Express |
| Lenguaje | JavaScript |
| Base de datos | PostgreSQL |
| ORM | Prisma |
| Autenticación | JWT + sesiones |
| Validación | Zod |
| Pagos | Stripe (preparado) |
| Archivos | Multer + Cloudinary/S3 |

---

## 1. ¿Quién usa la web?

| Persona | Rol | Qué hace |
|---|---|---|
| **Pagador (diáspora)** | `USER` | Se registra, busca productos, arma carrito, paga, elige destinatario |
| **Destinatario (Guinea-Bissau)** | Sin cuenta | Existe como contacto dentro de un pedido. Recibe la comida. |
| **Admin** | `ADMIN` | Gestiona mercados, productos, categorías, pedidos, usuarios |

> El destinatario **no necesita cuenta propia**. El pagador lo guarda como **contacto** y lo asigna al pedido al hacer checkout.

---

## 2. Principios de diseño

- **Nada hardcodeado**: toda configuración vía variables de entorno. Datos cargados desde la base de datos, no desde archivos estáticos.
- **Admin-ready**: endpoints CRUD protegidos con middleware de administrador desde el día uno.
- **Pagos preparados**: infraestructura Strike lista para integrar (webhooks, creación de PaymentIntent), aunque el checkout real se activará cuando toque.
- **JWT con sesiones**: token JWT de acceso corto (15 min) + refresh token largo (7 días) almacenado en base de datos.

---

## 3. Modelos de datos (Prisma)

```prisma
model User {
  id              String    @id @default(cuid())
  name            String
  email           String    @unique
  password        String    // bcrypt hash
  phone           String?
  avatar          String?
  balance         Float     @default(0)
  role            Role      @default(USER)
  refreshToken    String?   // para sesiones persistentes
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  cartItems       CartItem[]
  orders          Order[]
  favorites       Favorite[]
  contacts        Contact[]
  paymentMethods  PaymentMethod[]
  notifications   Notification[]
  supporters      Supporter[]

  @@map("users")
}

enum Role {
  USER
  ADMIN
}

model Market {
  id          String        @id @default(cuid())
  name        String
  type        MarketType
  location    String        // ciudad: Bissau, Bandim, Bafatá, Gabú, Canchungo
  address     String?
  phone       String?
  hours       String        // ej: "Lun–Sáb: 6:00 – 18:00"
  coordinates Json          // { x: Float, y: Float } para el mapa visual
  lat         Float?        // para mapa real futuro (Leaflet/Mapbox)
  lng         Float?        // para mapa real futuro
  image       String?
  active      Boolean       @default(true)
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  products    Product[]

  @@map("markets")
}

enum MarketType {
  MERCADO_LOCAL
  SUPERMERCADO
  TIENDA_ESPECIALIZADA
}

model Category {
  id        String    @id @default(cuid())
  name      String    @unique
  icon      String    // nombre del icono Lucide (Apple, Carrot, Fish…)
  image     String?
  active    Boolean   @default(true)
  createdAt DateTime  @default(now())

  products  Product[]

  @@map("categories")
}

model Product {
  id          String    @id @default(cuid())
  name        String
  description String?
  price       Float     // en FCFA
  unit        String    // kg, l, unidad, paquete, docena, botella, frasco…
  image       String?
  available   Boolean   @default(true)
  categoryId  String
  marketId    String
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  category    Category  @relation(fields: [categoryId], references: [id])
  market      Market    @relation(fields: [marketId], references: [id])
  cartItems   CartItem[]
  orderItems  OrderItem[]
  favorites   Favorite[]

  @@index([name])
  @@map("products")
}

model CartItem {
  id        String   @id @default(cuid())
  userId    String
  productId String
  quantity  Int      @default(1)
  createdAt DateTime @default(now())

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  product   Product  @relation(fields: [productId], references: [id])

  @@unique([userId, productId])
  @@map("cart_items")
}

model Order {
  id              String         @id @default(cuid())
  userId          String
  status          OrderStatus    @default(PENDING)
  subtotal        Float
  shipping        Float          @default(0)
  total           Float
  notes           String?
  recipientName   String
  recipientPhone  String?
  recipientAddress String?
  stripePaymentId String?        // ID del PaymentIntent de Stripe
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt

  user            User           @relation(fields: [userId], references: [id])
  items           OrderItem[]

  @@index([userId])
  @@index([status])
  @@map("orders")
}

enum OrderStatus {
  PENDING
  CONFIRMED
  PROCESSING
  SHIPPED
  DELIVERED
  CANCELLED
}

model OrderItem {
  id        String  @id @default(cuid())
  orderId   String
  productId String
  name      String  // snapshot en el momento de la compra
  price     Float   // snapshot en el momento de la compra
  quantity  Int

  order     Order   @relation(fields: [orderId], references: [id], onDelete: Cascade)
  product   Product @relation(fields: [productId], references: [id])

  @@map("order_items")
}

model Favorite {
  id        String   @id @default(cuid())
  userId    String
  productId String
  createdAt DateTime @default(now())

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  product   Product  @relation(fields: [productId], references: [id])

  @@unique([userId, productId])
  @@map("favorites")
}

model Contact {
  id        String   @id @default(cuid())
  userId    String
  name      String
  email     String?
  phone     String?
  address   String?  // dirección en Guinea‑Bissau para entrega
  createdAt DateTime @default(now())

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("contacts")
}

model PaymentMethod {
  id          String            @id @default(cuid())
  userId      String
  type        PaymentMethodType
  last4       String?           // últimos 4 dígitos (tarjeta)
  expiry      String?           // MM/YY (tarjeta)
  provider    String?           // stripe, mpesa, orange_money
  phone       String?           // número para mobile money
  stripeId    String?           // ID del método en Stripe (pm_xxx)
  isDefault   Boolean           @default(false)
  createdAt   DateTime          @default(now())

  user        User              @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("payment_methods")
}

enum PaymentMethodType {
  VISA
  MASTERCARD
  MPESA
  ORANGE_MONEY
}

model Notification {
  id        String           @id @default(cuid())
  userId    String
  type      NotificationType
  title     String
  message   String
  read      Boolean          @default(false)
  createdAt DateTime         @default(now())

  user      User             @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, read])
  @@map("notifications")
}

enum NotificationType {
  ORDER_CONFIRMED
  ORDER_PROCESSING
  ORDER_SHIPPED
  ORDER_DELIVERED
  PAYMENT_RECEIVED
  PROMO
}

model Supporter {
  id        String   @id @default(cuid())
  userId    String?  // null si el testimonio es anónimo
  name      String
  message   String
  avatar    String?
  approved  Boolean  @default(false)
  createdAt DateTime @default(now())

  user      User?    @relation(fields: [userId], references: [id])

  @@map("supporters")
}
```

---

## 4. API Routes

### Auth (`/api/auth`)

```
POST /register
  Body: { name, email, password }
  Response: { user, accessToken, refreshToken }
  Reglas: email único, password ≥ 6 chars, hash con bcrypt

POST /login
  Body: { email, password }
  Response: { user, accessToken, refreshToken }
  Reglas: guarda refreshToken en BD, httpOnly cookie + body

POST /refresh
  Body: { refreshToken }
  Response: { accessToken, refreshToken }
  Reglas: rotación de refresh token (invalida el anterior)

POST /logout
  Auth: Bearer token
  Reglas: elimina refreshToken de BD

GET /me
  Auth: Bearer token
  Response: { user } (sin password)

PUT /me
  Auth: Bearer token
  Body: { name?, email?, phone?, avatar? }
  Response: { user }

PUT /me/password
  Auth: Bearer token
  Body: { currentPassword, newPassword }
```

### Markets (`/api/markets`)

```
GET /
  Query: ?page=1&limit=20&type=&location=
  Response: { data: Market[], total, page, limit }

GET /:id
  Response: { market, products: Product[] }

POST /
  Auth: ADMIN
  Body: { name, type, location, address?, phone?, hours, coordinates, lat?, lng?, image? }

PUT /:id
  Auth: ADMIN
  Body: (mismos campos que POST, todos opcionales)

DELETE /:id
  Auth: ADMIN
  Efecto: active = false (soft delete)
```

### Categories (`/api/categories`)

```
GET /
  Response: { data: Category[] }

GET /:id
  Response: { category, products: Product[] }

POST /
  Auth: ADMIN
  Body: { name, icon, image? }

PUT /:id
  Auth: ADMIN

DELETE /:id
  Auth: ADMIN (soft delete)
```

### Products (`/api/products`)

```
GET /
  Query: ?page=1&limit=20&categoryId=&marketId=&search=&minPrice=&maxPrice=&available=
  Response: { data: Product[], total, page, limit }

GET /:id
  Response: { product, category, market }

POST /
  Auth: ADMIN
  Body: { name, description?, price, unit, categoryId, marketId, image? }

PUT /:id
  Auth: ADMIN

DELETE /:id
  Auth: ADMIN (soft delete: available = false)

POST /:id/image
  Auth: ADMIN
  Multipart: imagen → sube a Cloudinary/S3, guarda URL
```

### Search (`/api/search`)

```
GET /
  Query: ?q=texto
  Response: {
    products: Product[],
    markets: Market[],
    categories: Category[]
  }
  Búsqueda: ILIKE sobre name, location (markets), name (categories)
```

### Cart (`/api/cart`)

```
GET /
  Auth: USER
  Response: { items: CartItem[] } (cada item con datos completos del producto)

POST /items
  Auth: USER
  Body: { productId, quantity }
  Reglas: si ya existe, suma cantidad. Verifica que product exista y esté disponible.

PUT /items/:id
  Auth: USER
  Body: { quantity }
  Reglas: si quantity ≤ 0, elimina el item.

DELETE /items/:id
  Auth: USER

DELETE /
  Auth: USER (vaciar carrito completo)
```

### Orders (`/api/orders`)

```
GET /
  Auth: USER
  Query: ?page=1&limit=20&status=
  Response: { data: Order[] } (con items)

GET /:id
  Auth: USER (solo pedidos propios) o ADMIN
  Response: { order, items: OrderItem[] }

POST /checkout
  Auth: USER
  Body: {
    recipientName,
    recipientPhone?,
    recipientAddress?,
    notes?,
    paymentMethodId
  }
  Flujo:
    1. Validar carrito no vacío
    2. Calcular subtotal, total
    3. Verificar paymentMethod pertenece al usuario
    4. En el futuro: crear PaymentIntent en Stripe
    5. Crear Order + OrderItems
    6. Vaciar carrito
    7. Generar Notification
    8. Devolver Order

PUT /:id/status
  Auth: ADMIN
  Body: { status }
  Reglas: validar transición válida (PENDING→CONFIRMED→PROCESSING→SHIPPED→DELIVERED)
  Efecto: genera Notification al usuario

POST /:id/cancel
  Auth: USER (solo propio, solo si PENDING)
  Efecto: status = CANCELLED

GET /admin/all
  Auth: ADMIN
  Query: ?page=1&limit=20&status=&userId=&dateFrom=&dateTo=
  Response: { data: Order[], total, page, limit }
```

### Favorites (`/api/favorites`)

```
GET /
  Auth: USER
  Response: { data: Product[] } (productos completos)

POST /:productId
  Auth: USER
  Reglas: upsert (no duplicados)

DELETE /:productId
  Auth: USER
```

### Contacts (`/api/contacts`)

```
GET /
  Auth: USER
  Response: { data: Contact[] }

POST /
  Auth: USER
  Body: { name, email?, phone?, address? }

PUT /:id
  Auth: USER (solo propio)

DELETE /:id
  Auth: USER (solo propio)
```

### Payment Methods (`/api/payment-methods`)

```
GET /
  Auth: USER
  Response: { data: PaymentMethod[] }

POST /
  Auth: USER
  Body: { type, last4?, expiry?, provider?, phone?, stripeId? }
  Reglas: si es el primero, isDefault = true

PUT /:id
  Auth: USER

PUT /:id/default
  Auth: USER
  Efecto: marca como default, desmarca los demás

DELETE /:id
  Auth: USER
```

### Notifications (`/api/notifications`)

```
GET /
  Auth: USER
  Query: ?page=1&limit=20&unreadOnly=false
  Response: { data: Notification[], total, unreadCount }

PUT /:id/read
  Auth: USER

PUT /read-all
  Auth: USER

GET /unread-count
  Auth: USER
  Response: { count: Number }
```

### Supporters (`/api/supporters`)

```
GET /
  Response: { data: Supporter[] } (solo approved = true)

POST /
  Body: { name, message, avatar? }
  Reglas: unapproved por defecto

PUT /:id/approve
  Auth: ADMIN

DELETE /:id
  Auth: ADMIN
```

### Stripe (`/api/stripe`)

```
POST /create-payment-intent
  Auth: USER
  Body: { orderId }
  Response: { clientSecret }

POST /webhook
  Público (con firma Stripe)
  Maneja: payment_intent.succeeded, payment_intent.payment_failed
  Efecto: actualiza estado del pedido + notificación
```

---

## 5. Flujo completo de un pedido

```
 1. USER registra / login                     → POST /api/auth/register | login
 2. USER busca productos                      → GET /api/search?q=arroz
 3. USER agrega al carrito                    → POST /api/cart/items { productId, quantity }
 4. USER ve el carrito                        → GET /api/cart
 5. USER elige destinatario de contactos      → GET /api/contacts
    (o crea uno nuevo)                        → POST /api/contacts { name, phone, address }
 6. USER hace checkout                        → POST /api/orders/checkout
    { recipientName, recipientPhone, recipientAddress, notes, paymentMethodId }
 7. Backend crea Order + OrderItems,
    vacía cart, genera Notification
 8. ADMIN ve todos los pedidos               → GET /api/orders/admin/all
 9. ADMIN actualiza estado                    → PUT /api/orders/:id/status { status }
10. USER recibe notificación                  → GET /api/notifications
```

---

## 6. Variables de entorno

```env
# .env (nada hardcodeado)

PORT=3000

# Base de datos
DATABASE_URL="postgresql://user:password@localhost:5432/nha_kinhon"

# JWT
JWT_SECRET="cambiar-en-produccion"
JWT_ACCESS_EXPIRES="15m"
JWT_REFRESH_EXPIRES="7d"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Cloudinary / S3 (para imágenes)
CLOUDINARY_CLOUD_NAME="..."
CLOUDINARY_API_KEY="..."
CLOUDINARY_API_SECRET="..."

# CORS
CLIENT_URL="http://localhost:5173"

# Email (para enviar confirmaciones)
SMTP_HOST="..."
SMTP_PORT=587
SMTP_USER="..."
SMTP_PASS="..."
```

---

## 7. Estructura de archivos

```
server/
├── index.js                      # Entry point
├── .env                          # variables de entorno (no git)
├── .env.example                  # plantilla
├── prisma/
│   ├── schema.prisma             # modelos de datos
│   └── seed.js                   # datos iniciales (6 markets, 16 categories, 48 products, 1 admin, 1 user demo)
├── src/
│   ├── config/
│   │   ├── db.js                 # conexión Prisma
│   │   └── env.js                # validación de env con Zod
│   ├── middleware/
│   │   ├── auth.js               # verifyToken (extrae user de JWT)
│   │   ├── admin.js              # verifyAdmin (verifica role === ADMIN)
│   │   └── validate.js           # valida schemas Zod
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── markets.routes.js
│   │   ├── categories.routes.js
│   │   ├── products.routes.js
│   │   ├── search.routes.js
│   │   ├── cart.routes.js
│   │   ├── orders.routes.js
│   │   ├── favorites.routes.js
│   │   ├── contacts.routes.js
│   │   ├── paymentMethods.routes.js
│   │   ├── notifications.routes.js
│   │   ├── supporters.routes.js
│   │   └── stripe.routes.js
│   ├── controllers/
│   │   └── ... (uno por ruta)
│   ├── services/
│   │   ├── email.service.js      # envío de correos
│   │   ├── payment.service.js    # lógica de Stripe
│   │   └── notification.service.js  # creación de notificaciones
│   └── utils/
│       ├── jwt.js                # firmar / verificar tokens
│       └── errors.js             # clases de error personalizadas
```

---

## 8. Seed data

El script `prisma/seed.js` cargará los datos actuales del frontend desde archivos JSON externos (no hardcodeados en el código), leyendo:

- `seed/markets.json`
- `seed/categories.json`
- `seed/products.json`
- `seed/users.json`

Ejemplo de `seed/markets.json`:

```json
[
  {
    "name": "Mercado Central Bissau",
    "type": "MERCADO_LOCAL",
    "location": "Bissau",
    "hours": "Lun-Sáb: 6:00 - 18:00",
    "coordinates": { "x": 50, "y": 30 },
    "products": [1, 2, 3, 4, 5, 6, 7, 8]
  }
]
```

El seed también creará:
- 1 admin (`admin@nhakinhon.com` / contraseña del env o generada)
- 1 user demo con favoritos, contactos, métodos de pago y 2 pedidos de ejemplo

---

## 9. Integración con el frontend actual

| Frontend (hoy) | Endpoint backend |
|---|---|
| `data/products.js` → import directo | `GET /api/products` |
| `data/markets.js` → import directo | `GET /api/markets` |
| `data/categories.js` → import directo | `GET /api/categories` |
| `data/users.js` → `users[0]` | `GET /api/auth/me` |
| `Search.jsx` → filtrado local con `.filter()` | `GET /api/search?q=` |
| `CartContext` → estado local en React | `GET /api/cart` + `POST/PUT/DELETE /api/cart/items` |
| `CartSummary` → `alert("checkout")` | `POST /api/orders/checkout` |
| `Profile.jsx` → favoritos hardcodeados | `GET/POST/DELETE /api/favorites` |
| `Profile.jsx` → contactos hardcodeados | `GET/POST/PUT/DELETE /api/contacts` |
| `Profile.jsx` → paymentMethods hardcodeados | `GET/POST/PUT/DELETE /api/payment-methods` |
| `Profile.jsx` → notificación con badge "2" | `GET /api/notifications` + `GET /api/notifications/unread-count` |
| `Profile.jsx` → orders hardcodeados | `GET /api/orders` |
| `Login.jsx` → admin hardcodeado | `POST /api/auth/login` |
| `Support.jsx` → texto estático | `GET /api/supporters` |

---

## 10. Admin readiness (desde el inicio)

| Aspecto | Cómo se implementa |
|---|---|
| **Rol ADMIN** | Campo `role` en modelo User. Seed crea un admin. |
| **Middleware `adminAuth`** | Verifica token JWT + `req.user.role === "ADMIN"`. |
| **CRUD completo** | Todos los endpoints de creación/edición/borrado existen y requieren `adminAuth`. Aunque no haya panel admin, la API ya está lista. |
| **Visión global** | `GET /api/orders/admin/all` con filtros (status, userId, fechas). |
| **Estados de pedido** | Transiciones válidas: `PENDING → CONFIRMED → PROCESSING → SHIPPED → DELIVERED`. También `→ CANCELLED`. |

---

## 11. Stripe (preparado)

El backend tendrá la infraestructura de Stripe lista aunque el checkout real se active después:

- **Creación de PaymentIntent** al hacer checkout (pero el frontend puede ignorarlo por ahora)
- **Webhook handler** para eventos `payment_intent.succeeded` y `payment_intent.payment_failed`
- Al `succeeded`: cambiar estado del pedido a `CONFIRMED`, generar notificación
- Al `failed`: marcar pedido como `PENDING` con error, notificar al usuario
- Métodos de pago guardados: cada `PaymentMethod` puede tener un `stripeId` (pm_xxx) para pagos recurrentes
