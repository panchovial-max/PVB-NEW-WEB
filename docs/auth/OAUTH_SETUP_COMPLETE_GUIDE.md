# 🔐 Guía Completa de Configuración OAuth - PVB Portal de Cliente

Esta guía te llevará paso a paso para configurar autenticación OAuth con todas las plataformas de redes sociales.

---

## 📋 Orden de Implementación Recomendado

1. **Supabase** (15 min) - Autenticación base y base de datos
2. **Meta/Facebook** (30 min) - Instagram + Facebook Business
3. **Google** (20 min) - YouTube Analytics (opcional pero recomendado)
4. **LinkedIn** (20 min) - LinkedIn Company Pages
5. **TikTok** (25 min) - TikTok Business

**Tiempo total estimado:** 2 horas

---

## 1️⃣ SUPABASE - Autenticación y Base de Datos

### Paso 1.1: Crear Proyecto Supabase

1. Ve a https://supabase.com y crea cuenta
2. Click en "New Project"
3. Completa:
   - **Name:** `pvb-client-portal`
   - **Database Password:** (genera uno fuerte y guárdalo)
   - **Region:** South America (São Paulo) - más cercano a Chile
4. Click "Create new project"
5. Espera 2-3 minutos mientras se crea

### Paso 1.2: Ejecutar el Schema SQL

1. En Supabase dashboard → **SQL Editor**
2. Click "New query"
3. Copia TODO el contenido del archivo `supabase-schema.sql`
4. Pégalo en el editor
5. Click "Run" (botón verde abajo a la derecha)
6. Verifica que diga "Success. No rows returned"

### Paso 1.3: Obtener Credenciales

1. Ve a **Settings** → **API**
2. Copia y guarda:
   ```
   Project URL: https://xxxxx.supabase.co
   anon public key: eyJhbGci...
   service_role key: eyJhbGci... (NUNCA exponer en frontend)
   ```

### Paso 1.4: Configurar Variables de Entorno

Crea archivo `.env` en la raíz del proyecto:

```env
# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_KEY=eyJhbGci... # Solo para backend

# Base URL (cambiará cuando despliegues a Netlify)
BASE_URL=http://localhost:8888

# Callback URLs (actualizarás después del deploy)
OAUTH_CALLBACK_BASE=http://localhost:8888/api/oauth
```

---

## 2️⃣ META (Instagram + Facebook Business)

Meta te permite acceder a Instagram Business y Facebook Pages con un solo OAuth.

### Paso 2.1: Crear Meta App

1. Ve a https://developers.facebook.com
2. Click "My Apps" → "Create App"
3. Selecciona **"Business"** como tipo de app
4. Completa:
   - **App Name:** `PVB Client Portal`
   - **App Contact Email:** tu@email.com
5. Click "Create App"

### Paso 2.2: Configurar Instagram Basic Display (para acceso a Instagram)

1. En tu app dashboard → **Add Product**
2. Busca "Instagram" → **Instagram Basic Display** → "Set Up"
3. En "Basic Display" → Click **"Create New App"**
4. App Name: `PVB Client Portal Instagram`
5. Click "Create App"

### Paso 2.3: Configurar OAuth Redirect URIs

1. En "Instagram Basic Display" → **Basic Display** settings
2. En "Valid OAuth Redirect URIs" agrega:
   ```
   http://localhost:8888/api/oauth/instagram/callback
   https://www.panchovial.com/api/oauth/instagram/callback
   ```
3. En "Deauthorize Callback URL":
   ```
   https://www.panchovial.com/api/oauth/instagram/deauthorize
   ```
4. En "Data Deletion Request URL":
   ```
   https://www.panchovial.com/api/oauth/instagram/delete
   ```
5. Click "Save Changes"

### Paso 2.4: Obtener Credenciales Instagram

1. En "Basic Display" → ve a la sección **"App Details"**
2. Copia y guarda:
   ```
   Instagram App ID: 123456789
   Instagram App Secret: abc123def456
   ```

### Paso 2.5: Configurar Facebook Login (para Facebook Pages)

1. Vuelve al dashboard principal de tu app
2. **Add Product** → **Facebook Login** → "Set Up"
3. En "Facebook Login" → **Settings**
4. En "Valid OAuth Redirect URIs" agrega:
   ```
   http://localhost:8888/api/oauth/facebook/callback
   https://www.panchovial.com/api/oauth/facebook/callback
   ```
5. Click "Save Changes"

### Paso 2.6: Agregar Permisos (Permissions)

1. En el dashboard de tu app → **App Review** → **Permissions and Features**
2. Solicita los siguientes permisos (algunos requieren revisión de Meta):

