# 🎬 Hero Video - Setup & Troubleshooting

## Current Status

The hero video is currently set up with a **fallback gradient background** while the video file is missing.

## What's Happening

### ✅ What Works
- Hero section displays with a professional gradient background
- Text and buttons are fully visible
- Responsive design maintained
- Overlay gradient provides good contrast

### ❌ What's Missing
- The actual video file: `hero-video.mp4`
- Video would provide dynamic, professional background

---

## Adding a Hero Video

To add your hero video, follow these steps:

### Step 1: Prepare Your Video
- Create or obtain a video file
- Format: MP4 (H.264 video codec)
- Recommended: 1920x1080 or higher
- File size: Optimize to < 10MB for web use
- Content: Looping background (30-60 seconds)

### Step 2: Convert Video (if needed)
```bash
# Using FFmpeg to convert and optimize
ffmpeg -i input-video.mov -vcodec h264 -acodec aac -strict -2 hero-video.mp4
```

### Step 3: Place Video File
Place `hero-video.mp4` in the project root directory:
```
/Shotlist/
├── hero-video.mp4    ← Place video here
├── index.html
├── styles.css
└── ...
```

### Step 4: Verify in Browser
1. Open `http://localhost:8000/index.html`
2. Hero section should show video
3. Video auto-plays, mutes, and loops

---

## Video Requirements

### File Specifications
- **Format**: MP4 (H.264)
- **Resolution**: 1920x1080 (minimum)
- **Duration**: 30-60 seconds (looping)
- **File Size**: < 10MB recommended
- **Codecs**:
  - Video: H.264
  - Audio: AAC (optional, muted in HTML)

### Technical Details
```html
<video class="hero-video" autoplay muted loop playsinline>
    <source src="hero-video.mp4" type="video/mp4">
</video>
```

**Attributes:**
- `autoplay` - Starts playing automatically
- `muted` - No sound (required for autoplay)
- `loop` - Continuously repeats
- `playsinline` - Plays inline on mobile (doesn't fullscreen)

---

## Fallback Behavior

### Current Fallback
If `hero-video.mp4` is not found:
- Video element is hidden
- Gradient background shows through
- Page remains fully functional
- No error messages displayed

### CSS Fallback
```css
.hero {
    background: linear-gradient(135deg, #000000 0%, #1a1a1a 50%, #000000 100%);
}

.hero-video-container {
    background: linear-gradient(135deg, #000000 0%, #1a1a1a 50%, #000000 100%);
}
```

---

## Recommended Videos

### Content Ideas
1. **Product Demo** - Show SHOTLIST in action
2. **Agency Montage** - Quick cuts of campaigns
3. **Brand Story** - Company mission/values
4. **Client Success** - Before/after campaign results
5. **Technology Showcase** - Platform features

### Video Sources
- **Custom Production**: Hire videographer
- **Stock Footage**: Pexels, Pixabay, Unsplash
- **AI Generated**: Runway ML, Synthesia
- **Internal Content**: Phone/screen recordings

---

## Browser Compatibility

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome | ✅ | Full support |
| Firefox | ✅ | Full support |
| Safari | ✅ | Full support |
| Edge | ✅ | Full support |
| Mobile Safari | ✅ | Plays inline |
| Android Chrome | ✅ | Plays inline |

---

## Performance Tips

### Video Optimization
```bash
# Reduce file size
ffmpeg -i hero-video.mp4 -vf scale=1920:1080 \
  -b:v 5000k -maxrate 6000k -bufsize 8000k \
  -c:v libx264 -preset fast hero-video.mp4
```

### CDN Delivery (Recommended)
- Upload to Cloudflare, AWS S3, or similar
- Reference via HTTPS URL
- Better performance globally

### Progressive Enhancement
```html
<!-- With CDN URL -->
<video class="hero-video" autoplay muted loop playsinline>
    <source src="https://cdn.example.com/hero-video.mp4" type="video/mp4">
</video>
```

---

## Troubleshooting

### Video Not Playing
**Issue**: Video doesn't appear
**Solutions**:
1. Verify file exists in root directory
2. Check browser console for errors
3. Ensure file is valid MP4
4. Try different video file

### Video Buffers/Lags
**Issue**: Video stutters or freezes
**Solutions**:
1. Reduce video resolution
2. Compress video file
3. Optimize codec settings
4. Use CDN for delivery

### Autoplay Not Working
**Issue**: Video doesn't auto-play
**Solutions**:
1. Ensure `muted` attribute present
2. Check browser autoplay policy
3. Try `playsinline` attribute
4. User may have disabled autoplay

### Mobile Issues
**Issue**: Video doesn't play on phone
**Solutions**:
1. Add `playsinline` attribute ✓ (Already done)
2. Test on actual device
3. Try different video format
4. Check network connection

---

## Current HTML (Updated)

```html
<video class="hero-video" autoplay muted loop playsinline onerror="this.style.display='none'">
    <source src="hero-video.mp4" type="video/mp4">
</video>
```

**Features**:
- ✅ Auto-plays on load
- ✅ Muted (enables autoplay)
- ✅ Loops continuously
- ✅ Plays inline on mobile
- ✅ Hides gracefully if not found

---

## Next Steps

1. **Prepare Video**: Create or obtain video file
2. **Optimize**: Compress to < 10MB
3. **Place File**: Save as `hero-video.mp4` in project root
4. **Test**: Open index.html and verify video plays
5. **Deploy**: Upload to server/hosting

---

**Current Status**: ✅ Ready for video file  
**Last Updated**: October 24, 2025  
**Tested**: Gradient fallback working properly

