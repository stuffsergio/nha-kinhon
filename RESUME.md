# Nha Kinhon — Documentación Completa del Proyecto

## 1. Concepto y Propósito

**Nha Kinhon** (significa "mi corazón" en crioulo de Guinea-Bissau) es una plataforma web que permite a la **diáspora guineana** (personas de Guinea-Bissau que viven en el extranjero) **enviar comida y productos a sus familiares** que aún residen en Guinea-Bissau.

### Problema que resuelve
La diáspora guineana en Europa (Portugal, España, Francia, Reino Unido) y África (Senegal) quiere ayudar económicamente a sus familias, pero enviar dinero no garantiza que los productos lleguen correctamente. Nha Kinhon permite **seleccionar productos específicos de mercados locales** y enviarlos directamente a la dirección del destinatario.

### Usuarios finales
1. **Pagador/Diáspora** — Guineano en el extranjero que compra y paga productos para enviar
2. **Destinatario** — Familiar en Guinea-Bissau que recibe los productos
3. **Administrador** — Gestiona mercados, productos, pedidos y usuarios

---

## 2. Stack Tecnológico

| Capa | Tecnología | Versión |
|---|---|---|
| **Frontend** | React + Vite + Tailwind CSS | React 19 / Vite 8 / Tailwind 4 |
| **Backend** | Node.js + Express | Express 5 |
| **Base de datos** | PostgreSQL + Prisma ORM | Prisma 6 |
| **Autenticación** | JWT (access 15min + refresh 7d, rotation) | jsonwebtoken + bcrypt |
| **Validación** | Zod | — |
| **Pagos** | Stripe (preparado, no integrado al 100%) | — |
| **Mapas** | Leaflet + react-leaflet (OpenStreetMap, sin API key) | Leaflet 1.9 |
| **Data Fetching** | TanStack React Query | v5 |
| **Routing** | React Router DOM | v7 |
| **Iconos** | Lucide React | — |
| **Animación** | Framer Motion | v12 |
| **Lenguaje** | JavaScript (ESM, frontend y backend) | — |
| **Hosting** | Vercel (frontend) + Render (backend + PostgreSQL) | — |

---

## 3. Estructura del Proyecto

```
nha-kinhon/
├── .gitignore
├── .node-version                  (Node 20)
├── apple-DESIGN.md                (Sistema de diseño Apple)
├── backend/                       (Backend Express + Prisma)
│   ├── .env                       (Variables de entorno)
│   ├── index.js                   (Entry point del servidor)
│   ├── package.json
│   ├── prisma/
│   │   ├── schema.prisma          (Modelo de datos)
│   │   ├── seed.js                (Seed de datos)
│   │   └── migrations/            (Migraciones SQL)
│   ├── seed/                      (Datos seed en JSON)
│   │   ├── markets.json
│   │   ├── categories.json
│   │   ├── products.json
│   │   └── users.json
│   └── src/
│       ├── config/
│       │   ├── db.js              (Singleton Prisma Client)
│       │   └── env.js             (Validación de env vars)
│       ├── controllers/           (13 controladores)
│       ├── middleware/
│       │   ├── auth.js            (JWT Bearer verification)
│       │   ├── admin.js           (Role check ADMIN)
│       │   └── validate.js        (Zod schema validation)
│       ├── routes/                (13 grupos de rutas)
│       ├── services/
│       │   ├── email.service.js
│       │   ├── payment.service.js
│       │   └── notification.service.js
│       └── utils/
│           ├── errors.js          (Clases de error)
│           └── jwt.js             (Firmar/verificar tokens)
├── dist/                          (Build de producción)
├── eslint.config.js
├── index.html                     (Entry HTML)
├── package.json
├── PLAN_BACKEND.md                (Plan arquitectura backend)
├── public/
│   ├── favicon.svg
│   └── icons.svg
├── README.md
├── READY_PRODUCTION.md            (Plan de despliegue)
├── src/                           (Frontend React)
│   ├── App.css                    (Vacío)
│   ├── App.jsx                    (Configuración de rutas)
│   ├── assets/                    (Imágenes estáticas)
│   ├── components/                (17 componentes)
│   ├── context/                   (3 contextos)
│   │   ├── AuthContext.jsx
│   │   ├── CartContext.jsx
│   │   └── ToastContext.jsx
│   ├── hooks/                     (8 hooks TanStack Query)
│   ├── index.css                  (Tailwind + Apple Design System)
│   ├── layouts/
│   │   └── MainLayout.jsx         (NavBar + Outlet + Footer + BottomNav)
│   ├── main.jsx                   (Entry point con providers)
│   ├── pages/                     (9 páginas)
│   └── services/
│       └── api.js                 (Cliente HTTP con refresh JWT)
├── vercel.json
└── vite.config.js
```

