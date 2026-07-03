# Plan de Desarrollo: App Móvil Nha Kinhon (Android)

## Stack Tecnológico

| Capa           | Tecnología                                  |
| -------------- | ------------------------------------------- |
| Framework      | React Native 0.81+ con **Expo SDK 53**     |
| Navegación     | **Expo Router** (file-based routing)        |
| Estado/Server  | **TanStack React Query** v5 (mismo que web) |
| Diseño         | Apple Design System adaptado a RN           |
| Notificaciones | **Firebase Cloud Messaging (FCM)**          |
| Pagos          | Stripe SDK para React Native (`@stripe/stripe-react-native`) |
| Mapas          | `react-native-maps` con OpenStreetMap (o Google Maps en Android) |
| Backend        | **Mismo backend Express + Prisma + Neon** (Railway) |
| Auth           | JWT (access 15m + refresh 7d cookie) - mismo flujo que web |
| Fonts          | SF Pro (licencia propia) o **Inter** como sustituto open-source |
| Build          | EAS Build (Expo Application Services)       |

## Arquitectura

```
nha-kinhon-mobile/
├── app/                          # Expo Router (file-based)
│   ├── _layout.tsx               # Root layout (providers)
│   ├── (onboarding)/             # Landing / onboarding
│   │   ├── _layout.tsx
│   │   └── index.tsx
│   ├── (auth)/                   # Auth screens
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   └── register.tsx
│   ├── (tabs)/                   # Main tabs (logged in)
│   │   ├── _layout.tsx           # Tab navigator
│   │   ├── index.tsx             # Home / Inicio
│   │   ├── search.tsx            # Buscar + resultados
│   │   ├── cart.tsx              # Carrito
│   │   └── profile.tsx           # Perfil
│   ├── checkout/
│   │   └── index.tsx             # Checkout flow
│   ├── tienda/
│   │   └── [id].tsx              # Market detail
│   ├── pedido/
│   │   └── [id].tsx              # Order detail + tracking vivo
│   ├── admin/
│   │   └── _layout.tsx           # Admin panel
│   ├── delivery/
│   │   ├── login.tsx
│   │   └── dashboard.tsx
│   └── mapa.tsx                  # Map
│
├── src/
│   ├── components/               # UI Components
│   │   ├── ui/                   # Atomic design system
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Toast.tsx
│   │   │   └── ...
│   │   ├── OrderTimeline.tsx     # Timeline visual del pedido
│   │   ├── ProductCard.tsx
│   │   ├── CategoryGrid.tsx
│   │   ├── ContactCard.tsx
│   │   └── Markers/              # Map markers & overlays
│   │
│   ├── hooks/                    # TanStack Query hooks
│   │   ├── useAuth.ts
│   │   ├── useCart.ts
│   │   ├── useProducts.ts
│   │   ├── useCategories.ts
│   │   ├── useMarkets.ts
│   │   ├── useOrders.ts
│   │   ├── useContacts.ts
│   │   └── useNotifications.ts
│   │
│   ├── context/                  # React Contexts
│   │   ├── AuthContext.tsx
│   │   ├── CartContext.tsx
│   │   └── ThemeContext.tsx
│   │
│   ├── services/                 # API & external services
│   │   ├── api.ts                # Axios/fetch wrapper con JWT
│   │   ├── stripe.ts             # Stripe mobile SDK config
│   │   ├── fcm.ts                # Firebase Cloud Messaging
│   │   └── notifications.ts      # Notifcaciones locales
│   │
│   ├── design/                   # Design tokens (Apple-inspired)
│   │   ├── colors.ts
│   │   ├── typography.ts
│   │   ├── spacing.ts
│   │   └── shadows.ts
│   │
│   └── utils/
│       ├── storage.ts            # AsyncStorage helpers
│       ├── format.ts             # Currency, dates, etc.
│       └── map.ts                # Map utilities
│
├── assets/
│   ├── fonts/                    # Inter / SF Pro
│   ├── images/
│   └── icons/
│
├── app.json                      # Expo config
├── eas.json                      # EAS Build config
├── firebase.json                 # FCM config
├── tsconfig.json
└── package.json
```

