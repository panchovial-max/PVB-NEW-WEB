# 🎨 SHOTLIST - Interactive Marketing Agency Website

A bold, minimalist, and highly interactive website inspired by Wieden+Kennedy's design aesthetic.

## 🚀 Interactive Features

### ✨ Animations & Effects
- **Hero Section**: Animated text reveal with staggered fade-in
- **Scroll Animations**: Smooth reveal effects triggered by scrolling
- **Parallax Effect**: Hero text moves with scroll for depth
- **Pulse Animation**: Attention-grabbing CTA button

### 🎯 User Interactions
- **Hover Effects**: 
  - Cards lift and scale on hover
  - Buttons change color with smooth transitions
  - Navigation links get red underline animations
  - Project overlays fade in with project details

- **Card Tilt**: 3D tilt effect on service and project cards following mouse movement

- **Custom Cursor** (Desktop only): 
  - Red circle cursor follower
  - Expands on interactive elements

- **Ripple Effect**: Button clicks create satisfying ripple animations

### 📊 Dynamic Content
- **Animated Stats Counter**: Numbers count up when scrolled into view
  - 47 Campaigns
  - 98% Success Rate
  - 0.8s Response Time

### 📱 Responsive Design
- **Desktop** (1200px+): Full 3-column layout
- **Tablet** (768px-1199px): 2-column adaptive layout
- **Mobile** (320px+): Single column with hamburger menu

### 🎨 Navigation
- **Sticky Header**: Navbar follows scroll with subtle shadow
- **Smooth Scrolling**: Animated scroll to sections
- **Hamburger Menu**: Mobile-friendly collapsible navigation
- **Active Section Tracking**: Highlights current section in nav

### 📧 Contact Form
- **Real-time Validation**: Email format and required field checks
- **Success Modal**: Beautiful confirmation popup
- **Form Reset**: Auto-clears after successful submission

## 🎨 Design System

### Colors
- **Primary Black**: `#000000` - Headers, Navigation, Text
- **Pure White**: `#FFFFFF` - Backgrounds, Light Text
- **Accent Red**: `#FF0000` - CTAs, Highlights, Branding
- **Light Gray**: `#F5F5F5` - Subtle Backgrounds
- **Medium Gray**: `#808080` - Secondary Text
- **Dark Gray**: `#333333` - Primary Text on Light

### Typography
- **Font Family**: Inter (Google Fonts)
- **Hero**: Inter Black, 72px (Desktop) / 48px (Mobile)
- **Headers**: Inter Bold, 48px (Desktop) / 32px (Mobile)
- **Body**: Inter Regular, 18px
- **Buttons**: Inter Bold, 16px

### Spacing System
- 8px base grid for consistent spacing
- Responsive padding and margins
- Optimized for readability

## 📂 File Structure

```
.
├── index.html          # Main HTML structure
├── styles.css          # Complete styling with animations
├── script.js           # Interactive JavaScript features
└── README_WEBSITE.md   # This file
```

## 🚀 How to Launch

### Option 1: Simple HTTP Server (Python)
```bash
# Python 3
python3 -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

### Option 2: Node.js HTTP Server
```bash
npx http-server -p 8000
```

### Option 3: VS Code Live Server
1. Install "Live Server" extension
2. Right-click `index.html`
3. Select "Open with Live Server"

### Option 4: Direct File
Simply double-click `index.html` to open in your browser

## 🌐 Access the Website

After launching, open your browser to:
```
http://localhost:8000
```

## ✨ Key Interactive Elements

### 1. **Hero Section**
- Animated text reveal on page load
- Pulsing CTA button
- Scroll indicator animation

### 2. **Services Cards**
- 3D tilt effect on hover
- Icon rotation animation
- Lift and scale transform
- Red border highlight

### 3. **Portfolio Projects**
- Overlay reveals on hover
- Smooth opacity transitions
- Scale effect on card hover

### 4. **Stats Counter**
- Animates when scrolled into view
- Counts up from 0 to target
- Only animates once per page load

### 5. **Contact Form**
- Input focus animations
- Real-time validation
- Success modal with checkmark animation
- Smooth form reset

## 🎭 Performance Features

- **Intersection Observer**: Efficient scroll-based animations
- **Smooth Transitions**: Hardware-accelerated CSS transforms
- **Lazy Loading**: Ready for image implementation
- **Optimized Animations**: RequestAnimationFrame for smooth 60fps

## 🔧 Customization

### Change Colors
Edit the CSS variables in `styles.css`:
```css
:root {
    --black: #000000;
    --white: #FFFFFF;
    --red: #FF0000;
    /* etc... */
}
```

### Add Real Images
Replace `.project-image-placeholder` divs with:
```html
<img src="your-image.jpg" alt="Project Name">
```

### Connect Contact Form
Update the form submit handler in `script.js` to send to your backend:
```javascript
// Add your API endpoint
fetch('/api/contact', {
    method: 'POST',
    body: JSON.stringify(formData)
})
```

## 📱 Browser Support

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## 🎯 Next Steps

1. **Add Real Content**: Replace placeholder text with actual copy
2. **Add Images**: Include project photos and team images
3. **Backend Integration**: Connect contact form to email service
4. **Analytics**: Add Google Analytics or similar
5. **SEO**: Add meta tags, Open Graph, and structured data
6. **Performance**: Optimize images and add caching
7. **Deploy**: Host on Netlify, Vercel, or your preferred platform

## 🎨 Design Credits

- **Inspiration**: Wieden+Kennedy
- **Design System**: Custom for Shotlist
- **Typography**: Inter by Rasmus Andersson
- **Animations**: Custom CSS & JavaScript

## 📄 License

© 2024 Shotlist. All rights reserved.

---

**Built with ❤️ for campaigns that actually work.**