---

## 4. Arquitectura del Backend

### Entry Point (`backend/index.js`)
- Express con cors, cookie-parser, JSON body parser
- Endpoint de salud: `GET /api/health`
- Sirve el frontend build en producción (Express static)
- Manejo centralizado de errores con `AppError`
- 13 grupos de rutas bajo `/api/`

### Modelo de Datos (Prisma)

14 modelos principales con sus relaciones:

```
User (1) ──< CartItem >── Product
User (1) ──< Order >── OrderItem >── Product
User (1) ──< Favorite >── Product
User (1) ──< Contact
User (1) ──< PaymentMethod
User (1) ──< Notification
User (1) ──< Supporter

Market (1) ──< Product >── Category
Product >── Category
Product >── Market
```

| Modelo | Campos clave |
|---|---|
| **User** | name, email (único), password (bcrypt), phone, avatar, balance, role (USER/ADMIN), refreshToken |
| **Market** | name, type (MERCADO_LOCAL/SUPERMERCADO/TIENDA_ESPECIALIZADA), location, address, phone, hours, coordinates (JSON), lat, lng |
| **Category** | name (único), icon, image |
| **Product** | name, description, price, unit, categoryId, marketId, available |
| **CartItem** | userId + productId (unique), quantity |
| **Order** | userId, status (PENDING/CONFIRMED/PROCESSING/SHIPPED/DELIVERED/CANCELLED), subtotal, shipping, total, recipientName/Phone/Address, notes, stripePaymentId |
| **OrderItem** | Snapshot de product (name, price, quantity) al crear el pedido |
| **Favorite** | userId + productId (unique) |
| **Contact** | userId, name, email, phone, address |
| **PaymentMethod** | type (VISA/MASTERCARD/MPESA/ORANGE_MONEY), last4, expiry, stripeId, isDefault |
| **Notification** | type (ORDER_CONFIRMED/PROCESSING/SHIPPED/DELIVERED/PAYMENT_RECEIVED/PROMO), title, message, read |
| **Supporter** | Testimonios: name, message, avatar, approved |

### Middleware
- **auth.js** — Extrae y verifica JWT Bearer token, adjunta `req.user` con `{id, email, role}`
- **admin.js** — Verifica `req.user.role === "ADMIN"`, lanza ForbiddenError si no
- **validate.js** — Valida `req.body` con esquema Zod, lanza ValidationError con mensajes descriptivos

### Utilidades
- **jwt.js** — `signAccessToken(payload)` / `signRefreshToken(payload)` / `verifyToken(token)`
- **errors.js** — `AppError` (base), `NotFoundError` (404), `UnauthorizedError` (401), `ForbiddenError` (403), `ValidationError` (400)

### Endpoints de la API

| Grupo | Endpoints | Auth | Descripción |
|---|---|---|---|
| **/api/auth** | register, login, refresh, logout, me (GET/PUT), password | Mix | Registro, login, refresh rotation, perfil |
| **/api/markets** | CRUD + filtros tipo/ubicación | Admin write | Mercados con coordenadas |
| **/api/categories** | CRUD | Admin write | Categorías de productos |
| **/api/products** | CRUD + filtros (categoría, mercado, precio, búsqueda) + paginación | Admin write | Productos con precio FCFA |
| **/api/search** | GET /?q=texto | No | Búsqueda textual en products/markets/categories |
| **/api/cart** | GET, POST item, PUT item, DELETE item, DELETE all | Sí | Carrito por usuario |
| **/api/orders** | GET list, GET by id, POST checkout, PUT status (admin), POST cancel, GET all (admin) | Sí | Pedidos con máquina de estados |
| **/api/favorites** | GET list, POST add, DELETE remove | Sí | Favoritos upsert |
| **/api/contacts** | CRUD | Sí | Contactos por usuario |
| **/api/payment-methods** | CRUD + set default | Sí | Métodos de pago |
| **/api/notifications** | GET, PUT read, PUT read-all, GET unread-count | Sí | Notificaciones |
| **/api/supporters** | GET approved (público), POST, PUT approve (admin), DELETE (admin) | Mix | Testimonios |
| **/api/stripe** | POST create-payment-intent, POST webhook | Mix | Pagos Stripe |

