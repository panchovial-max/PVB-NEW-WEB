# 🚀 Quick Start Guide - Shotlist Interactive Website

## Launch in 3 Steps

### 1️⃣ Navigate to Project
```bash
cd /Users/franciscovialbrown/Documents/GitHub/cmo_py_
```

### 2️⃣ Launch Website
Choose any method:

**Easy Way (Using Launch Script):**
```bash
./launch_website.sh
```

**Manual - Python 3:**
```bash
python3 -m http.server 8000
```

**Manual - Node.js:**
```bash
npx http-server -p 8000
```

**Super Easy - Direct Open:**
```bash
open index.html
# or double-click index.html
```

### 3️⃣ Open Browser
```
http://localhost:8000
```

---

## 🎯 What You'll See

### Interactive Features Live Demo

**When the page loads:**
- ✨ Hero text animates in line by line
- 🔴 Red "START PROJECT" button pulses
- ⬇️ Scroll indicator animates

**As you scroll:**
- 📱 Navbar becomes sticky with shadow
- 🎨 Service cards fade in with stagger effect
- 📊 Stats counter animates from 0 → 47, 98, 0.8
- 🎭 Active section highlights in navigation

**When you hover (desktop):**
- 🎪 Service cards lift up and tilt in 3D
- 🔴 Red border appears on cards
- 🎯 Icons rotate 360°
- 🖱️ Custom red cursor follows mouse
- 🌊 Buttons lift with glow effect

**When you click:**
- 💧 Ripple animation from click point
- ✅ Smooth navigation to sections
- 📝 Form validates and shows success modal

**On mobile:**
- 🍔 Hamburger menu opens/closes smoothly
- 📱 Single column responsive layout
- 👆 Touch-friendly interactions

---

## 🎨 Test These Features

### Desktop Experience
1. Move mouse over service cards → 3D tilt effect
2. Hover over navigation links → Red underline animation
3. Click "START PROJECT" → Ripple effect
4. Scroll down to stats → Numbers count up
5. Fill out contact form → Success modal

### Mobile Experience
1. Open on phone/narrow browser
2. Tap hamburger menu → Opens smoothly
3. Scroll through → Fade-in animations
4. Tap service cards → Hover effects
5. Fill form → Same validation

---

## 📂 Files Created

| File | Purpose |
|------|---------|
| `index.html` | Main website structure |
| `styles.css` | All styling + animations |
| `script.js` | Interactive features |
| `launch_website.sh` | Quick launch script |
| `README_WEBSITE.md` | Complete documentation |
| `INTERACTIVE_FEATURES.md` | Feature breakdown |
| `QUICKSTART.md` | This file |

---

## 🎯 Key Interactive Highlights

### 1. Scroll Animations
- Intersection Observer API
- Staggered fade-ins
- Parallax hero effect

### 2. 3D Card Effects
- Mouse-tracking tilt
- Perspective transforms
- Smooth transitions

### 3. Custom Cursor
- Red circle follower
- Smooth easing animation
- Expands on hover

### 4. Stats Counter
- Animates on scroll
- Counts from 0 to target
- Handles decimals

### 5. Form Handling
- Real-time validation
- Success modal
- Auto-close features

---

## 🔧 Customization Quick Tips

### Change Colors
Edit in `styles.css`:
```css
:root {
    --red: #FF0000;  /* Change to your brand color */
    --black: #000000;
    --white: #FFFFFF;
}
```

### Update Content
Edit text directly in `index.html`:
- Hero title (line ~38)
- Service descriptions (line ~53)
- Contact info (line ~159)

### Adjust Animation Speed
Edit in `script.js`:
```javascript
// Stats counter speed (line ~68)
const duration = 2000; // milliseconds

// Card tilt sensitivity (line ~265)
const rotateX = (y - centerY) / 10; // Lower = less tilt
```

---

## 🐛 Troubleshooting

**Port 8000 already in use?**
```bash
python3 -m http.server 8080  # Use different port
```

**Launch script won't run?**
```bash
chmod +x launch_website.sh  # Make executable
```

**Animations not working?**
- Try hard refresh: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
- Check browser console for errors

**Mobile menu not opening?**
- Ensure JavaScript is enabled
- Check browser console

---

## 📊 Browser Compatibility

| Browser | Version | Status |
|---------|---------|--------|
| Chrome | 90+ | ✅ Full support |
| Firefox | 88+ | ✅ Full support |
| Safari | 14+ | ✅ Full support |
| Edge | 90+ | ✅ Full support |
| Mobile Safari | iOS 14+ | ✅ Full support |
| Chrome Mobile | Latest | ✅ Full support |

---

## 🎉 Next Steps

1. **Launch it!** → Use quick start steps above
2. **Test features** → Try all interactive elements
3. **Customize** → Add your content and images
4. **Deploy** → Push to Netlify, Vercel, or GitHub Pages

---

## 💡 Pro Tips

- **Open DevTools Console** to see easter egg and logs
- **Test on mobile** by making browser window narrow
- **Try keyboard navigation** with Tab key
- **Scroll slowly** to see all fade-in animations
- **Fill out contact form** to see success modal

---

## 🆘 Need Help?

Check these files:
- `README_WEBSITE.md` - Complete documentation
- `INTERACTIVE_FEATURES.md` - Feature breakdown
- `index.html` - HTML structure with comments
- `script.js` - JavaScript with section comments

---

## 🎨 Design Credits

- **Inspired by**: Wieden+Kennedy
- **Font**: Inter (Google Fonts)
- **Color Palette**: Black, White, Red minimalism
- **Built with**: Vanilla HTML, CSS, JavaScript

---

**Ready? Let's launch! 🚀**

```bash
./launch_website.sh
```

Then open: **http://localhost:8000**

