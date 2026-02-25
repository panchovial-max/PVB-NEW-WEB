# 🚀 Deploy Shotlist Website to Vercel

## ✅ Video Hero Integrado

Tu sitio ahora tiene un **video de fondo profesional** en la sección hero:
- ✅ Auto-play, loop, muted
- ✅ Overlay oscuro para legibilidad del texto
- ✅ Texto blanco con sombras
- ✅ Completamente responsive

**Archivo:** `hero-video.mp4` (81MB)

---

## 🌐 Deploy a Vercel

### Opción 1: Deploy con Vercel CLI

```bash
# 1. Instalar Vercel CLI
npm install -g vercel

# 2. Login con tu token
vercel login

# 3. Deploy
vercel

# 4. Para producción
vercel --prod
```

---

### Opción 2: Deploy Manual (Más Fácil)

#### Paso 1: Ir a Vercel
Visita: https://vercel.com

#### Paso 2: Login/Signup
- Login con GitHub, GitLab o Email

#### Paso 3: Nuevo Proyecto
1. Click en "Add New..."
2. Selecciona "Project"

#### Paso 4: Import Repository
**Opción A - Con Git:**
- Conecta tu GitHub
- Selecciona el repositorio `cmo_py_`

**Opción B - Sin Git (Upload):**
- Sube solo estos archivos:
  ```
  index.html
  styles.css
  script.js
  hero-video.mp4
  vercel.json
  ```

#### Paso 5: Configurar
- Project Name: `shotlist-website`
- Framework Preset: Other
- Build Command: (dejar vacío)
- Output Directory: `./`
- Install Command: (dejar vacío)

#### Paso 6: Deploy!
Click en "Deploy" y espera ~2 minutos

---

## ⚡ Tu Sitio Estará en:

```
https://shotlist-website.vercel.app
```

O tu dominio custom si lo configuras.

---

## 📋 Archivos Necesarios para Deploy

### ✅ Archivos Principales
- `index.html` - Sitio web
- `styles.css` - Estilos
- `script.js` - Interactividad  
- `hero-video.mp4` - Video de fondo (81MB)

### ✅ Archivos de Configuración
- `vercel.json` - Config de Vercel
- `.vercelignore` - Archivos a ignorar

### ❌ NO subir
- Archivos `.py`
- Archivos `.md` (excepto README)
- node_modules/
- .env
- Configuraciones de desarrollo

---

## 🎬 Características del Video Hero

### Implementado:
✅ Video de fondo a pantalla completa
✅ Auto-play automático
✅ Loop infinito
✅ Muted (sin sonido)
✅ Overlay degradado oscuro
✅ Texto blanco con sombras para legibilidad
✅ Responsive en todos los dispositivos
✅ Optimizado para mobile (`playsinline`)

### Detalles Técnicos:
```html
<video autoplay muted loop playsinline>
  <source src="hero-video.mp4" type="video/mp4">
</video>
```

### Overlay:
- Degradado de negro 40% → 60% → 80%
- Mantiene el texto completamente legible
- Efecto cinematográfico profesional

---

## 🎨 Cambios Visuales del Hero

### Antes:
- Fondo blanco
- Texto negro
- Estático

### Ahora:
- Video de fondo dinámico
- Texto blanco con sombras
- Overlay oscuro elegante
- Scroll indicator blanco
- Efecto "QUE FUNCIONAN" en rojo con resplandor

---

## 🔧 Optimización del Video

### Si el video es muy pesado (81MB):

**Opción 1: Comprimir**
```bash
# Con FFmpeg
ffmpeg -i hero-video.mp4 -vcodec h264 -crf 28 hero-video-compressed.mp4
```

**Opción 2: Diferentes resoluciones**
```bash
# 1080p (más ligero)
ffmpeg -i hero-video.mp4 -s 1920x1080 -c:v libx264 -crf 23 hero-video-1080p.mp4

# 720p (mucho más ligero)
ffmpeg -i hero-video.mp4 -s 1280x720 -c:v libx264 -crf 23 hero-video-720p.mp4
```

**Opción 3: Usar servicio CDN**
- Sube a Cloudinary, Vimeo, o YouTube
- Usa como fuente externa

---

## 📱 Mobile Performance

El video está optimizado para mobile:
- Atributo `playsinline` para iOS
- Auto-play funciona en todos los dispositivos
- Responsive con `object-fit: cover`

---

## 🚀 Comandos Rápidos

### Ver localmente con el video:
```bash
python3 -m http.server 8000
# Abre: http://localhost:8000
```

### Deploy a Vercel:
```bash
vercel --prod
```

### Check tamaño del video:
```bash
ls -lh hero-video.mp4
```

---

## 🎯 Próximos Pasos

1. **Ver el video localmente**
   - Refresca http://localhost:8000
   - ¡Disfruta del hero con video!

2. **Deploy a Vercel**
   - Sigue las instrucciones arriba
   - Tu sitio estará live en minutos

3. **Optimizar (opcional)**
   - Comprimir el video si es necesario
   - Agregar lazy loading para secciones

---

## ✨ Resultado Final

Tu sitio web Shotlist ahora tiene:
- ✅ Video hero profesional
- ✅ Completamente en español
- ✅ 40+ interacciones
- ✅ Responsive design
- ✅ Listo para producción
- ✅ Configurado para Vercel

---

## 🆘 Troubleshooting

**Video no se reproduce:**
- Verifica que `hero-video.mp4` esté en la raíz
- Check consola del navegador
- Prueba en diferentes navegadores

**Video muy lento:**
- Comprímelo con FFmpeg
- Usa versión 720p
- Considera CDN

**Deploy falla:**
- Verifica que todos los archivos estén
- Check el tamaño (Vercel limit: 100MB por archivo)
- Revisa los logs de Vercel

---

**¡Tu sitio está listo para ser deploy! 🎉**