### Flujo de Checkout
1. `POST /api/orders/checkout` (autenticado)
2. Valida que el carrito no esté vacío
3. Crea Order con datos del destinatario (recipientName, recipientPhone, recipientAddress, notes)
4. Crea OrderItems con snapshot de productos (name, price, quantity)
5. Calcula subtotal, envio (gratis), total
6. Limpia el carrito del usuario
7. Crea notificación de pedido confirmado
8. Devuelve la orden creada

### Seed Data
- **2 usuarios**: Admin (`admin@nhakinhon.com` / `admin1234`) y demo (`carlos@example.com` / `123456`)
- **6 mercados**: Mercado Central de Bissau, Supermercado Eléctrico, Mercado de Bandim, Tienda de Alimentos Sao Jose, Mercado Regional de Gabu, Supermercado Canchungo (todos con lat/lng reales)
- **16 categorías**: Frutas, Verduras, Carnes, Pescados, Lácteos, Panadería, Granos, Tubérculos, Bebidas, Aceites, Condimentos, Snacks, Postres, Frutos Secos, Desayuno, Endulzantes
- **48 productos**: Precios en FCFA, unidades variadas (kg, l, unidad, docena, paquete, botella, frasco, caja, barra, lata)
- **Datos de ejemplo**: Favoritos, contactos y métodos de pago para el usuario demo

---

## 5. Arquitectura del Frontend

### Entry Point (`src/main.jsx`)

Orden de providers (de afuera hacia adentro):

```
StrictMode
  QueryClientProvider (TanStack Query — staleTime: 30s, retry: 1)
    BrowserRouter (React Router DOM)
      ErrorBoundary (class component, captura errores de render)
        AuthProvider (autenticación JWT)
          CartProvider (carrito sincronizado con API)
            ToastProvider (notificaciones toast)
              App (Routes)
```

### Routing (`src/App.jsx`)

Todas las rutas dentro de `MainLayout` (NavBar + Footer + BottomNavBar comunes):

| Ruta | Página | Descripción |
|---|---|---|
| `/` | **Home** | Hero section, categorías populares, mercados |
| `/mapa` | **Map** | Mapa Leaflet interactivo con mercados |
| `/buscar` | **Search** | Búsqueda de productos + categorías |
| `/carrito` | **Cart** | Carrito + formulario checkout |
| `/perfil` | **Profile** | Dashboard multi-tab |
| `/login` | **Login** | Login/registro, soporta `?mode=register` |
| `/servicios` | **Services** | Página institucional de servicios |
| `/supporters` | **Support** | Testimonios de usuarios |
| `*` | **NotFound** | Página 404 con "Volver al inicio" |

### Layout Componentes
- **NavBar** — Logo "Nha Kinhon" (izquierda), enlaces Mapa/Buscar/Servicios/Supporters (centro), auth login/register o nombre+salir (derecha)
- **Footer** — 3 columnas (marca + descripción, navegación con links SPA, contacto), barra inferior con Servicios/Supporters, copyright
- **BottomNavBar** — Navegación inferior fija para móvil (Home, Mapa, Buscar, Carrito con badge de cantidad, Perfil)

### Sistema de Diseño (Apple-inspired, definido en `apple-DESIGN.md`)

**Colores:**
- Action Blue: `#0066cc` (primary), `#0071e3` (hover)
- Action Blue on dark: `#2997ff`
- Fondos: `#ffffff` (canvas), `#f5f5f7` (parchment), `#272729` (tile oscuro)
- Texto: `#1d1d1f` (ink), `#7a7a7a` (muted)
- Líneas: `#e0e0e0` (hairline), `#f0f0f0` (divider)
- Estados: rojo error, verde success

