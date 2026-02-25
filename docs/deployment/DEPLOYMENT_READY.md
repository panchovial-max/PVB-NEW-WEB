# 🚀 Deployment a Netlify - PVB Client Portal

**Estado:** Listo para Deploy
**Fecha:** Enero 2026

---

## ✅ Pre-Deployment Checklist

### Backend Completado:
- ✅ Supabase configurado y schema ejecutado
- ✅ Netlify Functions creadas:
  - ✅ `oauth-instagram-initiate.js` y `oauth-instagram-callback.js`
  - ✅ `oauth-linkedin-initiate.js` y `oauth-linkedin-callback.js`
  - ✅ `oauth-tiktok-initiate.js` y `oauth-tiktok-callback.js`
  - ✅ `metrics-get.js` - API para leer métricas
  - ✅ `metrics-sync.js` - API para sync de plataformas
  - ✅ `utils/supabase.js` - Utilidades backend
- ✅ Dashboard integrado con APIs reales
- ✅ package.json con dependencias correctas
- ✅ netlify.toml configurado

### Frontend Completado:
- ✅ Homepage (index.html) con servicios de marketing
- ✅ Login/Signup (login.html) con Supabase Auth
- ✅ Dashboard (dashboard.html) con UI completa
- ✅ Estilos responsive (styles.css, dashboard.css)
- ✅ Scripts (script.js, dashboard.js, calendar.js)

### Configuración:
- ✅ .env configurado localmente (NO se sube a Git)
- ✅ .gitignore correcto
- ✅ Variables de entorno listas para Netlify

---

## 📦 Paso 1: Commit y Push a GitHub

Ejecutar en la terminal:

```bash
cd /Users/franciscovialbrown/Documents/GitHub/PVB-NEW-WEB

# Ver cambios
git status

# Agregar archivos (el .env NO se incluirá por .gitignore)
git add .

# Commit
git commit -m "feat: Complete OAuth backend + Metrics APIs + Dashboard integration

- Add LinkedIn OAuth functions (initiate + callback)
- Add TikTok OAuth functions with PKCE (initiate + callback)
- Add metrics-get API to serve dashboard data
- Add metrics-sync API to fetch from social platforms
- Integrate dashboard.js with real APIs
- Update KPI cards with real metrics
- Add helper functions for formatting numbers and percentages

Ready for deployment to Netlify"

# Push a GitHub
git push origin main
```

---

## 🌐 Paso 2: Deploy a Netlify

### Opción A: Via Netlify UI (Recomendado)

1. Ve a https://app.netlify.com
2. Click **"Add new site"** → **"Import an existing project"**
3. Conecta GitHub → selecciona el repositorio **PVB-NEW-WEB**
4. Configuración del build:
   - **Branch to deploy:** `main`
   - **Build command:** (dejar vacío)
   - **Publish directory:** `.` (punto - raíz del proyecto)
   - **Functions directory:** `netlify/functions`
5. Click **"Deploy site"**
6. Espera 1-2 minutos mientras se despliega

### Opción B: Via Netlify CLI

```bash
# Si no tienes Netlify CLI instalado
npm install -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy --prod
```

---

## 🔐 Paso 3: Configurar Variables de Entorno en Netlify

Una vez desplegado:

1. En Netlify dashboard → tu sitio → **Site settings**
2. Ir a **Environment variables**
3. Click **"Add a variable"** para cada una:

```env
# SUPABASE (REQUERIDO - Funciona inmediatamente)
SUPABASE_URL = https://htkzpktnaladabovakwc.supabase.co
SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0a3pwa3RuYWxhZGFib3Zha3djIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2MjI2ODYsImV4cCI6MjA4NTE5ODY4Nn0.uFjYQ5vesDpscJGaDHW7bQ-PJsNeTtqeeyCl0NZoRUA
SUPABASE_SERVICE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0a3pwa3RuYWxhZGFib3Zha3djIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTYyMjY4NiwiZXhwIjoyMDg1MTk4Njg2fQ.hjmI3dnTmHR0Mp8PCxzHbRqZbDQwdq5xWSg-AITCWfs

# BASE URLS (ACTUALIZAR con tu dominio Netlify)
BASE_URL = https://tu-sitio.netlify.app
OAUTH_CALLBACK_BASE = https://tu-sitio.netlify.app/.netlify/functions

# OAUTH - INSTAGRAM/META (Agregar después de obtenerlas)
INSTAGRAM_APP_ID = (pendiente)
INSTAGRAM_APP_SECRET = (pendiente)
META_APP_ID = (pendiente)
META_APP_SECRET = (pendiente)

# OAUTH - LINKEDIN (Agregar después de obtenerlas)
LINKEDIN_CLIENT_ID = (pendiente)
LINKEDIN_CLIENT_SECRET = (pendiente)

# OAUTH - TIKTOK (Agregar después de obtenerlas)
TIKTOK_CLIENT_KEY = (pendiente)
TIKTOK_CLIENT_SECRET = (pendiente)
```