## Fases de Desarrollo

### Fase 0: Setup del proyecto (Día 1)

```bash
npx create-expo-app@latest nha-kinhon-mobile --template blank-typescript
cd nha-kinhon-mobile
npx expo install expo-router expo-linking expo-constants
npx expo install @tanstack/react-query axios
npx expo install @react-native-async-storage/async-storage
npx expo install expo-secure-store   # para tokens JWT
npx expo install expo-font           # carga de fuentes
npx expo install react-native-screens react-native-safe-area-context
```

**Configuración inicial:**
- `app.json`: scheme, deep links, splash screen
- `tsconfig.json`: strict mode, path aliases (`@/` → `src/`)
- Expo Router layout: root `_layout.tsx` con providers
- EAS Build config: `eas.json` para builds Android

**Estructura base del layout:**
```tsx
// app/_layout.tsx
export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <Stack screenOptions={{ headerShown: false }} />
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
```

### Fase 1: Design System (Día 2)

Migrar el design system Apple de la web a React Native.

**Tokens (`src/design/`):**

```typescript
// colors.ts
export const colors = {
  primary: "#0066cc",
  primaryFocus: "#0071e3",
  primaryOnDark: "#2997ff",
  ink: "#1d1d1f",
  inkMuted: "#7a7a7a",
  canvas: "#ffffff",
  canvasParchment: "#f5f5f7",
  hairline: "#e0e0e0",
  success: "#059669",
  error: "#dc2626",
  // ...
};

// typography.ts
export const typography = {
  display: {
    fontSize: 28,
    fontWeight: "600",
    letterSpacing: -0.36,
    fontFamily: "Inter_600SemiBold",
  },
  body: {
    fontSize: 17,
    fontWeight: "400",
    letterSpacing: -0.374,
    fontFamily: "Inter_400Regular",
  },
  // etc.
};
```

**Componentes base (`src/components/ui/`):**
- `Button.tsx` - primary, secondary, danger, pill shape
- `Card.tsx` - contenedor con bg gris + border sutil
- `Badge.tsx` - etiquetas tipo "Próximamente"
- `Input.tsx` - campo de texto Apple-style
- `Header.tsx` - encabezado con título opcional
- `Toast.tsx` - notificaciones toast
- `Skeleton.tsx` - loading placeholders

**Fuente:** Inter como sustituto de SF Pro (open-source, misma métrica).

### Fase 2: Onboarding + Landing (Día 3)

Pantalla que ve el usuario sin sesión.

**Screens:**
- `app/(onboarding)/index.tsx` - Hero + CTA (Crear cuenta, Iniciar sesión)
- `app/(onboarding)/_layout.tsx` - Layout sin tabs, sin header

**Componentes:**
- Hero con gradiente oscuro (fondo negro)
- Secciones: Cómo funciona (3 pasos), Por qué Nha Kinhon, CTA final
- Diseño idéntico al Landing.jsx web, adaptado a pantallas táctiles

**Flujo:**
1. Usuario abre app → ve landing
2. Si ya tiene sesión (token válido en SecureStore) → redirige a home
3. Si no → landing → botón "Crear cuenta" o "Iniciar sesión"

### Fase 3: Auth Flow (Día 3-4)

Replicar el flujo JWT de la web.

**Screens:**
- `app/(auth)/login.tsx` - Login form (email + password)
- `app/(auth)/register.tsx` - Register form (name + email + password + confirm)

**Lógica de auth (`src/context/AuthContext.tsx`):**
```typescript
// Misma lógica que la web:
// - login(email, password) → POST /api/auth/login
// - register(name, email, password) → POST /api/auth/register
// - Guarda access token en SecureStore
// - Refresh token en cookie HttpOnly (misma API)
// - logout() → limpia SecureStore
```

**API Service (`src/services/api.ts`):**
```typescript
// Axios instance con:
// - baseURL desde env
// - Interceptor para añadir Bearer token desde SecureStore
// - Interceptor para refresh automático en 401
// - withCredentials: true para cookies
```