**Tipografía:**
- Display: `SF Pro Display`, system-ui, -apple-system, sans-serif (headings)
- Body: `SF Pro Text`, system-ui, -apple-system, sans-serif (cuerpo)
- Clases utilitarias: `.font-apple-display`, `.font-apple-body`

**Radios:**
- xs: 5px, sm: 8px, md: 11px, lg: 18px (cards), pill: 9999px (botones)

**Elevación:**
- Sin sombras por defecto (`.no-shadow`)
- Solo `shadow-product` para productos en hover: `rgba(0,0,0,0.22) 3px 5px 30px 0`

**Animaciones:**
- `toast-in`: slide desde derecha (0.3s ease-out)
- `fade-in`: scale(0.95) + translateY(8px) → scale(1) (0.25s ease-out)
- `marker-pulse`: pulse en marcadores de mapa seleccionados

### Contextos (State Management)

| Contexto | Estado | Métodos | Persistencia |
|---|---|---|---|
| **AuthContext** | `user`, `loading` | `login()`, `register()`, `logout()`, `updateUser()` | accessToken en localStorage, refresh en localStorage |
| **CartContext** | `cart[]`, `loading`, `cartTotal` | `addToCart()`, `removeFromCart()`, `updateQuantity()`, `clearCart()` | API (no localStorage) |
| **ToastContext** | `toasts[]` | `addToast(message, type, duration)` | Solo estado React |

**AuthContext** detalles:
- Al montar, verifica si existe accessToken en localStorage y llama a `GET /api/auth/me`
- `login()` y `register()` reciben tokens del backend y los almacenan via `setTokens()`
- `logout()` llama a `POST /api/auth/logout`, limpia tokens y estado
- Dispara evento `auth:logout` para que otros componentes reaccionen

**CartContext** detalles:
- Cuando `user` cambia, fetch del carrito desde API
- `addToCart()` llama a `POST /api/cart/items`, lanza error si no hay sesión
- Los errores se propagan al UI (no se silencian)
- `cartTotal` es computado (reduce sobre cart)

**ToastContext** detalles:
- renderiza contenedor `fixed bottom-24 right-6 z-[99999]`
- Tipos: success (verde `#059669`), error (rojo `#dc2626`), info (azul `#0066cc`)
- Auto-dismiss por defecto a los 4000ms
- Iconos Lucide: CheckCircle, AlertCircle, Info
- Botón cerrar individual

### Hooks (TanStack Query v5)

| Hook | Endpoint | Descripción |
|---|---|---|
| `useCategories()` | `GET /api/categories` | Lista todas las categorías |
| `useCategory(id)` | `GET /api/categories/:id` | Categoría individual |
| `useMarkets()` | `GET /api/markets` | Lista todos los mercados |
| `useMarket(id)` | `GET /api/markets/:id` | Mercado individual |
| `useProducts(filters)` | `GET /api/products` | Productos con filtros y paginación, soporta `placeholderData` (keepPreviousData) |
| `useProduct(id)` | `GET /api/products/:id` | Producto individual |
| `useSearch(query)` | `GET /api/search?q=query` | Búsqueda habilitada solo cuando query no está vacío |
| `useOrders()` | `GET /api/orders` | Pedidos del usuario autenticado |
| `useCheckout()` | `POST /api/orders/checkout` | Mutación de checkout |
| `useFavorites()` | `GET /api/favorites` | Favoritos del usuario |
| `useAddFavorite()` | `POST /api/favorites/:productId` | Mutación añadir favorito |
| `useRemoveFavorite()` | `DELETE /api/favorites/:productId` | Mutación quitar favorito |
| `useContacts()` | `GET /api/contacts` | Contactos del usuario |
| `useCreateContact()` | `POST /api/contacts` | Mutación crear contacto |
| `useUpdateContact()` | `PUT /api/contacts/:id` | Mutación actualizar contacto |
| `useDeleteContact()` | `DELETE /api/contacts/:id` | Mutación eliminar contacto |
| `useNotifications()` | `GET /api/notifications` | Notificaciones del usuario |
| `useUnreadCount()` | `GET /api/notifications/unread-count` | Contador no leídas |
| `useMarkAsRead()` | `PUT /api/notifications/:id/read` | Mutación marcar leída |
| `useMarkAllAsRead()` | `PUT /api/notifications/read-all` | Mutación marcar todas leídas |

