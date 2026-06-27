# Plan de Despliegue a Producción

Frontend → **Vercel** · Backend → **Railway** · Base de datos → **Supabase**

---

## 1. Prerrequisitos

- Cuenta en [GitHub](https://github.com)
- Cuenta en [Vercel](https://vercel.com) (login con GitHub)
- Cuenta en [Railway](https://railway.app) (login con GitHub)
- Cuenta en [Supabase](https://supabase.com) (login con GitHub)
- Node.js 20 instalado localmente
- Git instalado localmente

---

## 2. Subir el proyecto a GitHub

```bash
# Desde la raíz del proyecto
git init
git add .
git commit -m "init: nha-kinhon v1"
gh repo create nha-kinhon --public --push
```

(este paso ya está implementado)
Si no tienes `gh` CLI, créalo manualmente en https://github.com/new y luego:

```bash
git remote add origin https://github.com/tuusuario/nha-kinhon.git
git push -u origin main
```

---

## 3. Base de datos: Supabase

### 3.1 Crear proyecto

1. Ir a https://supabase.com → **Start a project**
2. Configurar:
   - **Organization**: tu organización personal
   - **Name**: `nha-kinhon`
   - **Database Password**: generarlo y **guardarlo**
   - **Region**: `EU West` (la más cercana a Guinea-Bissau)
   - **Pricing Plan**: Free
3. Esperar a que termine la creación (~2 min)

### 3.2 Obtener connection string

1. Ir a **Project Settings** → **Database**
2. En **Connection string**, seleccionar **URI**
3. Copiar la cadena que se ve así:
   ```
   postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres
   ```
4. Añadir `?sslmode=require` al final:
   ```
   postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres?sslmode=require
   ```

### 3.3 Configurar localmente

En `backend/.env`, actualizar `DATABASE_URL` con la cadena del paso anterior.

### 3.4 Ejecutar migraciones y seed

```bash
cd backend
npx prisma migrate deploy
node prisma/seed.js
```

---

## 4. Backend: Railway

### 4.1 Crear Web Service

1. Ir a https://railway.app → **Dashboard** → **New Project**
2. Seleccionar **Deploy from GitHub repo**
3. Elegir el repo `nha-kinhon`
4. Railway detectará automáticamente Node.js
5. Configurar:
   - **Root Directory**: `backend`
   - **Build Command**:
     ```
     npm install && npx prisma generate && npx prisma migrate deploy
     ```
   - **Start Command**:
     ```
     node index.js
     ```

### 4.2 Variables de entorno en Railway

Ir a la pestaña **Variables** del servicio y añadir:

| Variable                | Valor                            | Notas                               |
| ----------------------- | -------------------------------- | ----------------------------------- |
| `NODE_ENV`              | `production`                     |                                     |
| `DATABASE_URL`          | _(cadena de Supabase paso 3.2)_  | Con `?sslmode=require`             |
| `JWT_SECRET`            | _(string generado abajo)_        |                                     |
| `JWT_ACCESS_EXPIRES`    | `15m`                            |                                     |
| `JWT_REFRESH_EXPIRES`   | `7d`                             |                                     |
| `CLIENT_URL`            | _(se rellena tras crear Vercel)_ | Ej: `https://nha-kinhon.vercel.app` |
| `STRIPE_SECRET_KEY`     | _(opcional)_                     | Cuando actives pagos                |
| `STRIPE_WEBHOOK_SECRET` | _(opcional)_                     |                                     |
| `CLIENT_URL`            | `http://localhost:5173`          | Temporal hasta tener Vercel         |

**Generar JWT_SECRET** (ejecutar localmente):

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copia el output y pégalo como valor de `JWT_SECRET`.

### 4.3 Esperar el despliegue inicial

Railway tardará 2-5 min en el primer deploy. Verifica que termina con **"Deployed"** y sin errores en los logs.

Railway asigna un dominio tipo `https://nha-kinhon-api.up.railway.app`.

### 4.4 Verificar health check

```bash
curl https://nha-kinhon-api.up.railway.app/api/health
# Respuesta esperada: {"status":"ok","timestamp":"2026-06-27T..."}
```

### 4.5 Ejecutar seed de datos

Railway no tiene Shell integrado como Render. Para ejecutar el seed:

**Opción A — Railway CLI:**

```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Conectar
railway login

# Ejecutar seed en el entorno de producción
railway run node prisma/seed.js
```

**Opción B — Ejecución local contra Supabase:**

```bash
# Asegurarse que backend/.env tiene la DATABASE_URL de Supabase
cd backend
node prisma/seed.js
```

---

## 5. Frontend: Vercel

### 5.1 El `vercel.json` ya existe

El archivo en la raíz del proyecto ya está configurado:

```json
{
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

### 5.2 Importar proyecto en Vercel

1. Ir a https://vercel.com → **Add New** → **Project**
2. Importar el repo `nha-kinhon`
3. Configurar:
   - **Root Directory**: `/` (default)
   - **Framework Preset**: `Vite` (se detecta automáticamente)
   - **Build Command**: se deja vacío (usa el de `vercel.json`)
   - **Output Directory**: se deja vacío (usa el de `vercel.json`)
4. **Environment Variables**:
   - `VITE_API_URL` → `https://nha-kinhon-api.up.railway.app/api`
5. Click **Deploy**

### 5.3 Verificar frontend

Vercel asigna un dominio tipo `nha-kinhon.vercel.app`. Ábrelo y verifica:

- Se ve la página de inicio (home)
- Navegar a `/login` → se ve el formulario
- Navegar a `/mapa` → carga el mapa
- **Probar recarga directa:** estando en `/mapa`, recarga F5. Si ves un 404 de Vercel, el `vercel.json` no se está aplicando correctamente.

---

## 6. Ajustar CORS

1. Ir a Railway → Dashboard → proyecto → **Variables**
2. Actualizar `CLIENT_URL` → `https://nha-kinhon.vercel.app` (el dominio real de tu proyecto en Vercel)
3. Railway redeploy automáticamente

---

## 7. Post-despliegue: verificación completa

### 7.1 Backend

```bash
curl https://nha-kinhon-api.up.railway.app/api/health
curl https://nha-kinhon-api.up.railway.app/api/markets
curl https://nha-kinhon-api.up.railway.app/api/categories
```

### 7.2 Frontend (desde el navegador)

| Paso | Acción                                     | Resultado esperado                                                   |
| ---- | ------------------------------------------ | -------------------------------------------------------------------- |
| 1    | Abrir `https://nha-kinhon.vercel.app`      | Home cargado con categorías y mercados                               |
| 2    | Click "Iniciar Sesión" en navbar           | Formulario de login                                                  |
| 3    | Login: `admin@nhakinhon.com` / `admin1234` | Redirige a home, navbar muestra nombre                               |
| 4    | Recargar página en home                    | Sesión persiste (navbar sigue mostrando nombre)                      |
| 5    | Click "Registrarse" en navbar              | Formulario de registro                                               |
| 6    | Registrar nuevo usuario                    | Redirige a home, navbar muestra nombre del nuevo usuario             |
| 7    | Cerrar sesión                              | Navbar vuelve a mostrar "Iniciar Sesión" / "Registrarse"             |
| 8    | Navegar a `/buscar`                        | Página de búsqueda funcional                                         |
| 9    | Navegar a `/mapa`                          | Mapa con mercados                                                    |
| 10   | Navegar a `/carrito`                       | Carrito (vacío o con items)                                          |
| 11   | Navegar a `/perfil`                        | Perfil con tabs (dashboard, favoritos, pedidos, contactos, settings) |
| 12   | Recarga directa en `/perfil`               | No debe dar 404                                                      |

### 7.3 Verificar flujo de autenticación

1. Abrir DevTools → **Application** → **Local Storage**
2. Después de login deben existir: `accessToken`
3. Recargar página → la sesión debe persistir (el refresh token está en cookie HttpOnly)
4. Si se borra el accessToken manualmente y se recarga → debe renovarse automáticamente

---

## 8. Stripe Webhook

Para que los pagos funcionen en producción, el webhook de Stripe debe apuntar a Railway:

```bash
stripe listen --forward-to https://nha-kinhon-api.up.railway.app/api/stripe/webhook
```

O configurar el endpoint en el dashboard de Stripe:
1. Ir a https://dashboard.stripe.com/webhooks
2. **Add endpoint**
3. Endpoint URL: `https://nha-kinhon-api.up.railway.app/api/stripe/webhook`
4. Eventos: `checkout.session.completed`, `checkout.session.async_payment_failed`
5. Copiar el **Signing secret** y ponerlo como `STRIPE_WEBHOOK_SECRET` en Railway

---

## 9. Dominio personalizado (opcional)

### Vercel

1. Project → **Settings** → **Domains**
2. Añadir tu dominio (ej: `nhakinhon.com`)
3. Seguir instrucciones de configuración DNS (registro CNAME apuntando a `cname.vercel-dns.com`)

### Railway

1. Dashboard → proyecto → **Settings** → **Domains**
2. Añadir dominio (ej: `api.nhakinhon.com`)
3. Configurar registro CNAME en tu DNS

### Actualizar CORS

1. Railway → Variables → `CLIENT_URL` → `https://nhakinhon.com`
2. Vercel → Variables → `VITE_API_URL` → `https://api.nhakinhon.com/api`
3. Redeploy ambos servicios

---

## 10. Redeploy después de cambios

### Frontend (Vercel)

Cada push a `main` dispara deploy automático.

### Backend (Railway)

Cada push a `main` dispara deploy automático.

Si hiciste cambios en el esquema de Prisma:

1. Ejecutar `npx prisma migrate dev` localmente (crea nueva migración)
2. Commitear y pushear la migración
3. Railway ejecutará `npx prisma migrate deploy` en el build

---

## 11. Rollback

### Vercel

Dashboard → Project → **Deployments** → última versión estable → **···** → **Promote to Production**

### Railway

Dashboard → proyecto → **Deployments** → **Redeploy** (versión anterior)

---

## 12. Solución de problemas comunes

| Problema                                                  | Causa                                                   | Solución                                                                                 |
| --------------------------------------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `401 Unauthorized` tras login exitoso                     | `JWT_SECRET` no coincide entre login y verificación     | Verificar que `JWT_SECRET` en Railway no cambió                                           |
| `CORS error` en consola del navegador                     | `CLIENT_URL` no coincide con el dominio de Vercel       | Actualizar env var en Railway y redeploy                                                  |
| Base de datos no responde (500 en cualquier endpoint)     | `DATABASE_URL` incorrecta o SSL no configurado          | Verificar que tiene `?sslmode=require` al final |
| `PrismaClientInitializationError` en logs de Railway      | Migraciones no aplicadas                                | Build command debe ejecutar `prisma migrate deploy`                                      |
| Frontend muestra 404 en rutas directas                    | Faltan rewrites en `vercel.json`                        | Asegurar que el archivo existe con la config correcta                                    |
| Error `Missing required environment variable: JWT_SECRET` | `JWT_SECRET` no configurado en Railway                   | Añadirlo en Variables y redeploy                                                          |
| Error `Cannot find module '@prisma/client'`               | `postinstall` no se ejecutó                             | Build command debe incluir `npx prisma generate`                                         |
| Seed da error de conexión                                 | Seed ejecutado contra base local en vez de producción   | Ejecutar seed con Railway CLI o localmente con DATABASE_URL de Supabase                  |
| El servicio en Railway se duerme (Free plan)              | Railway tiene límite de horas gratis/mes                | Usar plan Hobby ($5/mes) o Developer ($20/mes)                                            |

---

## 13. Costos estimados

| Servicio           | Plan                        | Costo/mes  |
| ------------------ | --------------------------- | ---------- |
| Railway            | Free ($5 crédito, 500h/mes) | $0         |
| Supabase           | Free (500MB DB)             | $0         |
| Vercel             | Free (100GB ancho de banda) | $0         |
| **Total MVP**      |                             | **$0/mes** |

Para evitar límites y tener mejor rendimiento:

| Servicio             | Plan                            | Costo/mes       |
| -------------------- | ------------------------------- | --------------- |
| Railway              | Hobby ($5, sin sleeps)          | $5              |
| Supabase             | Pro ($25, 8GB DB)               | $25             |
| Vercel               | Pro ($20, opcional)             | $0-20           |
| **Total producción** |                                 | **~$30-50/mes** |

---

## 14. Seguridad

- [ ] `JWT_SECRET` generado con `crypto.randomBytes(32)` — **nunca** usar el default
- [ ] `.env` en `.gitignore` — confirmar que no se subió al repo
- [ ] Stripe keys en modo `sk_live_*` solo en producción, `sk_test_*` en desarrollo
- [ ] CORS limitado a `CLIENT_URL` — no usar `*` en producción
- [ ] Supabase: **Connection Pooling** desactivado para Prisma (usar directo, no pooled)
- [ ] Supabase: SSL obligatorio (`sslmode=require`)

---

## Checklist final de pre-lanzamiento

- [ ] Supabase: proyecto creado con DATABASE_URL anotada
- [ ] Backend: migraciones aplicadas contra Supabase
- [ ] Backend: seed ejecutado contra Supabase
- [ ] Backend: health check responde 200 desde Railway
- [ ] Frontend: build exitoso sin errores
- [ ] Frontend: recarga en ruta anidada no da 404
- [ ] Autenticación: login funciona contra Railway
- [ ] Autenticación: registro funciona
- [ ] Autenticación: sesión persiste al recargar
- [ ] CORS: frontend puede llamar al backend sin errores
- [ ] Git: `.env` no está en el repo, `dist/` está en `.gitignore`
- [ ] Git: `vercel.json` está commiteado
- [ ] Git: `.node-version` está commiteado