**Para Instagram:**
- `instagram_basic` - Acceso básico
- `instagram_manage_insights` - Métricas y estadísticas

**Para Facebook:**
- `pages_show_list` - Listar páginas
- `pages_read_engagement` - Leer engagement de páginas
- `pages_read_user_content` - Leer contenido
- `read_insights` - Acceso a métricas

3. Click **"Add"** en cada uno
4. Algunos requieren justificación → escribe:
   ```
   "Esta app permite a nuestros clientes ver las métricas de sus cuentas de redes sociales
   en un dashboard personalizado. Solo accedemos a métricas públicas de cuentas que
   ellos mismos autorizan."
   ```

### Paso 2.7: Cambiar a Modo Live

1. Cuando estés listo para producción
2. Toggle "App Mode" de **"Development"** a **"Live"**
3. Completa el checklist de Meta (Policy URLs, etc.)

### Paso 2.8: Agregar a Variables de Entorno

Actualiza tu `.env`:

```env
# Meta/Facebook OAuth
META_APP_ID=tu-app-id
META_APP_SECRET=tu-app-secret
INSTAGRAM_APP_ID=tu-instagram-app-id
INSTAGRAM_APP_SECRET=tu-instagram-app-secret
```

---

## 3️⃣ LINKEDIN (Para LinkedIn Company Pages)

### Paso 3.1: Crear LinkedIn App

1. Ve a https://www.linkedin.com/developers/apps
2. Click **"Create app"**
3. Completa:
   - **App name:** `PVB Client Portal`
   - **LinkedIn Page:** (selecciona tu página de empresa o crea una)
   - **App logo:** Sube el logo de PVB
4. Acepta términos y click **"Create app"**

### Paso 3.2: Configurar OAuth 2.0

1. En tu app → Tab **"Auth"**
2. En **"Redirect URLs"** agrega:
   ```
   http://localhost:8888/api/oauth/linkedin/callback
   https://www.panchovial.com/api/oauth/linkedin/callback
   ```
3. Click **"Update"**

### Paso 3.3: Solicitar Permisos (Products)

1. En tu app → Tab **"Products"**
2. Solicita:
   - **Marketing Developer Platform** (para métricas de empresa)
   - **Sign In with LinkedIn** (para autenticación)
3. Click **"Request access"** en cada uno
4. Completa formulario de justificación si es necesario

### Paso 3.4: Obtener Credenciales

1. En tab **"Auth"**
2. Copia:
   ```
   Client ID: 78abc123def
   Client Secret: XyZ789AbC
   ```

### Paso 3.5: Agregar a Variables de Entorno

```env
# LinkedIn OAuth
LINKEDIN_CLIENT_ID=tu-client-id
LINKEDIN_CLIENT_SECRET=tu-client-secret
```

---

## 4️⃣ TIKTOK (Para TikTok Business)

### Paso 4.1: Crear TikTok Developer Account

1. Ve a https://developers.tiktok.com
2. Crea cuenta o login
3. Click **"Manage apps"** → **"Create an app"**

### Paso 4.2: Configurar App

1. Completa:
   - **App name:** `PVB Client Portal`
   - **App category:** Marketing tools
   - **Industry:** Marketing and advertising
2. Click **"Create"**

### Paso 4.3: Agregar Login Kit

1. En tu app dashboard → **"Add products"**
2. Selecciona **"Login Kit"**
3. En **"Redirect URL"** agrega:
   ```
   http://localhost:8888/api/oauth/tiktok/callback
   https://www.panchovial.com/api/oauth/tiktok/callback
   ```

### Paso 4.4: Solicitar Permisos

En **"Scopes"** solicita:
- `user.info.basic` - Info básica
- `video.list` - Listar videos
- `video.insights` - Métricas de videos

### Paso 4.5: Obtener Credenciales

```
Client Key: aw1234567890
Client Secret: 1234567890abcdef
```

### Paso 4.6: Agregar a Variables de Entorno

```env
# TikTok OAuth
TIKTOK_CLIENT_KEY=tu-client-key
TIKTOK_CLIENT_SECRET=tu-client-secret
```

---

## 5️⃣ GOOGLE (YouTube Analytics - Opcional)

### Paso 5.1: Crear Proyecto en Google Cloud

1. Ve a https://console.cloud.google.com
2. Click **"New Project"**
3. Nombre: `PVB Client Portal`
4. Click **"Create"**

### Paso 5.2: Habilitar YouTube Data API

1. En tu proyecto → **"APIs & Services"** → **"Library"**
2. Busca **"YouTube Data API v3"**
3. Click **"Enable"**
4. Busca **"YouTube Analytics API"**
5. Click **"Enable"**