### Cliente API (`src/services/api.js`)

- **Fetch nativo** (sin axios)
- **Base URL**: `import.meta.env.VITE_API_URL` o fallback a `http://localhost:3000/api`
- **Headers automáticos**: `Content-Type: application/json`, `Authorization: Bearer <token>` (si existe)
- **Query strings**: Construcción automática desde objeto `params`
- **Refresh automático**: En 401, intenta refresh con `POST /api/auth/refresh`; refreshes concurrentes se deduplican con promesa compartida
- **Métodos exportados**: `api.get()`, `api.post()`, `api.put()`, `api.del()`
- **Token management**: `setTokens(access, refresh)`, `clearTokens()`, `getAccessToken()`, `setAccessToken()`

### Páginas — Detalle

#### Home (`/`)
- Hero section full-width: título "NHA KINHON", subtítulo, CTAs "Comenzar" → `/buscar` y "Explorar" → `/mapa`
- Sección "Categorías Populares": grid de 6 categorías con emoji, cada una linkea a `/buscar?categoryId=X`
- Sección oscura "Mercados y Tiendas": grid de mercados con nombre, ubicación, horario, botón "Ver productos" → `/mapa`
- Estados de carga: texto "Cargando..." (pendiente de migrar a skeleton)

#### Search (`/buscar`)
- SearchBar con input pill-shaped y icono de búsqueda
- CategorySuggestion: grid de categorías como botones, dos callbacks — `onCategoryClick(category)` y `onSearchClick(query)`
- Click en categoría → fetch a `GET /api/products?categoryId=X` con link "← Todas las categorías" para volver
- SearchHistory: búsquedas recientes en localStorage con chips y botón "Limpiar"
- SearchResults: resultados agrupados (productos, mercados, categorías)
- Botón "Agregar" en productos: verifica autenticación, si no → redirect a `/login`; si sí → `addToCart()` con feedback visual (disabled + "...")
- Estados: carga (skeleton pendiente), vacío, error

#### Map (`/mapa`)
- Mapa react-leaflet centrado en Guinea-Bissau (11.95, -15.25), zoom 7-12, bounds del país
- FitBoundsOnLoad: ajusta vista cuando llegan datos de mercados
- Filtros: 3 botones de tipo (Mercado Local rojo, Supermercado azul, Tienda Especializada morado), activables/desactivables
- Buscador de mercados con input
- Contador: "X mercados encontrados"
- Botón "Centrar" (Crosshair) para resetear vista
- MarketMarker: L.divIcon cacheado (no recrea en cada render)
  - Doble anillo: exterior translúcido + interior sólido, punto blanco central
  - Colores por tipo: rojo `#dc2626`, azul `#0066cc`, morado `#7c3aed`
  - Animación pulse al seleccionar (clave CSS `marker-pulse`)
  - Tooltip al hover con nombre del mercado
- MarketModal: fade-in, header degradado con color del tipo, nombre + tipo badge, dirección/teléfono/horario, productos con dot de color y precio FCFA, CTA Apple
- CSS Leaflet importado en el componente

#### Cart (`/carrito`)
- Si vacío: EmptyCart con icono y "Explorar Productos" → `/buscar`
- Si con items: dos columnas (en desktop) — CartList + CartSummary
- CartList: mapea items a CartItem
- CartItem: nombre, precio/unidad, total línea, controles +/-, botón eliminar
- CartSummary:
  - Formulario de destinatario: nombre, teléfono, dirección (requeridos), notas (opcional)
  - Subtotal, envío (Gratis), total FCFA
  - Botón "Proceder al Pago": valida campos, si ok → modal confirmación
  - Modal confirmación: fade-in, muestra total y destinatario, botones Cancelar/Confirmar
  - Confirmar: `useCheckout().mutateAsync()` → toast success + redirect a /perfil
  - Error: toast error
  - "Vaciar Carrito" con confirm dialog + toast info