**SecureStore vs AsyncStorage:**
- Access token → **SecureStore** (encriptado, seguro)
- User data → **AsyncStorage** (no sensible)
- Refresh token → **cookie HttpOnly** (igual que web)

### Fase 4: Home + Tabs (Día 4-5)

Pantalla principal después de login.

**Tab Navigator (`app/(tabs)/_layout.tsx`):**
```
Bottom tabs: Home | Buscar | Carrito | Perfil
```

**Home (`app/(tabs)/index.tsx`):**
- Hero compacto (NHA KINHON + tagline + botones)
- Categorías Populares (grid horizontal scrollable)
- Productos Destacados (grid 2 columnas)
- Mercados y Tiendas (lista vertical)
- Mis Contactos (grid)

**Componentes clave:**
- `CategoryChip.tsx` - chip horizontal para categorías (scroll horizontal)
- `ProductCard.tsx` - card de producto con imagen, nombre, precio, tienda
- `MarketCard.tsx` - card de mercado con info

### Fase 5: Búsqueda (Día 5-6)

**Search Screen (`app/(tabs)/search.tsx`):**
- Search bar con debounce (igual que web)
- Categorías como chips sugeridos
- Historial de búsqueda (AsyncStorage)
- Resultados: productos + mercados + categorías
- Filtro por categoría (desde URL params o estado global)

**Flujo:**
1. Escribe → debounce → `useSearch(query)` → resultados
2. Click categoría → `useProducts({ categoryId })` → grid de productos
3. Agregar al carrito → toast confirmación

**Compartido con Fase 0:** Los hooks `useProducts`, `useCategories`, `useMarkets`, `useSearch` son casi idénticos a los de la web. Se pueden copiar y adaptar.

### Fase 6: Carrito + Checkout (Día 6-8)

**Carrito (`app/(tabs)/cart.tsx`):**
- Lista de items con cantidad, precio, subtotal
- Swipe para eliminar
- Botón "Ir a pagar"
- Resumen: subtotal, delivery, total

**Cart Context (`src/context/CartContext.tsx`):**
- Misma lógica que la web: `addToCart`, `removeFromCart`, `updateQuantity`, `clearCart`
- Persistido en AsyncStorage
- Sincronizado con backend (`GET /api/cart`, `POST /api/cart/items`)

**Checkout (`app/checkout/index.tsx`):**
- Stripe checkout con `@stripe/stripe-react-native`
- Payment Sheet (UI nativa de Stripe) en vez de Checkout Session redirect
  - `initPaymentSheet`, `presentPaymentSheet`
- Dirección de entrega
- Selección de contacto
- Confirmar pedido

**Alternativa:** Usar WebView con Stripe Checkout Session (más parecido a la web, menos código nativo). Decisión pendiente.

**Post-pago:**
- Webhook `checkout.session.completed` (mismo backend) limpia carrito
- Redirige a Order Detail
- Toast de confirmación

### Fase 7: Pedidos + Timeline en vivo (Día 8-9)

**Order List (`app/(tabs)/profile.tsx` → sección "Mis Pedidos"):**
- Lista de pedidos con estado, fecha, total
- Pull-to-refresh
- Click → Order Detail

**Order Detail (`app/pedido/[id].tsx`):**
- Timeline visual con 7 estados (igual que web):
  ```
  PENDING → CONFIRMED → PREPARING → SHIPPED → PICKED_UP → IN_TRANSIT → DELIVERED
  ```
- Cada estado con icono, fecha/hora, descripción
- Barra de progreso animada
- Pull-to-refresh para estado en vivo
- Polling cada 30s con `refetchInterval` de React Query

**Delivery tracking en vivo:**
- Si el pedido está `IN_TRANSIT`:
  - Mapa con ubicación del delivery (actualizado vía polling)
  - Tiempo estimado de llegada
  - Botón de contacto con el repartidor

### Fase 8: Perfil + Contactos (Día 9-10)

