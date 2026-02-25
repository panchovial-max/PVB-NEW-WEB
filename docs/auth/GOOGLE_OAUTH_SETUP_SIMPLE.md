# 🔐 Google OAuth Setup - Guía Simple para Proyectos Personales

**Tiempo estimado:** 10-15 minutos
**Nivel:** Principiante - Paso a paso con explicaciones

---

## ✅ Lo Que Necesitas Saber

- **NO necesitas certificaciones** para proyectos personales
- **NO necesitas revisión de Google** si usas modo "Testing"
- **Gratis y sin límites** para desarrollo
- Solo necesitas una cuenta de Google

---

## 📝 Paso 1: Crear Proyecto en Google Cloud

### 1.1 Ir a Google Cloud Console
```
URL: https://console.cloud.google.com
```

### 1.2 Crear Proyecto
1. Click en el selector de proyectos (arriba a la izquierda, al lado del logo de Google Cloud)
2. Click en **"NEW PROJECT"** (arriba a la derecha)
3. Llenar:
   - **Project name:** `PVB Client Portal`
   - **Location:** Dejar "No organization"
4. Click **"CREATE"**
5. Esperar 10-15 segundos mientras se crea
6. Click **"SELECT PROJECT"** cuando aparezca la notificación

---

## 🔧 Paso 2: Configurar OAuth Consent Screen

**¿Qué es esto?** Es la pantalla que verán los usuarios cuando hagan login con Google.

### 2.1 Ir a OAuth Consent Screen
1. En el menú lateral (☰) → **APIs & Services** → **OAuth consent screen**
2. Si no ves el menú, click en las 3 líneas horizontales arriba a la izquierda

### 2.2 Seleccionar Tipo de Usuario
- Seleccionar: **External** (permite cualquier usuario de Google)
- Click **"CREATE"**

### 2.3 Llenar Información de la App

**App information:**
- **App name:** `PVB Client Portal`
- **User support email:** Tu email (seleccionar del dropdown)
- **App logo:** (opcional - puedes dejarlo vacío por ahora)

**App domain (Opcional - puedes dejarlo vacío):**
- Saltar por ahora

**Authorized domains:**
- Agregar: `netlify.app`
- Agregar: `supabase.co`

**Developer contact information:**
- **Email addresses:** Tu email

Click **"SAVE AND CONTINUE"**

### 2.4 Scopes (Permisos)
- Dejar por defecto (no agregar nada)
- Click **"SAVE AND CONTINUE"**

### 2.5 Test Users (IMPORTANTE)
Esta sección es CLAVE para modo Testing:

1. Click **"ADD USERS"**
2. Agregar TU email (el que usarás para probar)
3. Agregar cualquier otro email que quieras que pueda acceder
4. Click **"ADD"**
5. Click **"SAVE AND CONTINUE"**

### 2.6 Summary
- Revisar que todo se vea bien
- Click **"BACK TO DASHBOARD"**

**✅ Listo! Tu OAuth Consent Screen está configurado en modo Testing**

---

## 🔑 Paso 3: Crear OAuth Credentials

### 3.1 Ir a Credentials
1. En el menú lateral → **APIs & Services** → **Credentials**

### 3.2 Crear OAuth Client ID
1. Click **"+ CREATE CREDENTIALS"** (arriba)
2. Seleccionar **"OAuth client ID"**

### 3.3 Configurar Application
1. **Application type:** Seleccionar **"Web application"**
2. **Name:** `PVB Client Portal Web Client`

### 3.4 Authorized JavaScript origins (Opcional)
- Click **"+ ADD URI"**
- Agregar: `https://courageous-valkyrie-15603d.netlify.app`
- Click **"+ ADD URI"**
- Agregar: `https://htkzpktnaladabovakwc.supabase.co`

### 3.5 Authorized redirect URIs (CRÍTICO)
- Click **"+ ADD URI"**
- Agregar: `https://htkzpktnaladabovakwc.supabase.co/auth/v1/callback`

**⚠️ IMPORTANTE:** Esta URL debe ser EXACTA, con `/auth/v1/callback` al final

### 3.6 Crear
1. Click **"CREATE"**
2. Aparecerá un popup con tus credenciales

### 3.7 Copiar Credenciales
**MUY IMPORTANTE - GUARDA ESTOS VALORES:**

```
Client ID: [algo como] 123456789-abc123.apps.googleusercontent.com
Client Secret: [algo como] GOCSPX-abc123xyz789
```

Puedes:
- Copiarlos a un archivo de texto temporal
- Tomar screenshot
- Descargar el JSON (botón "DOWNLOAD JSON")

Click **"OK"** cuando hayas guardado las credenciales

---

## 🔐 Paso 4: Configurar en Supabase

### 4.1 Ir a Supabase Dashboard
```
URL: https://supabase.com/dashboard/project/htkzpktnaladabovakwc
```

### 4.2 Ir a Authentication Providers
1. En el menú lateral → **Authentication** (ícono de escudo)
2. Click en **Providers**
3. Scroll hasta encontrar **"Google"**

### 4.3 Habilitar Google Provider
1. Click en **"Google"** para expandir
2. Toggle el switch para **Enabled** (debe ponerse azul/verde)

### 4.4 Pegar Credenciales
1. **Client ID (for OAuth):** Pegar el Client ID que copiaste
2. **Client Secret (for OAuth):** Pegar el Client Secret que copiaste
3. **Authorized Client IDs:** Dejar vacío (no es necesario)

### 4.5 Verificar Redirect URL
- Deberías ver algo como:
  ```
  https://htkzpktnaladabovakwc.supabase.co/auth/v1/callback
  ```