### Paso 5.3: Crear OAuth Credentials

1. **"APIs & Services"** → **"Credentials"**
2. Click **"Create Credentials"** → **"OAuth client ID"**
3. Si es primera vez, configura OAuth consent screen:
   - User Type: **External**
   - App name: `PVB Client Portal`
   - User support email: tu@email.com
   - Authorized domains: `panchovial.com`
4. En "Scopes" agrega:
   - `.../auth/youtube.readonly`
   - `.../auth/yt-analytics.readonly`
5. Vuelve a **"Credentials"** → **"Create Credentials"** → **"OAuth client ID"**
6. Application type: **Web application**
7. Name: `PVB Client Portal Web`
8. Authorized redirect URIs:
   ```
   http://localhost:8888/api/oauth/google/callback
   https://www.panchovial.com/api/oauth/google/callback
   ```
9. Click **"Create"**

### Paso 5.4: Obtener Credenciales

```
Client ID: 123456-abc.apps.googleusercontent.com
Client Secret: GOCSPX-abc123
```

### Paso 5.5: Agregar a Variables de Entorno

```env
# Google/YouTube OAuth
GOOGLE_CLIENT_ID=tu-client-id
GOOGLE_CLIENT_SECRET=tu-client-secret
```

---

## 📝 Archivo .env Completo

Tu archivo `.env` final debería verse así:

```env
# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_KEY=eyJhbGci...

# Base URLs
BASE_URL=http://localhost:8888
OAUTH_CALLBACK_BASE=http://localhost:8888/api/oauth

# Meta/Facebook
META_APP_ID=123456789
META_APP_SECRET=abc123def456
INSTAGRAM_APP_ID=987654321
INSTAGRAM_APP_SECRET=xyz789ghi012

# LinkedIn
LINKEDIN_CLIENT_ID=78abc123def
LINKEDIN_CLIENT_SECRET=XyZ789AbC

# TikTok
TIKTOK_CLIENT_KEY=aw1234567890
TIKTOK_CLIENT_SECRET=1234567890abcdef

# Google/YouTube (opcional)
GOOGLE_CLIENT_ID=123456-abc.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abc123
```

---

## ⚠️ IMPORTANTE: Seguridad

1. **NUNCA commitees el archivo `.env` a Git**
   - Ya está en `.gitignore`
   - Verifica con `git status` antes de hacer commit

2. **Para Netlify:**
   - En Netlify dashboard → **Site settings** → **Build & deploy** → **Environment**
   - Agrega cada variable manualmente
   - Netlify las mantendrá seguras

3. **Tokens de Acceso:**
   - Los tokens OAuth se almacenan encriptados en Supabase
   - NUNCA los expongas en código frontend
   - Solo úsalos en Netlify Functions (backend serverless)

---

## 🎯 Próximos Pasos

Una vez que tengas todas las credenciales:

1. ✅ Configurar Supabase Auth en `login.html`
2. ✅ Crear Netlify Functions para cada OAuth callback
3. ✅ Implementar función de sync de métricas
4. ✅ Conectar `dashboard.html` con APIs reales
5. ✅ Testing completo
6. ✅ Deploy a producción

---

## 📞 Troubleshooting

### Error: "Redirect URI mismatch"
- Verifica que las URLs en cada plataforma sean exactamente:
  - Local: `http://localhost:8888/api/oauth/{platform}/callback`
  - Producción: `https://www.panchovial.com/api/oauth/{platform}/callback`
- **NO incluyas** trailing slash `/` al final

### Error: "App not approved"
- Algunas plataformas requieren revisión manual (Meta, LinkedIn)
- Usa modo Development mientras esperas aprobación
- En Development puedes agregar "test users"

### Error: "Insufficient permissions"
- Verifica que solicitaste TODOS los scopes necesarios
- Algunos requieren explicación detallada del uso

### Token expirado
- Implementa refresh automático
- Usa refresh_token cuando el access_token expire
- TikTok requiere refresh cada 24 horas

---

## ✅ Checklist Final

Antes de continuar con el código, verifica que tienes:

- [ ] Proyecto Supabase creado
- [ ] Schema SQL ejecutado exitosamente
- [ ] Credenciales Supabase copiadas
- [ ] Meta App creada (Instagram + Facebook)
- [ ] LinkedIn App creada
- [ ] TikTok App creada
- [ ] (Opcional) Google Cloud proyecto creado
- [ ] Archivo `.env` completo con todas las credenciales
- [ ] `.env` está en `.gitignore`

**¿Todo listo?** Ahora podemos implementar las Netlify Functions y conectar el frontend. 🚀