**Profile (`app/(tabs)/profile.tsx`):**
- Cabecera con nombre, email, avatar (iniciales)
- Tabs: Mis Pedidos | Contactos | Favoritos | Ajustes
- Editar perfil (nombre, email)
- Cerrar sesión

**Contactos:**
- CRUD completo (igual que web)
- Tarjetas con nombre, email, teléfono, dirección
- Botón "Añadir contacto"
- Formulario modal

### Fase 9: Admin Panel (Día 10-12)

**Admin (`app/admin/`):**
- Tabs: Pedidos | Asignar | Delivery
- Lista de pedidos con filtros (estado, fecha)
- Asignar delivery a pedido
- CRUD de productos (solo admin)
- Dashboard con stats

**Restricción:** Solo accesible para usuarios con `role === "ADMIN"`.

### Fase 10: Delivery Dashboard (Día 12-13)

**Delivery login (`app/delivery/login.tsx`):**
- Login separado para repartidores (mismo endpoint que web)

**Delivery dashboard (`app/delivery/dashboard.tsx`):**
- 3 tabs: Disponibles | Mis Activos | Historial
- Aceptar pedido
- Actualizar estado (PICKED_UP, IN_TRANSIT, DELIVERED)
- Location sharing (background geolocation con `expo-location`)

**Location sharing:**
- Cuando delivery marca `PICKED_UP`, empieza a compartir ubicación
- `expo-location` con foreground service
- Envía lat/lng al backend cada 10s
- Cliente obtiene ubicación vía endpoint `GET /api/orders/:id/tracking`

### Fase 11: Mapas (Día 13-14)

**Mapa (`app/mapa.tsx`):**
- `react-native-maps` con OpenStreetMap (tiles)
- Marcadores de mercados
- Click en marcador → Market Detail
- Geolocalización del usuario
- Mapa de tracking del delivery (cuando aplica)

**Reto:** `react-native-maps` usa Google Maps por defecto en Android.
Necesitamos usar `react-native-maps` con provider OpenStreetMap o configurar
API key de Google Maps.

**Alternativa:** Usar WebView con Leaflet (como la web). Más sencillo pero menos nativo.

### Fase 12: Notificaciones Push (Día 14-15)

**Firebase Cloud Messaging:**

1. **Firebase project setup**
   - Crear proyecto en Firebase Console
   - Añadir app Android (package name: `com.nhakinhon.app`)
   - Descargar `google-services.json` → `app/`
   - Configurar FCM en Expo: `expo install expo-notifications expo-device`

2. **Token registration**
   ```typescript
   // Al iniciar sesión, registrar token FCM en backend
   const token = await Notifications.getExpoPushTokenAsync();
   await api.post("/notifications/register", { token, platform: "android" });
   ```

3. **Backend endpoint**
   - `POST /api/notifications/register` - guarda token FCM del usuario
   - `POST /api/notifications/send` - envía push (admin/backend)

4. **Eventos que disparan notificaciones:**
   - Pedido confirmado → "¡Tu pedido ha sido confirmado!"
   - Pedido en preparación → "Estamos preparando tu pedido"
   - Pedido enviado → "Tu pedido está en camino"
   - Delivery asignado → "[Nombre] recogerá tu pedido"
   - Pedido entregado → "¡Pedido entregado! Confirma que todo está bien"
   - Nuevo mensaje de soporte

5. **Notificaciones locales** (offline/estado app):
   - Recordatorio de carrito abandonado
   - Confirmación de acción (ej: "Producto agregado al carrito")

### Fase 13: Stripe Payments Móvil (Día 15-16)

**Dos opciones:**

**Opción A: Payment Sheet (Recomendado)**
```typescript
import { initPaymentSheet, presentPaymentSheet } from '@stripe/stripe-react-native';

// 1. Backend: POST /api/stripe/payment-sheet → devuelve paymentIntent, ephemeralKey, customer
// 2. Frontend:
await initPaymentSheet({
  paymentIntentClientSecret: paymentIntent,
  customerId: customer,
  customerEphemeralKeySecret: ephemeralKey,
  merchantDisplayName: "Nha Kinhon",
});
const { error } = await presentPaymentSheet();
```