- Esta es la URL que agregaste en Google Cloud

### 4.6 Guardar
- Click **"Save"** (abajo a la derecha)
- Debe aparecer mensaje de éxito

**✅ Configuración de Supabase completada!**

---

## 🧪 Paso 5: Testing

### 5.1 Ir a Tu Sitio
```
URL: https://courageous-valkyrie-15603d.netlify.app/login.html
```

### 5.2 Intentar Login con Google
1. Click en el botón **"Sign in with Google"** (el primero con el logo de colores)
2. Deberías ver la pantalla de Google pidiendo seleccionar cuenta

### 5.3 Posibles Escenarios

**Escenario A: Funciona Perfecto ✅**
- Seleccionas tu cuenta
- Aparece pantalla "PVB Client Portal wants to access..."
- Click "Continue"
- Redirige automáticamente al dashboard
- ¡Éxito!

**Escenario B: "Esta app no está verificada" (Normal) ⚠️**
- Aparece advertencia en amarillo
- Click en **"Advanced"** (pequeño link abajo)
- Click **"Go to PVB Client Portal (unsafe)"**
- Esto es NORMAL en modo Testing - no es peligroso para tu propia app
- Continúa con autorización
- Redirige al dashboard

**Escenario C: "Access blocked" o "No tienes acceso" ❌**
- Significa que el email que usaste NO está en la lista de Test Users
- Solución:
  1. Volver a Google Cloud Console
  2. OAuth consent screen → Test users
  3. Agregar el email que estás usando
  4. Guardar
  5. Reintentar (puede tomar 1-2 minutos en aplicarse)

---

## 🔍 Troubleshooting

### Error: "redirect_uri_mismatch"
**Causa:** La URL de redirect en Google no coincide con la de Supabase

**Solución:**
1. Ir a Google Cloud Console → Credentials
2. Click en tu OAuth Client ID
3. Verificar que "Authorized redirect URIs" tenga:
   ```
   https://htkzpktnaladabovakwc.supabase.co/auth/v1/callback
   ```
4. Si falta, agregarla y guardar
5. Esperar 1 minuto y reintentar

### Error: "Access blocked: This app's request is invalid"
**Causa:** OAuth Consent Screen no configurado correctamente

**Solución:**
1. Ir a OAuth consent screen en Google Cloud
2. Verificar que esté en modo "Testing"
3. Agregar tu email en "Test users"
4. Guardar y reintentar

### El botón no hace nada
**Causa:** JavaScript error o Supabase no inicializado

**Solución:**
1. Abrir consola del navegador (F12)
2. Ver si hay errores en rojo
3. Recargar la página (Ctrl+R o Cmd+R)
4. Verificar que las variables de entorno estén en Netlify

---

## 📊 Modo Testing vs Production

### Modo Testing (Actual)
- ✅ Sin revisión de Google
- ✅ Funciona inmediatamente
- ✅ Hasta 100 test users
- ✅ Perfecto para desarrollo
- ⚠️ Muestra "app no verificada"

### Modo Production (Futuro - Opcional)
- Requiere verificación de Google
- Proceso de revisión: 1-2 semanas
- Sin límite de usuarios
- Sin advertencias de seguridad
- **NO NECESARIO para proyecto personal**

---

## 🎯 Resumen Visual del Flujo

```
Usuario click "Sign in with Google"
         ↓
Redirect a Google Login
         ↓
Usuario selecciona cuenta
         ↓
Google muestra: "PVB Client Portal wants access"
         ↓
Usuario acepta
         ↓
Google redirect a: supabase.co/auth/v1/callback
         ↓
Supabase procesa authentication
         ↓
Redirect a: dashboard.html
         ↓
¡Usuario logueado! ✅
```

---

## ✅ Checklist Final

Antes de probar, verifica que:

- [ ] Proyecto creado en Google Cloud Console
- [ ] OAuth Consent Screen configurado en modo "Testing"
- [ ] Tu email agregado como Test User
- [ ] OAuth Client ID creado (tipo Web Application)
- [ ] Redirect URI agregado: `https://htkzpktnaladabovakwc.supabase.co/auth/v1/callback`
- [ ] Client ID y Secret copiados
- [ ] Google Provider habilitado en Supabase
- [ ] Credenciales pegadas en Supabase
- [ ] Cambios guardados en Supabase

---

## 🆘 Si Te Atascas

No hay problema - es normal que haya confusión la primera vez. Algunos tips:

1. **Lee los mensajes de error:** Google da buenos mensajes de error
2. **Revisa las URLs:** Los errores más comunes son typos en las URLs
3. **Espera 1-2 minutos:** Algunos cambios tardan en aplicarse
4. **Usa modo incógnito:** Para testing limpio sin cookies viejas

---

## 💡 Notas Adicionales

### ¿Cuánto Cuesta?
- **Google OAuth:** 100% GRATIS
- **Supabase:** Gratis hasta 50,000 usuarios activos/mes
- **Netlify:** Gratis hasta 100 GB bandwidth/mes

### ¿Es Seguro?
- ✅ Sí, estás usando los mismos sistemas que usan Facebook, Twitter, etc.
- ✅ Las credenciales nunca se exponen al frontend
- ✅ Supabase maneja toda la seguridad

### ¿Puedo Cambiar Cosas Después?
- ✅ Sí, puedes editar el OAuth Consent Screen cuando quieras
- ✅ Puedes agregar/quitar test users
- ✅ Puedes cambiar el nombre de la app
- ✅ Puedes pasar a modo Production más adelante

---

**¿Listo para empezar?** Sigue los pasos en orden y avísame si te atoras en algún punto. 🚀
