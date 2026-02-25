# 🚀 Supabase Setup - Quick Start Guide

## ✅ Estado Actual

Has completado:
- ✅ Proyecto Supabase creado: https://htkzpktnaladabovakwc.supabase.co
- ✅ Credenciales anon key obtenidas
- ✅ login.html actualizado con credenciales reales

## 📋 Próximos Pasos Inmediatos

### Paso 1: Ejecutar Schema SQL en Supabase (5 minutos)

**IMPORTANTE:** Debes crear las tablas de la base de datos antes de poder registrar usuarios.

1. Ve a tu proyecto Supabase: https://supabase.com/dashboard/project/htkzpktnaladabovakwc

2. En el menú lateral → Click en **"SQL Editor"**

3. Click en el botón verde **"+ New query"**

4. Abre el archivo `supabase-schema.sql` de este proyecto

5. Copia TODO el contenido del archivo (es largo, ~378 líneas)

6. Pégalo en el editor SQL de Supabase

7. Click en el botón verde **"Run"** (abajo a la derecha)

8. Verifica que aparezca: **"Success. No rows returned"**

9. ✅ Si ves "Success", las tablas fueron creadas correctamente

**Qué hace este script:**
- Crea tabla `user_profiles` (perfiles de usuarios)
- Crea tabla `social_accounts` (cuentas de redes sociales conectadas)
- Crea tabla `social_metrics` (métricas diarias por cuenta)
- Crea tabla `post_performance` (rendimiento de posts individuales)
- Crea tabla `campaigns` (campañas de marketing)
- Configura Row Level Security (RLS) para proteger datos
- Crea funciones auxiliares para cálculos

### Paso 2: Obtener Service Role Key

**IMPORTANTE:** Esta clave es SOLO para backend (Netlify Functions). NUNCA la expongas en frontend.

1. En Supabase dashboard → **Settings** → **API**

2. En la sección **"Project API keys"** busca:
   - `service_role` key (NO la anon key que ya tenemos)

3. Click en "Reveal" o el ícono de ojo para mostrarla

4. Copia la clave completa (empieza con `eyJhbGci...`)

5. Pégala en el archivo `.env` que creé en la línea que dice:
   ```
   SUPABASE_SERVICE_KEY=PASTE_SERVICE_ROLE_KEY_HERE
   ```

6. Guarda el archivo `.env`

### Paso 3: Verificar que Supabase Auth está habilitado

1. En Supabase dashboard → **Authentication** → **Providers**

2. Verifica que **Email** esté habilitado (toggle verde)

3. Si quieres habilitar OAuth providers (opcional por ahora):
   - Google
   - Facebook
   - Apple
   - Microsoft

4. Por ahora, solo necesitamos **Email** activo

## 🧪 Probar Autenticación

Después de ejecutar el schema SQL:

1. Abre `login.html` en tu navegador (local)

2. Ve a la pestaña **"SIGN UP"**

3. Completa el formulario:
   - Full Name: Tu Nombre
   - Email: test@pvb.com
   - Password: minimo8chars
   - Confirm Password: minimo8chars
   - ✅ Acepta términos

4. Click **"CREATE ACCOUNT"**

5. Si todo está bien:
   - Verás "Account created successfully!"
   - Te redirigirá al dashboard (puede fallar por ahora, es normal)

6. Verifica en Supabase:
   - Ve a **Authentication** → **Users**
   - Deberías ver tu usuario recién creado

## ❓ Si Algo Sale Mal

### Error: "No rows returned" NO aparece

**Problema:** El schema SQL falló al ejecutarse

**Solución:**
1. Revisa el panel de errores en Supabase SQL Editor
2. Busca líneas rojas con errores
3. Puede ser que las tablas ya existan (intenta eliminarlas primero)
4. O que haya un error de sintaxis (verifica que copiaste TODO el archivo)

### Error al registrar usuario: "relation user_profiles does not exist"

**Problema:** Las tablas no fueron creadas

**Solución:**
1. Ejecuta el schema SQL nuevamente (Paso 1)
2. Verifica que las tablas existen:
   - En Supabase → **Database** → **Tables**
   - Deberías ver: user_profiles, social_accounts, social_metrics, post_performance, campaigns

### Error: "JWT expired" o "Invalid JWT"

**Problema:** Las credenciales en login.html son incorrectas

**Solución:**
1. Ve a Supabase → Settings → API
2. Copia nuevamente el **anon public key**
3. Reemplaza en login.html línea 584

## 📊 Verificar que Todo Funciona

**Checklist:**
- [ ] Schema SQL ejecutado (Success message)
- [ ] Tablas visibles en Supabase Dashboard → Database → Tables
- [ ] Email provider habilitado en Authentication → Providers
- [ ] login.html carga sin errores en la consola (F12)
- [ ] Puedes crear una cuenta de prueba
- [ ] Usuario aparece en Authentication → Users

## 🎯 Siguiente Fase: OAuth con Redes Sociales

Una vez que la autenticación básica funcione:

1. Configurar apps OAuth en:
   - Meta Developers (Instagram + Facebook)
   - LinkedIn Developers
   - TikTok Developers

2. Crear Netlify Functions para manejar callbacks

3. Conectar APIs de métricas reales

Ver el archivo `OAUTH_SETUP_COMPLETE_GUIDE.md` para detalles completos.

---

**Tiempo estimado para estos pasos:** 10-15 minutos

**Estado actual:**
- ✅ Supabase configurado
- ✅ Credenciales en login.html
- ⏳ Esperando: Ejecutar schema SQL
- ⏳ Esperando: Service role key