**Opción B: Checkout Session en WebView**
- Redirigir a WebView con URL de Stripe Checkout Session
- Después de confirm(), Stripe redirige a return_url
- App intercepta el redirect (deep link)
- Menos integración nativa, más parecido a la web actual

**Decisión:** Payment Sheet es más nativo, mejor UX en móvil. Implementaremos Opción A.

**Requisitos backend:**
- Nuevo endpoint: `POST /api/stripe/payment-sheet`
  - Crea PaymentIntent
  - Crea Customer efímero
  - Devuelve clientSecret, ephemeralKey, customer

### Fase 14: Testing + Emulador (Día 16-17)

**Emulador Android:**
```bash
# Requisitos previos:
# 1. Android Studio instalado
# 2. SDK Android 34+
# 3. Emulador configurado (Pixel 8, API 34)

# Ejecutar en emulador:
npx expo start --android

# O con EAS Build para APK:
eas build --platform android --profile preview
```

**Testing:**
- Jest + React Native Testing Library
- Tests de hooks (TanStack Query)
- Tests de componentes
- Tests de integración de flujo (auth → home → checkout)

**Pruebas manuales en emulador:**
- [ ] Landing → Register
- [ ] Login → Home
- [ ] Home → Categorías → Búsqueda
- [ ] Search → Productos → Agregar carrito
- [ ] Carrito → Checkout → Stripe Payment Sheet
- [ ] Perfil → Pedidos → Timeline
- [ ] Admin → Asignar delivery
- [ ] Delivery login → Aceptar pedido → Actualizar estado
- [ ] Notificaciones push
- [ ] Mapa con mercados

### Fase 15: Build + Publicación (Día 17-18)

**EAS Build:**
```bash
# Instalar EAS CLI
npm install -g eas-cli
eas login

# Configurar build
eas build:configure

# Build Android APK para testing
eas build --platform android --profile preview

# Build Android AAB para Play Store
eas build --platform android --profile production
```

**Play Store (opcional, futura fase):**
1. Crear cuenta Google Play Developer ($25)
2. Subir AAB a Play Console
3. Configurar store listing
4. Revisión y publicación

## Decisión: Stripe Móvil

Para la app Android usaremos **Stripe Payment Sheet** (no WebView con Checkout Session). Razones:

1. UX más nativa: el formulario de pago se ve como parte de la app, no como un redirect
2. Soporte para Google Pay
3. Manejo de errores más fluido
4. Mejor tasa de conversión en móvil

**Nuevo endpoint necesario en backend:**

```javascript
// POST /api/stripe/payment-sheet
async function createPaymentSheet(req, res) {
  const { amount, currency = "xof" } = req.body;
  const userId = req.userId;

  // Crear customer efímero (o reusar existente)
  const customer = await stripe.customers.create({
    metadata: { userId },
  });

  // Crear PaymentIntent
  const paymentIntent = await stripe.paymentIntents.create({
    amount, // en centavos (XOF = zero-decimal)
    currency,
    customer: customer.id,
    automatic_payment_methods: { enabled: true },
  });

  // Generar ephemeral key
  const ephemeralKey = await stripe.ephemeralKeys.create(
    { customer: customer.id },
    { apiVersion: "2025-02-24.acacia" }
  );

  res.json({
    paymentIntent: paymentIntent.client_secret,
    ephemeralKey: ephemeralKey.secret,
    customer: customer.id,
  });
}
```

## Migración de Hooks (Web → Mobile)

Los hooks de TanStack Query de la web se migran casi 1:1:

| Web (`src/hooks/`)        | Mobile (`src/hooks/`)        | Cambios              |
| ------------------------- | ---------------------------- | -------------------- |
| `useCategories.js`        | `useCategories.ts`           | Tipado TypeScript    |
| `useProducts.js`          | `useProducts.ts`             | Tipado TypeScript    |
| `useMarkets.js`           | `useMarkets.ts`              | Tipado TypeScript    |
| `useOrders.js`            | `useOrders.ts`               | Tipado TypeScript    |
| `useCart.js`              | `useCart.ts`                 | Reemplazar Context   |
| `useAuth.js`              | `useAuth.ts`                 | SecureStore vs nada  |
| `useContacts.js`          | `useContacts.ts`             | Tipado TypeScript    |
| `useSearch.js`            | `useSearch.ts`               | Tipado TypeScript    |
| `useNotifications.js`     | `useNotifications.ts`        | FCM + polling        |

## Dependencias Expo

```json
{
  "dependencies": {
    "expo": "~53.0.0",
    "expo-router": "~5.0.0",
    "expo-status-bar": "~3.0.0",
    "expo-constants": "~17.0.0",
    "expo-linking": "~7.0.0",
    "expo-secure-store": "~14.0.0",
    "expo-font": "~13.0.0",
    "expo-notifications": "~0.30.0",
    "expo-device": "~7.0.0",
    "expo-location": "~18.0.0",
    "@tanstack/react-query": "^5.101.0",
    "@stripe/stripe-react-native": "~0.42.0",
    "axios": "^1.7.0",
    "react-native-maps": "~1.20.0",
    "react-native-safe-area-context": "~5.3.0",
    "react-native-screens": "~4.10.0",
    "@react-native-async-storage/async-storage": "~2.1.0",
    "@expo/vector-icons": "~14.0.0",
    "@expo/ngrok": "~4.1.0",
    "firebase": "^11.0.0"
  }
}
```

## Prerrequisitos del Emulador

```bash
# 1. Android Studio (instalar desde https://developer.android.com/studio)
# 2. SDK Platform 34+
# 3. Virtual device: Pixel 8 o similar con API 34

# Verificar emuladores disponibles:
emulator -list-avds

# Iniciar emulador:
emulator -avd Pixel_8_API_34

# Ejecutar app:
cd nha-kinhon-mobile
npx expo start --android
```

## Resumen de Fases y Tiempo Estimado

| Fase | Descripción                    | Días |
| ---- | ------------------------------ | ---- |
| 0    | Setup del proyecto             | 1    |
| 1    | Design System                  | 1    |
| 2    | Onboarding + Landing           | 1    |
| 3    | Auth Flow                      | 1    |
| 4    | Home + Tabs                    | 1-2  |
| 5    | Búsqueda                       | 1-2  |
| 6    | Carrito + Checkout             | 2-3  |
| 7    | Pedidos + Timeline             | 2    |
| 8    | Perfil + Contactos             | 1-2  |
| 9    | Admin Panel                    | 2-3  |
| 10   | Delivery Dashboard             | 2    |
| 11   | Mapas                          | 1-2  |
| 12   | Notificaciones Push            | 2    |
| 13   | Stripe Payments Móvil          | 1-2  |
| 14   | Testing + Emulador             | 2    |
| 15   | Build + Publicación            | 1-2  |
|      | **Total estimado**             | **22-30 días** |

## Preguntas Pendientes

1. **Google Maps API Key**: `react-native-maps` en Android requiere API Key de Google Maps. ¿Tienes cuenta de Google Cloud con facturación? (tiene $200/mes gratis)
2. **Icono de la app**: ¿Quieres mantener el mismo logo/texto de Nha Kinhon o diseñar uno nuevo específico para Android?
3. **Stripe Payment Sheet**: Necesitamos añadir el endpoint `POST /api/stripe/payment-sheet` al backend. ¿Prefieres que lo añada ahora al backend existente o cuando empecemos la Fase 13?
4. **Expo EAS**: EAS Build requiere cuenta de Expo (gratis). ¿Tienes cuenta o creamos una?
5. **Google Play Store**: ¿Quieres publicar en Play Store al final o solo APK para testing?
6. **Sustituto de SF Pro**: ¿Inter como fuente open-source está bien, o prefieres comprar licencia de SF Pro?

¿Confirmas que comienzo con la Fase 0 (setup del proyecto Expo)?
