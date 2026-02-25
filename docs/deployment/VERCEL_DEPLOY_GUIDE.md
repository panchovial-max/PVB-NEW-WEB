# 🚀 Guía de Deployment en Vercel - Shotlist Agency

## ✅ ¡Tu sitio está listo para deployment!

### 📦 Archivos preparados:
- ✅ `index.html` - Sitio web completo
- ✅ `styles.css` - Estilos y animaciones
- ✅ `script.js` - Interactividad
- ✅ `vercel.json` - Configuración de Vercel
- ✅ `.vercelignore` - Archivos a ignorar
- ✅ `README.md` - Documentación

---

## 🎯 Método 1: Deploy con Vercel CLI (Rápido)

### Paso 1: Instalar Vercel CLI

```bash
npm install -g vercel
```

### Paso 2: Login en Vercel

```bash
vercel login
```

Te pedirá que elijas un método:
- Email
- GitHub
- GitLab
- Bitbucket

### Paso 3: Deploy

Desde el directorio del proyecto:

```bash
cd /Users/franciscovialbrown/Documents/GitHub/cmo_py_
vercel
```

Responde las preguntas:
- **Set up and deploy?** → `Y` (Yes)
- **Which scope?** → Selecciona tu cuenta
- **Link to existing project?** → `N` (No)
- **Project name?** → `shotlist-agency` (o el nombre que prefieras)
- **In which directory is your code located?** → `./` (Enter)

### Paso 4: Deploy a Producción

```bash
vercel --prod
```

---

## 🎯 Método 2: Deploy con GitHub + Vercel (Recomendado)

### Paso 1: Crear repositorio en GitHub

1. Ve a https://github.com/new
2. Nombre del repo: `shotlist-agency`
3. Descripción: "Shotlist Marketing Agency Website"
4. Público o Privado (tu elección)
5. **NO** inicialices con README (ya tienes uno)
6. Click "Create repository"

### Paso 2: Push a GitHub

```bash
# Si no tienes remote configurado
git remote add origin https://github.com/TU_USUARIO/shotlist-agency.git

# Push al repositorio
git push -u origin cmo_
```

### Paso 3: Conectar con Vercel

1. Ve a https://vercel.com
2. Click "Sign Up" o "Login"
3. Elige "Continue with GitHub"
4. Autoriza Vercel
5. Click "Import Project"
6. Selecciona tu repositorio `shotlist-agency`
7. Click "Import"

### Paso 4: Configurar y Deploy

- **Project Name**: `shotlist-agency`
- **Framework Preset**: `Other`
- **Root Directory**: `./`
- **Build Command**: (dejar vacío)
- **Output Directory**: (dejar vacío)

Click "Deploy" y espera ~30 segundos

---

## 🌐 Tu sitio estará disponible en:

```
https://shotlist-agency.vercel.app
```

O un dominio personalizado si lo configuras.

---

## 🎨 Características del Sitio Desplegado

✅ **40+ características interactivas**
✅ **Diseño minimalista** (negro, blanco, rojo)
✅ **Animaciones suaves** a 60fps
✅ **Responsive** (Desktop, Tablet, Mobile)
✅ **Optimizado** para performance
✅ **SEO-friendly**

---

## 🔧 Después del Deploy

### Actualizar el sitio:

1. Haz cambios en los archivos
2. Commit:
   ```bash
   git add .
   git commit -m "Update website"
   ```
3. Push:
   ```bash
   git push
   ```
4. Vercel desplegará automáticamente (si usaste Método 2)

---

## 🎯 Dominio Personalizado

### En Vercel:

1. Ve a tu proyecto en Vercel
2. Click "Settings"
3. Click "Domains"
4. Agrega tu dominio: `shotlist.com` (o el que tengas)
5. Sigue las instrucciones de DNS

---

## 📊 Monitoreo

Vercel te da automáticamente:
- ✅ Analytics
- ✅ Performance metrics
- ✅ Deployment logs
- ✅ Error tracking

---

## 🚀 Comandos Útiles

```bash
# Ver todos tus proyectos
vercel ls

# Ver logs
vercel logs

# Remover proyecto
vercel remove shotlist-agency

# Ver deployment URL
vercel inspect
```

---

## 💡 Tips

1. **SSL/HTTPS**: Automático con Vercel ✅
2. **CDN Global**: Incluido ✅
3. **Preview URLs**: Cada push genera una URL de preview
4. **Rollback**: Puedes volver a versiones anteriores fácilmente

---

## 🆘 Troubleshooting

### Error: "Command not found: vercel"
```bash
npm install -g vercel
```

### Error: "No access"
```bash
vercel login
```

### Error: "Build failed"
- Revisa que los archivos HTML, CSS, JS estén en la raíz
- Verifica que `vercel.json` esté presente

---

## 📞 Soporte

- **Vercel Docs**: https://vercel.com/docs
- **Vercel Support**: https://vercel.com/support
- **Status**: https://www.vercel-status.com/

---

## ✅ Checklist de Deploy

- [ ] Instalar Vercel CLI o conectar GitHub
- [ ] Login en Vercel
- [ ] Ejecutar `vercel` desde el directorio del proyecto
- [ ] Verificar que el sitio funciona en la URL de preview
- [ ] Deploy a producción con `vercel --prod`
- [ ] (Opcional) Configurar dominio personalizado
- [ ] Compartir la URL con el mundo 🎉

---

## 🎉 ¡Listo!

Tu sitio de Shotlist estará en línea en menos de 5 minutos.

**URL final**: `https://shotlist-agency.vercel.app`

---

_Guía creada para Shotlist Marketing Agency 🎬_
