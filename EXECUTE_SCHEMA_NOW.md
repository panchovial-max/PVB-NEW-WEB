# ⚡ EJECUTAR SCHEMA SQL AHORA - 5 Minutos

## 🎯 Objetivo

Crear las tablas de la base de datos en Supabase para que el sistema de autenticación funcione.

---

## 📋 Pasos Exactos (Sigue en Orden)

### Paso 1: Abrir Supabase SQL Editor

1. Click en este link (se abrirá en nueva pestaña):
   👉 https://supabase.com/dashboard/project/htkzpktnaladabovakwc/sql/new

2. Deberías ver el **SQL Editor** de Supabase

### Paso 2: Copiar el Schema SQL

1. En VSCode, tienes abierto el archivo `supabase-schema.sql`

2. **Selecciona TODO el contenido** del archivo:
   - Mac: `Cmd + A`
   - Windows: `Ctrl + A`

3. **Copia** el contenido:
   - Mac: `Cmd + C`
   - Windows: `Ctrl + C`

### Paso 3: Pegar en Supabase

1. En el **SQL Editor** de Supabase, click en el área de texto grande (editor)

2. **Pega** el contenido copiado:
   - Mac: `Cmd + V`
   - Windows: `Ctrl + V`

3. Deberías ver ~378 líneas de código SQL

### Paso 4: Ejecutar el Script

1. En la parte inferior derecha del SQL Editor, click en el botón verde **"Run"**

2. Espera ~5-10 segundos

3. ✅ **Verifica que aparezca el mensaje:**
   ```
   Success. No rows returned
   ```

4. ✅ Si ves "Success", ¡todo funcionó correctamente!

### Paso 5: Verificar que las Tablas se Crearon

1. En el menú lateral de Supabase → Click en **"Database"**

2. En la parte superior → Click en **"Tables"**

3. Deberías ver **5 tablas nuevas**:
   - ✅ `user_profiles`
   - ✅ `social_accounts`
   - ✅ `social_metrics`
   - ✅ `post_performance`
   - ✅ `campaigns`

4. Si ves las 5 tablas, ¡perfecto! Las tablas fueron creadas exitosamente.

---

## 🆘 Si Algo Sale Mal

### Error: "relation already exists"

**Significado:** Las tablas ya existen (esto es normal si ejecutaste el script antes)

**Solución:**
- Puedes ignorar este error
- O si quieres empezar limpio:
  1. Ve a Database → Tables
  2. Elimina las tablas existentes (user_profiles, social_accounts, etc.)
  3. Re-ejecuta el script

### Error: "syntax error at or near..."

**Significado:** No se copió todo el archivo completo

**Solución:**
1. Asegúrate de copiar TODO el archivo (Cmd/Ctrl + A)
2. El script debe empezar con: `-- PVB Estudio Creativo`
3. Y terminar con: `*/` (al final del archivo)
4. Intenta de nuevo

### Error: "permission denied for schema public"

**Significado:** Problema de permisos (muy raro)

**Solución:**
1. Verifica que estás en tu proyecto correcto: `htkzpktnaladabovakwc`
2. Cierra sesión y vuelve a entrar a Supabase
3. Intenta de nuevo

---

## ✅ Después de Ejecutar el Schema

Una vez que veas "Success. No rows returned":

1. ✅ Las tablas están creadas
2. ✅ Row Level Security (RLS) está configurada
3. ✅ Los triggers están activos
4. ✅ Las políticas de seguridad están aplicadas

**Próximo paso:**
- Obtener el **service_role key** de Supabase
- Completar el archivo `.env` con todas las credenciales

---

## 📞 Necesitas Ayuda?

Si tienes algún error que no aparece aquí, cópiame:
1. El mensaje de error completo
2. Una screenshot del SQL Editor
3. Te ayudaré a resolverlo inmediatamente

---

## 🎉 ¿Ya Ejecutaste el Schema?

Confirma conmigo y te daré los siguientes pasos para:
1. Obtener el service_role key
2. Configurar las apps OAuth de Instagram, LinkedIn, TikTok
3. Probar el registro de usuarios

**¡Estás a 5 minutos de tener la base de datos lista!** 🚀