#### Profile (`/perfil`)
- Si no autenticado: mensaje "Inicia sesión para ver tu perfil"
- 5 tabs con iconos Lucide:
  - **Dashboard**: Nombre + email, badge notificaciones con contador, botón "Notificaciones" (marca todas leídas), cards de saldo (FCFA), pedidos count, favoritos count
  - **Favoritos**: Grid de productos con nombre, precio, botón "Quitar". Skeleton loading.
  - **Pedidos**: Lista de órdenes con ID truncado, fecha, status badge (Entregado/Pendiente/Confirmado/En Preparación/Enviado/Cancelado), destinatario, items, total. Skeleton loading.
  - **Contactos**: Lista con nombre, email, botón "Ver detalles" (modal). Skeleton loading.
  - **Configuración**: Editar nombre y email con inputs, botón "Guardar cambios" → toast success/error (reemplaza alert())
- Modal de detalles de contacto con fade-in

#### Login (`/login`)
- Diseño dos columnas responsive: izquierda (título + descripción), derecha (formulario 440px)
- Tabs conmutables "Iniciar Sesión" / "Registrarse"
- Campos: email + password (login); name + email + password + confirm password (register)
- Validación: campos requeridos, email formato, password >= 6 chars, passwords coinciden
- Soporta query param `?mode=register` para abrir directamente en registro
- Estados: loading con botón deshabilitado, error inline

#### Services (`/servicios`)
- 4 servicios en grid 2-columnas:
  1. **Envío de Productos**: Compra por categorías, selección de mercado, entrega a domicilio
  2. **Envío de Dinero**: Transferencias seguras, cambio de divisa, notificación al receptor
  3. **Asistencia Familiar**: Paquetes personalizados, seguimiento en tiempo real, confirmación de entrega
  4. **Atención al Cliente**: Soporte 24/7, asistencia en portugués y crioulo, resolución rápida
- Cada servicio: icono Lucide azul, título, descripción, features con bullet points
- CTA final "Comenzar ahora" → `/buscar`

#### Support (`/supporters`)
- 6 testimonios hardcodeados de la diáspora: Lisboa, Madrid, Dakar, Bissau, París, Londres
- Grid responsive 3-columnas con diseño de quote cards (icono Quote azul, texto entrecomillado, nombre, ubicación + año)
- Sección CTA oscura "Únete a nuestra comunidad" → registro

#### NotFound (`*`)
- 404 minimalista Apple: título grande, mensaje, link "Volver al inicio"

### Componentes

| Componente | Props | Descripción |
|---|---|---|
| **ButtonPrimary** | `onClick`, `disabled`, `children`, `className` | Botón azul pill `#0066cc`, hover `#0071e3`, disabled `#d2d2d7` |
| **ButtonSecondary** | `onClick`, `children` | Botón outline azul con hover fill |
| **SearchBar** | `value`, `onChange`, `onSearch` | Input pill con icono de búsqueda |
| **CategoryCard** | `category`, `onClick` | Link card a categoría filtrada |
| **CategorySuggestion** | `categories`, `onCategoryClick`, `onSearchClick` | Grid de categorías + sugerencias populares |
| **SearchResults** | `results`, `loading`, `addToCart` | Resultados agrupados con botones Agregar |
| **SearchHistory** | `history`, `onSelect`, `onClear` | Chips de búsquedas recientes |
| **MarketMarker** | `market`, `isSelected`, `onClick` | Marcador Leaflet custom con colores y animación |
| **MarketModal** | `market`, `onClose` | Modal detalle de mercado con fade-in |
| **MarketPreviewCard** | `market` | Card compacta de mercado |
| **CartItem** | `item`, `onUpdateQuantity`, `onRemove` | Item de carrito con controles |
| **CartList** | `cart`, `onUpdateQuantity`, `onRemove` | Lista de CartItems |
| **EmptyCart** | — | Estado vacío con CTA |
| **ActionCard** | `icon`, `title`, `description`, `to` | Link card con flecha |
| **ErrorBoundary** | `children` | Class component, fallback UI Apple con botón recargar |
| **Footer** | — | 3 columnas + barra inferior |
| **NavBar** | — | Navegación superior con auth |
| **BottomNavBar** | — | Navegación inferior móvil |

