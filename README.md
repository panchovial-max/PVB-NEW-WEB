# PVB Estudio Creativo

> Agencia boutique de marketing de lujo especializada en marcas equestres, automotrices y de lifestyle.

## Sobre Nosotros

PVB Estudio Creativo es un estudio boutique que potencia marcas premium en los sectores equestre, automotriz y lifestyle. Ofrecemos soluciones integrales de marketing con un enfoque refinado y personalizado — transformando identidades de marca en experiencias visuales que conectan con audiencias de alto poder adquisitivo.

## Sitio Web

Plataforma web completa con dashboard de cliente, analytics y gestión de redes sociales:

- ✅ Diseño luxury editorial
- ✅ Animaciones fluidas (60fps)
- ✅ Totalmente responsive (Desktop, Tablet, Mobile)
- ✅ Sistema de colores: Charcoal, Slate, Gold
- ✅ Tipografía: Inter (Google Fonts)
- ✅ Dashboard de cliente con autenticación OAuth
- ✅ Integración Instagram API
- ✅ WhatsApp Business API

## Paleta de Colores

| Color | Hex | Uso |
|-------|-----|-----|
| Charcoal Black | `#1a1a1a` | Primario |
| Slate Gray | `#4a4a4a` | Secundario |
| Warm Gold | `#c9a96e` | Acento |
| Deep Black | `#0d0d0d` | Background |
| Off White | `#f5f5f5` | Texto |

## Stack Tecnológico

**Frontend:**
- HTML5
- CSS3 (Grid, Custom Properties, Animaciones)
- JavaScript Vanilla

**Backend:**
- Python — `api_server.py`
- Supabase (PostgreSQL + Auth)

**Integraciones:**
- Instagram Graph API
- WhatsApp Business API
- Google OAuth
- Figma Design Sync

## Estructura del Proyecto

```
pvb-new-web/
├── index.html           ← Sitio principal
├── dashboard.html       ← Panel de cliente
├── login.html           ← Autenticación
├── settings.html        ← Configuración de cuenta
├── client-login.html    ← Acceso de clientes
├── api_server.py        ← Backend Python
├── styles.css           ← Estilos globales
├── dashboard.css        ← Estilos dashboard
├── script.js            ← Lógica frontend
├── dashboard.js         ← Lógica dashboard
├── auth_schema.sql      ← Schema autenticación
├── supabase-schema.sql  ← Schema principal
└── docs/                ← Documentación organizada
    ├── deployment/
    ├── figma/
    ├── auth/
    ├── social-media/
    ├── whatsapp/
    └── setup/
```

## Inicio Rápido

```bash
# Iniciar backend
python api_server.py

# Abrir sitio
open index.html
```

Ver [docs/setup/QUICKSTART.md](docs/setup/QUICKSTART.md) para instrucciones completas.

---

*© 2025 PVB Estudio Creativo — Todos los derechos reservados*