4. Click **"Save"**
5. **Importante:** Después de agregar variables, hacer un **"Trigger deploy"** para que se apliquen

---

## 🌍 Paso 4: Configurar Dominio Personalizado (panchovial.com)

### 4.1: En Netlify

1. En tu sitio → **Domain management** → **Add domain alias**
2. Agregar: `panchovial.com`
3. Agregar también: `www.panchovial.com`
4. Netlify te mostrará los DNS records necesarios:
   ```
   Type: A
   Name: @
   Value: 75.2.60.5

   Type: CNAME
   Name: www
   Value: tu-sitio.netlify.app
   ```

### 4.2: En GoDaddy (o tu proveedor DNS)

1. Ir a la configuración DNS de panchovial.com
2. Agregar/Editar records:
   - **A Record:** `@` → `75.2.60.5`
   - **CNAME:** `www` → `tu-sitio.netlify.app`
3. Guardar cambios
4. Esperar propagación DNS (30-60 minutos)

### 4.3: SSL/HTTPS Automático

Netlify configurará SSL automáticamente después de que el DNS se propague.

---

## 🧪 Paso 5: Testing Post-Deploy

### 5.1: Testing Inmediato (Sin OAuth)

Probar en: `https://tu-sitio.netlify.app` o `https://www.panchovial.com`

- [ ] **Homepage carga correctamente**
  - URL: https://www.panchovial.com
  - Verificar: 6 servicios, portfolio, WhatsApp widget

- [ ] **Registro de usuario funciona**
  - URL: https://www.panchovial.com/login.html
  - Click "SIGN UP"
  - Crear cuenta de prueba
  - Verificar redirect a dashboard

- [ ] **Login funciona**
  - URL: https://www.panchovial.com/login.html
  - Login con credenciales creadas
  - Verificar sesión persiste

- [ ] **Dashboard carga**
  - URL: https://www.panchovial.com/dashboard.html
  - Debe mostrar nombre del usuario
  - KPI cards vacíos (normal, sin cuentas conectadas)
  - No debe haber errores de consola

- [ ] **Logout funciona**
  - Click botón logout
  - Redirige a login
  - Session limpiada

### 5.2: Testing con OAuth (Después de obtener credenciales)

Una vez que agregues las credenciales OAuth:

1. **Actualizar variables de entorno en Netlify:**
   - Agregar `INSTAGRAM_APP_ID`, `INSTAGRAM_APP_SECRET`, etc.
   - Hacer "Trigger deploy"

2. **Actualizar Redirect URIs en cada plataforma:**
   - Meta: `https://www.panchovial.com/.netlify/functions/oauth-instagram-callback`
   - LinkedIn: `https://www.panchovial.com/.netlify/functions/oauth-linkedin-callback`
   - TikTok: `https://www.panchovial.com/.netlify/functions/oauth-tiktok-callback`

3. **Probar OAuth flows:**
   - Ir a Settings (o crear página de settings)
   - Click "Connect Instagram" / "Connect LinkedIn" / "Connect TikTok"
   - Autorizar app
   - Verificar redirect a dashboard con success message
   - Ver cuenta conectada en dashboard

4. **Probar sync de métricas:**
   - Manualmente: `POST https://www.panchovial.com/.netlify/functions/metrics-sync`
   - O agregar botón "Sync Metrics" en dashboard
   - Verificar que métricas aparecen en KPI cards

---

## 📊 URLs del Sitio en Producción