---

## 6. Flujo Completo de un Pedido (End-to-End)

```
1. Registro/Login
   → POST /api/auth/register  o  POST /api/auth/login
   → Recibe accessToken + refreshToken
   → AuthContext.login() almacena tokens y setea user

2. Explorar productos
   a) Por categoría: Home → click categoría → /buscar?categoryId=X
      → GET /api/products?categoryId=X
   b) Por búsqueda: /buscar → escribir query
      → GET /api/search?q=query
   c) Por mapa: /mapa → click marcador → ver productos del mercado
      → GET /api/products?marketId=X

3. Añadir al carrito
   → Click "Agregar" en producto
   → Verifica autenticación (si no → redirect /login)
   → CartContext.addToCart(product)
   → POST /api/cart/items  { productId, quantity: 1 }
   → UI feedback: botón disabled + "..." + toast confirmación

4. Revisar carrito
   → /carrito
   → GET /api/cart (fetch inicial)
   → Ajustar cantidades: PUT /api/cart/items/:id  { quantity }
   → Eliminar items: DELETE /api/cart/items/:id
   → Ver total actualizado en tiempo real

5. Checkout
   → Rellenar formulario: recipientName, recipientPhone, recipientAddress, notes
   → Click "Proceder al Pago"
   → Validación client-side (todos los campos requeridos)
   → Modal de confirmación: "¿Estás seguro de realizar este pedido de X FCFA para Y?"
   → Click "Confirmar"
   → POST /api/orders/checkout  { recipientName, recipientPhone, recipientAddress, notes }
     (Backend: crea Order + OrderItems, calcula total, limpia carrito, crea notificación)
   → Toast "Pedido realizado con éxito" + redirect a /perfil (tab Pedidos)
   → En caso de error: toast con mensaje de error

6. Seguimiento (futuro)
   → Admin actualiza estado: PUT /api/orders/:id/status
   → Notificación push al usuario
   → Tracking en tiempo real (WebSocket planeado)
```

---

## 7. Decisiones Técnicas y Convenciones

### Por qué se hizo así
- **Fetch nativo en vez de axios**: Menos dependencias, control total sobre refresh tokens, más liviano
- **Leaflet en vez de Google Maps**: Sin API key, OpenStreetMap gratuito, sin límites de uso
- **Sin React Hook Form**: Proyecto pequeño/MVP, formularios simples con estado local
- **Toast system propio**: Integrado con diseño Apple, evita dependencia externa, liviano
- **ErrorBoundary fuera de AuthProvider**: Captura errores de contexto también
- **JWT con rotation**: Refresh token se renueva en cada uso (seguridad)
- **Snapshots en OrderItem**: name y price se guardan al crear pedido para que cambios futuros en productos no afecten pedidos históricos
- **Categorías con icono string**: Se mapean a emoji en Home, flexibles para cambiar a SVG
- **Sin pagos reales aún**: Stripe preparado pero pendiente de integración completa en checkout

### Convenciones de código
- **ESM** en frontend y backend
- **Componentes funcionales** con hooks (excepto ErrorBoundary, class component requerido)
- **Nombres de archivos**: PascalCase para componentes/páginas, camelCase para hooks/servicios
- **Tailwind CSS**: Clases inline, sin archivos CSS de componentes individuales
- **Estilos Apple**: Solo clases utilitarias + tokens del theme en index.css
- **Sin TypeScript**: Proyecto en JavaScript puro

---

## 8. Infraestructura y Despliegue

### Desarrollo Local
```bash
# 1. Iniciar PostgreSQL (Docker)
docker start nha-postgres
#     Puerto: 5433, DB: nha_kinhon, User: postgres

# 2. Backend
cd backend
cp .env.example .env    # Configurar DATABASE_URL
npm install
npx prisma migrate dev
npm run db:seed
npm run dev             # http://localhost:3000

# 3. Frontend (otra terminal)
npm install
npm run dev             # http://localhost:5173
```

### Variables de Entorno Backend
```
PORT=3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/nha_kinhon
JWT_SECRET=<random-string>
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CLIENT_URL=http://localhost:5173
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
```

### Variables de Entorno Frontend
```
VITE_API_URL=http://localhost:3000/api
```

