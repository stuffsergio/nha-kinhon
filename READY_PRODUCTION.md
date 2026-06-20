# Plan de Despliegue a Producción

Frontend → **Vercel** · Backend → **Render**

---

## 1. Prerrequisitos

- Cuenta en [GitHub](https://github.com)
- Cuenta en [Vercel](https://vercel.com) (login con GitHub)
- Cuenta en [Render](https://render.com) (login con GitHub)
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

## 3. Backend: Render

### 3.1 Crear base de datos PostgreSQL

1. Ir a https://dashboard.render.com → **New** → **PostgreSQL**
2. Configurar:
   - **Name**: `nha-kinhon-db`
   - **Region**: `Frankfurt` (EU) o la más cercana a tu público
   - **Plan**: Free
3. Crear y **anotar la "Internal Database URL"** (se ve asi: `postgresql://user:password@host:5432/db`)

### 3.2 Crear Web Service

1. Dashboard → **New** → **Web Service**
2. Conectar el repo de GitHub (`nha-kinhon`)
3. Configurar:
   - **Name**: `nha-kinhon-api`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**:
     ```
     npm install && npx prisma migrate deploy
     ```
   - **Start Command**:
     ```
     node index.js
     ```
   - **Plan**: Free (elige **Starter** ~$7/mo si no quieres que el servicio duerma tras 15 min de inactividad)

### 3.3 Variables de entorno en Render

En la sección **Environment** del Web Service, añadir:

| Variable                | Valor                            | Notas                               |
| ----------------------- | -------------------------------- | ----------------------------------- |
| `NODE_ENV`              | `production`                     |                                     |
| `DATABASE_URL`          | _(Internal DB URL del paso 3.1)_ | **Importante:** sin comillas        |
| `JWT_SECRET`            | _(string generado abajo)_        |                                     |
| `JWT_ACCESS_EXPIRES`    | `15m`                            |                                     |
| `JWT_REFRESH_EXPIRES`   | `7d`                             |                                     |
| `CLIENT_URL`            | _(se rellena tras crear Vercel)_ | Ej: `https://nha-kinhon.vercel.app` |
| `STRIPE_SECRET_KEY`     | _(opcional)_                     | Cuando actives pagos                |
| `STRIPE_WEBHOOK_SECRET` | _(opcional)_                     |                                     |
| `CLOUDINARY_CLOUD_NAME` | _(opcional)_                     | Cuando actives subida de imágenes   |
| `CLOUDINARY_API_KEY`    | _(opcional)_                     |                                     |
| `CLOUDINARY_API_SECRET` | _(opcional)_                     |                                     |
| `SMTP_HOST`             | _(opcional)_                     | Cuando actives emails               |
| `SMTP_PORT`             | `587`                            |                                     |
| `SMTP_USER`             | _(opcional)_                     |                                     |
| `SMTP_PASS`             | _(opcional)_                     |                                     |

**Generar JWT_SECRET** (ejecutar localmente):

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copia el output y pégalo como valor de `JWT_SECRET`.

### 3.4 Esperar el despliegue inicial

Render tardará 2-5 min en el primer deploy. Verifica que termina con **"Live"** y sin errores en los logs.

Has click en **"Manual Deploy" → "Clear build cache & deploy"** si ves errores de caché.

### 3.5 Verificar health check

```bash
curl https://nha-kinhon-api.onrender.com/api/health
# Respuesta esperada: {"status":"ok","timestamp":"2026-06-20T..."}
```

Si ves `Cannot GET /api/health`, el deploy no está usando la versión actualizada del código.

### 3.6 Ejecutar seed de datos

1. Ir a Render Dashboard → `nha-kinhon-api` → **Shell**
2. Ejecutar:
   ```bash
   node prisma/seed.js
   ```
3. Verificar que se crean: 2 usuarios, 6 mercados, 16 categorías, 48 productos

---

## 4. Frontend: Vercel

### 4.1 Crear `vercel.json` en la raíz del proyecto

Este archivo es necesario para que React Router funcione al recargar rutas directas:

```json
{
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

> **Nota:** Si cambias el `buildCommand` o `outputDirectory` por defecto de Vite, ajusta los valores. Con la configuración actual del `package.json` no hace falta modificarlos.

### 4.2 Importar proyecto en Vercel

1. Ir a https://vercel.com → **Add New** → **Project**
2. Importar el repo `nha-kinhon`
3. Configurar:
   - **Root Directory**: `/` (default)
   - **Framework Preset**: `Vite` (se detecta automáticamente)
   - **Build Command**: se deja vacío (usa el de `vercel.json`)
   - **Output Directory**: se deja vacío (usa el de `vercel.json`)
4. **Environment Variables**:
   - `VITE_API_URL` → `https://nha-kinhon-api.onrender.com/api`
5. Click **Deploy**

### 4.3 Verificar frontend

Vercel asigna un dominio tipo `nha-kinhon.vercel.app`. Ábrelo y verifica:

- Se ve la página de inicio (home)
- Navegar a `/login` → se ve el formulario
- Navegar a `/mapa` → carga el mapa
- **Probar recarga directa:** estando en `/mapa`, recarga F5. Si ves un 404 de Vercel, el `vercel.json` no se está aplicando correctamente.

---

## 5. Ajustar CORS en Render

Vercel asigna un dominio automático (ej: `nha-kinhon.vercel.app`).

1. Ir a Render → Dashboard → `nha-kinhon-api` → **Environment**
2. Editar `CLIENT_URL` → `https://nha-kinhon.vercel.app` (el dominio real de tu proyecto en Vercel)
3. Guardar → Render redeploy automáticamente

---

## 6. Post-despliegue: verificación completa

### 6.1 Backend

```bash
curl https://nha-kinhon-api.onrender.com/api/health
curl https://nha-kinhon-api.onrender.com/api/markets
curl https://nha-kinhon-api.onrender.com/api/categories
```

### 6.2 Frontend (desde el navegador)

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

### 6.3 Verificar flujo de autenticación

1. Abrir DevTools → **Application** → **Local Storage**
2. Después de login deben existir: `accessToken` y `refreshToken`
3. Recargar página → debe seguir existiendo al menos el `accessToken` (se refresca automáticamente si expiró)
4. Si se borran los tokens manualmente y se recarga → la página debe mostrar el estado "no logueado"

---

## 7. Dominio personalizado (opcional)

### Vercel

1. Project → **Settings** → **Domains**
2. Añadir tu dominio (ej: `nhakinhon.com`)
3. Seguir instrucciones de configuración DNS (registro CNAME apuntando a `cname.vercel-dns.com`)

### Render

1. Dashboard → `nha-kinhon-api` → **Settings** → **Custom Domain**
2. Añadir dominio (ej: `api.nhakinhon.com`)
3. Configurar registro CNAME en tu DNS

### Actualizar CORS

Si usas dominio personalizado:

1. Render → Environment → `CLIENT_URL` → `https://nhakinhon.com` (sin slash final)
2. Vercel → Environment → `VITE_API_URL` → `https://api.nhakinhon.com/api`
3. Redeploy ambos servicios

---

## 8. Redeploy después de cambios

### Frontend (Vercel)

Cada push a `main` dispara deploy automático. También puedes hacerlo manual:

```
Vercel Dashboard → Project → Deploy → Deploy Hooks → crear hook y invocar con curl
```

### Backend (Render)

Cada push a `main` dispara deploy automático. Manual:

```
Render Dashboard → nha-kinhon-api → Manual Deploy → Deploy latest commit
```

Si hiciste cambios en el esquema de Prisma:

1. Ejecutar `npx prisma migrate dev` localmente (crea nueva migración)
2. Commitear y pushear la migración
3. Render ejecutará `npx prisma migrate deploy` en el build

---

## 9. Rollback

### Vercel

Dashboard → Project → **Deployments** →找到 la última versión estable → **···** → **Promote to Production**

### Render

Dashboard → `nha-kinhon-api` → **Manual Deploy** → **Deploy existing image / Deploy prior commit**

---

## 10. Solución de problemas comunes

| Problema                                                  | Causa                                                   | Solución                                                                                 |
| --------------------------------------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `401 Unauthorized` tras login exitoso                     | `JWT_SECRET` no coincide entre login y verificación     | Verificar que `JWT_SECRET` en Render no cambió                                           |
| `CORS error` en consola del navegador                     | `CLIENT_URL` no coincide con el dominio de Vercel       | Actualizar env var en Render y redeploy                                                  |
| Base de datos no responde (500 en cualquier endpoint)     | `DATABASE_URL` incorrecta o base no accesible           | Verificar Internal URL en Render PostgreSQL                                              |
| `PrismaClientInitializationError` en logs de Render       | Migraciones no aplicadas                                | Build command debe ejecutar `prisma migrate deploy`                                      |
| Frontend muestra 404 en rutas directas                    | Faltan rewrites en `vercel.json`                        | Asegurar que el archivo existe con la config correcta                                    |
| Login no persiste al recargar                             | Refresh token no renovado o no se envía correctamente   | Verificar `localStorage` tiene ambos tokens después de login                             |
| Error `Missing required environment variable: JWT_SECRET` | `JWT_SECRET` no configurado en Render                   | Añadirlo en Environment vars y redeploy                                                  |
| Error `Cannot find module '@prisma/client'`               | `postinstall` no se ejecutó                             | Build command debe incluir `npx prisma generate`                                         |
| Seed da error de conexión                                 | Seed ejecutado contra base local en vez de producción   | Ejecutar seed desde el Shell de Render                                                   |
| El servicio en Render se duerme (Free plan)               | El Free plan de Render duerme tras 15 min sin actividad | Usar Starter ($7/mo) o usar [UptimeRobot](https://uptimerobot.com) para ping cada 10 min |

---

## 11. Costos estimados

| Servicio           | Plan                        | Costo/mes  |
| ------------------ | --------------------------- | ---------- |
| Render Web Service | Free (con sleeps)           | $0         |
| Render PostgreSQL  | Free (1GB, expira 90 días)  | $0         |
| Vercel             | Free (100GB ancho de banda) | $0         |
| **Total MVP**      |                             | **$0/mes** |

Para evitar sleeps y tener mejor rendimiento:

| Servicio             | Plan                            | Costo/mes       |
| -------------------- | ------------------------------- | --------------- |
| Render Web Service   | Starter ($7, sin sleeps, 512MB) | $7              |
| Render PostgreSQL    | Starter ($7, 1GB)               | $7              |
| Vercel               | Pro ($20, opcional)             | $0-20           |
| **Total producción** |                                 | **~$14-34/mes** |

---

## 12. Seguridad

- [ ] `JWT_SECRET` generado con `crypto.randomBytes(32)` — **nunca** usar el default
- [ ] `.env` en `.gitignore` — confirmar que no se subió al repo
- [ ] Stripe keys en modo `sk_live_*` solo en producción, `sk_test_*` en desarrollo
- [ ] CORS limitado a `CLIENT_URL` — no usar `*` en producción
- [ ] Base de datos solo accesible desde la red interna de Render (no pública)

---

## Checklist final de pre-lanzamiento

- [ ] Backend: health check responde 200
- [ ] Backend: seed ejecutado con datos de prueba
- [ ] Frontend: build exitoso sin errores
- [ ] Frontend: recarga en ruta anidada no da 404
- [ ] Autenticación: login funciona contra Render
- [ ] Autenticación: registro funciona
- [ ] Autenticación: sesión persiste al recargar
- [ ] CORS: frontend puede llamar al backend sin errores
- [ ] Git: `.env` no está en el repo, `dist/` está en `.gitignore`
- [ ] Git: `vercel.json` está commiteado
- [ ] Git: `.node-version` está commiteado