| Recurso | URL |
|---------|-----|
| **Homepage** | https://www.panchovial.com |
| **Login/Signup** | https://www.panchovial.com/login.html |
| **Dashboard** | https://www.panchovial.com/dashboard.html |
| **Netlify Function - Metrics Get** | https://www.panchovial.com/.netlify/functions/metrics-get |
| **Netlify Function - Metrics Sync** | https://www.panchovial.com/.netlify/functions/metrics-sync |
| **Netlify Function - Instagram OAuth** | https://www.panchovial.com/.netlify/functions/oauth-instagram-initiate |
| **Netlify Function - LinkedIn OAuth** | https://www.panchovial.com/.netlify/functions/oauth-linkedin-initiate |
| **Netlify Function - TikTok OAuth** | https://www.panchovial.com/.netlify/functions/oauth-tiktok-initiate |

---

## ⚠️ Notas Importantes

### 1. Orden de Operaciones Post-Deploy:

```
✅ 1. Deploy a Netlify
✅ 2. Configurar variables de entorno Supabase (funciona inmediatamente)
✅ 3. Testing de Login/Registro/Dashboard vacío
⏳ 4. Obtener credenciales OAuth de Meta, LinkedIn, TikTok
⏳ 5. Agregar credenciales a Netlify environment variables
⏳ 6. Actualizar Redirect URIs en cada plataforma
⏳ 7. Testing completo de OAuth flows
⏳ 8. Testing de métricas
```

### 2. El sitio funcionará INMEDIATAMENTE con:
- ✅ Login/Signup de usuarios
- ✅ Dashboard (vacío pero funcional)
- ✅ Homepage completa
- ✅ Base de datos Supabase

### 3. OAuth se puede agregar DESPUÉS:
- Las credenciales OAuth NO son bloqueantes para el deploy
- Usuarios pueden registrarse y ver el dashboard
- Cuando agregues credenciales OAuth, solo necesitas:
  1. Agregar environment variables en Netlify
  2. Trigger redeploy
  3. No requiere cambios de código

### 4. Seguridad:
- ✅ `.env` NO se commitea a Git (está en .gitignore)
- ✅ Service role key solo en Netlify environment variables
- ✅ Row Level Security activo en Supabase
- ✅ HTTPS automático por Netlify

---

## 🎯 Próximos Pasos Después del Deploy

1. **Obtener credenciales OAuth** (ver `OAUTH_SETUP_COMPLETE_GUIDE.md`)
   - Meta/Instagram (~30 min)
   - LinkedIn (~20 min)
   - TikTok (~25 min)

2. **Agregar botón "Sync Metrics" en dashboard**
   - Para que usuarios puedan actualizar métricas manualmente

3. **Crear página de Settings**
   - Con botones "Connect Instagram", "Connect LinkedIn", etc.
   - Mostrar cuentas conectadas
   - Opción de desconectar cuentas

4. **Implementar cron job para auto-sync**
   - Netlify Scheduled Functions
   - Sync automático cada 24 horas

5. **Agregar gráficos con Chart.js**
   - Ya tienes los datos formateados
   - Solo falta integrar librería de gráficos

---

## 🆘 Troubleshooting

### Error: "Failed to load resource: 404"
- Verificar que las Netlify Functions se desplegaron
- Ver logs en Netlify dashboard → Functions

### Error: "Supabase connection failed"
- Verificar environment variables en Netlify
- Hacer "Trigger deploy" después de agregar variables

### Error: "OAuth redirect mismatch"
- Verificar URLs exactas en cada plataforma OAuth
- Deben terminar en `/oauth-{platform}-callback`
- NO incluir trailing slash `/` al final

### Dashboard carga pero no hay métricas
- Normal si no hay cuentas conectadas
- Conectar al menos una cuenta OAuth
- Hacer sync manual: `POST /.netlify/functions/metrics-sync`

---

## ✅ Checklist Final

Antes de marcar como completo:

- [ ] Código commiteado y pusheado a GitHub
- [ ] Site desplegado en Netlify
- [ ] Variables de entorno Supabase configuradas
- [ ] Homepage carga sin errores
- [ ] Login/Signup funciona
- [ ] Dashboard carga sin errores de consola
- [ ] Logout funciona
- [ ] (Opcional) Dominio panchovial.com configurado
- [ ] (Opcional) SSL/HTTPS activo
- [ ] (Después) Credenciales OAuth agregadas
- [ ] (Después) OAuth flows funcionan
- [ ] (Después) Métricas se muestran en dashboard

---

**¡Listo para Deploy! 🚀**