### Producción
- **Frontend**: Vercel (import desde GitHub, build automático, SPA rewrites en `vercel.json`)
- **Backend**: Render Web Service + Render PostgreSQL
- **Build**: `npm run build` (Vite) → carpeta `dist/` → servida por Express en producción
- **Script postinstall**: `npx prisma generate`
- **Migraciones**: `db:migrate:deploy` en deploy de Render
- **Seed**: Ejecutar manualmente `npm run db:seed` tras el primer deploy

### URLs de Producción
- Frontend: `https://nhakinhon.com` (o dominio personalizado)
- Backend: `https://nha-kinhon-api.onrender.com`
- Health check: `https://nha-kinhon-api.onrender.com/api/health`

---

## 9. Estado Actual y Roadmap

### ✅ Completado
- Backend completo con 13 grupos de rutas, autenticación JWT, Prisma ORM, validación Zod
- Frontend con diseño Apple, 9 páginas, mapa Leaflet, TanStack Query, routing completo
- Seed data con mercados/categorías/productos reales de Guinea-Bissau
- Sistema de autenticación completo (login/register/refresh/logout/profile)
- Carrito de compras funcional con checkout y persistencia en BD
- Perfil de usuario multi-tab con pedidos/favoritos/contactos/notificaciones
- Mapa interactivo con marcadores personalizados por tipo de mercado
- Búsqueda con categorías y texto libre
- Sistema de notificaciones toast con tipos success/error/info
- ErrorBoundary + página 404
- Plan de producción detallado (Vercel + Render)
- Documentación: apple-DESIGN.md (562 líneas), PLAN_BACKEND.md (757 líneas), READY_PRODUCTION.md (328 líneas)
- Rutas /servicios y /supporters con diseño Apple
- Loading skeletons en perfil
- Confirmación en checkout (modal) y acciones destructivas

### 🔜 Pendiente / Futuro
- **Pagos reales**: Integrar Stripe PaymentIntent en el flujo de checkout
- **Panel admin**: Web separada para gestión de mercados, productos, pedidos
- **Subida de imágenes**: Multer + Cloudinary/S3 (código preparado)
- **Confirmación por email**: SMTP configurado pero sin implementar
- **Tests**: Sin tests automatizados (pendiente)
- **i18n**: Soporte multilingüe (portugués, crioulo)
- **PWA**: Service worker para notificaciones push offline
- **WebSockets**: Tracking de pedidos en tiempo real
- **Skeleton loaders**: Migrar todos los "Cargando..." a skeletons
- **SEO**: Meta tags dinámicos por página
- **Analytics**: Seguimiento de usuarios y pedidos

### Issues Conocidos
- Chunk size > 500 kB (warning de Vite, necesita code splitting)
- Sin TypeScript (progresivamente añadible)
- Stripe no integrado en checkout real
- Sin tests de integración ni unitarios
- Sin validación de email

---

## 10. Para Desarrolladores Nuevos

### Primeros pasos
1. Leer este documento completo
2. Leer `apple-DESIGN.md` para entender el sistema de diseño
3. Leer `PLAN_BACKEND.md` para entender la arquitectura de la API
4. Leer `READY_PRODUCTION.md` para entender el despliegue
5. Setup local siguiendo las instrucciones de la sección 8
6. Ejecutar seed para tener datos de prueba
7. Explorar el frontend en `http://localhost:5173`

### Credenciales de Prueba (seed)
- **Admin**: admin@nhakinhon.com / admin1234
- **Usuario**: carlos@example.com / 123456

### Dependencias Clave
| Paquete | Propósito |
|---|---|
| `@tanstack/react-query` | Data fetching, caching, mutations |
| `react-router-dom` | Routing SPA con layouts anidados |
| `react-leaflet` + `leaflet` | Mapas OpenStreetMap |
| `lucide-react` | Iconos SVG |
| `framer-motion` | Animaciones (preparado, uso limitado) |
| `@prisma/client` | ORM PostgreSQL |
| `jsonwebtoken` + `bcrypt` | Autenticación |
| `zod` | Validación de schemas |
| `stripe` | Pagos (preparado) |
| `multer` | File uploads (preparado) |
