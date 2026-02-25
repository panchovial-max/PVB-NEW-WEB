# 🎨 SHOTLIST Settings Page - Figma Design Specifications

## Overview
Complete design specifications for the SHOTLIST Campaign Analytics Settings Page, ready for Figma implementation.

---

## 📐 Layout Specifications

### Canvas Size
- **Desktop**: 1440px width × Variable height
- **Tablet**: 768px width × Variable height  
- **Mobile**: 375px width × Variable height

### Grid System
- **Columns**: 12-column grid
- **Gutter**: 24px
- **Margin**: 24px (desktop), 16px (mobile)

---

## 🎨 Color Palette

### Primary Colors
```
Red Gradient (Primary):
- Start: #FF0000
- End: #CC0000
- Usage: Buttons, active states, accents

Black:
- #000000
- Usage: Primary text, logos

Dark Gray:
- #333333
- Usage: Secondary text, labels
```

### Background Colors
```
Light Gray:
- #f8f9fa
- Usage: Page background

White:
- #FFFFFF
- Usage: Cards, containers

Gray Borders:
- #E0E0E0
- Usage: Input borders, dividers

Hover Gray:
- #f0f0f0
- Usage: Hover states
```

### Status Colors
```
Success Green:
- Background: #E8F5E9
- Text: #2E7D32

Error Red:
- Background: #FFEBEE
- Text: #C62828

Warning Yellow:
- Background: #FFFBEA
- Border: #FFA500
```

### Accent Colors (Color Picker)
```
1. Red: #FF0000 (default)
2. Blue: #0066FF
3. Green: #00AA00
4. Orange: #FF6600
5. Purple: #9900FF
```

---

## 📝 Typography

### Font Family
**Primary**: Inter (Google Fonts)
**Fallback**: -apple-system, BlinkMacSystemFont, sans-serif

### Font Sizes & Weights
```
Headings:
- H1 (Page Title): 32px, Weight 700
- H2 (Section Title): 18px, Weight 700
- H3 (Card Title): 16px, Weight 600

Body Text:
- Primary: 14px, Weight 400
- Label: 14px, Weight 600
- Small: 13px, Weight 400
- Help Text: 12px, Weight 400
```

### Line Heights
```
- Headings: 1.2
- Body: 1.5
- Help Text: 1.4
```

---

## 🧩 Component Specifications

### Navigation Bar
```
Dimensions: 100% width × 80px height
Background: White
Box Shadow: 0 2px 8px rgba(0,0,0,0.08)
Position: Fixed top

Elements:
- Logo (left): 60px × 40px
- Title (center): 24px, Weight 600
- Actions (right): Buttons with 16px gap
```

### Quick Access Cards
```
Dimensions: minWidth 280px, autofit grid
Padding: 24px
Border Radius: 12px
Background: White
Box Shadow: 0 2px 8px rgba(0,0,0,0.08)
Hover: 0 4px 16px rgba(0,0,0,0.12)

Card Icon:
- Size: 40px × 40px
- Border Radius: 8px
- Background: Linear gradient (Red)
- Text: 20px emoji/icon
```

### Form Inputs
```
Dimensions: 100% width
Height: 42px
Padding: 12px
Border: 1px solid #ddd
Border Radius: 6px
Font Size: 14px

Focus State:
- Border: #FF0000
- Box Shadow: 0 0 0 3px rgba(255,0,0,0.1)

Disabled:
- Background: #f8f9fa
- Cursor: not-allowed
```

### Toggle Switches
```
Dimensions: 50px × 26px
Border Radius: 13px
Background (inactive): #CCCCCC
Background (active): Linear gradient (Red)

Circle:
- Size: 22px × 22px
- Position (inactive): 2px from left
- Position (active): 26px from left
- Transition: 0.3s ease
```

### Buttons
```
Primary Button:
- Height: 42px
- Padding: 12px 24px
- Background: Linear gradient (Red)
- Color: White
- Border Radius: 6px
- Font Weight: 600
- Hover: translateY(-2px) + shadow

Secondary Button:
- Background: #f0f0f0
- Color: #333
- Hover: Background #e0e0e0

Small Button:
- Height: 32px
- Padding: 8px 16px
- Font Size: 12px
```

### Status Badges
```
Dimensions: Auto width
Height: 26px
Padding: 6px 12px
Border Radius: 20px
Font Size: 12px
Font Weight: 600

Connected:
- Background: #E8F5E9
- Color: #2E7D32

Disconnected:
- Background: #FFEBEE
- Color: #C62828
```

### Color Picker
```
Color Option:
- Size: 40px × 40px
- Border Radius: 6px
- Border: 3px solid transparent
- Cursor: pointer

Selected State:
- Border: 3px solid #333
- Transform: scale(1.1)
```

---

## 📱 Responsive Breakpoints

### Desktop (> 1024px)
```
- 3-column card grid
- Max width: 1200px container
- Full features visible
- Side-by-side forms
```

### Tablet (600px - 1024px)
```
- 2-column card grid
- Adjusted padding: 16px
- Stacked forms in sections
```

### Mobile (< 600px)
```
- 1-column layout
- Full width cards
- Stacked navigation buttons
- Reduced padding: 12px
- Large touch targets (44px min)
```

---

## 🎭 Animation Specifications

### Transitions
```
Default Duration: 0.3s
Easing: ease

Elements:
- Button hover: all 0.3s ease
- Toggle switch: all 0.3s ease
- Card hover: all 0.3s ease
- Input focus: border-color 0.3s ease
```

### Hover Effects
```
Buttons:
- Transform: translateY(-2px)
- Box Shadow: 0 4px 12px rgba(255,0,0,0.3)

Cards:
- Box Shadow: 0 4px 16px rgba(0,0,0,0.12)

Color Options:
- Transform: scale(1.1)
```

### Success Message Animation
```
@keyframes slideIn
  from: opacity 0, translateY(-10px)
  to: opacity 1, translateY(0)
  
Duration: 0.3s
Easing: ease
Display: 3 seconds
```

---

## 🖼️ Section Layouts

### 1. Page Header
```
Components:
- H1: "⚙️ Settings"
- Subtitle: "Manage your account, preferences..."
- Margin bottom: 48px
```

### 2. Quick Access Grid
```
Grid: repeat(auto-fit, minmax(280px, 1fr))
Gap: 32px
Margin bottom: 32px

6 Cards:
1. Account (👤)
2. Social Media (📱)
3. Notifications (🔔)
4. Appearance (🎨)
5. Security (🔒)
6. About (ℹ️)
```

### 3. Account Settings Section
```
Background: White
Border Radius: 12px
Padding: 32px
Margin bottom: 32px

Form Groups:
- Full Name input
- Email input (disabled)
- Company Name input
- Contact Phone input
- Bio textarea

Button Group:
- Save Changes (primary)
- Cancel (secondary)
```

### 4. Social Media Section
```
Components:
- Description text
- Account list (existing accounts)
- Add new form:
  - Platform dropdown
  - Account name input
  - Connect button
```

### 5. Notifications Section
```
6 Toggle Items:
- Email Notifications
- Campaign Updates
- Performance Alerts
- Daily Summary
- Weekly Reports
- Marketing Emails

Each item:
- Label (left)
- Toggle switch (right)
- Padding: 16px
- Background: #f8f9fa
- Border Radius: 6px
- Margin bottom: 16px
```

### 6. Appearance Section
```
Form Groups:
- Theme selector dropdown
- Color picker grid (5 colors)
- Rows per page dropdown

Button Group:
- Apply Changes (primary)
- Reset to Default (secondary)
```

### 7. Security Section
```
Warning Banner:
- Background: #FFFBEA
- Border Left: 4px solid #FFA500
- Padding: 16px
- Icon: ℹ️
- Margin bottom: 24px

Form Groups:
- Current Password
- New Password
- Confirm Password
- 2FA Toggle

Help Text:
"Minimum 8 characters, include uppercase, lowercase, and numbers"
```

### 8. About Section
```
Grid: 3 columns (auto-fit, min 300px)
Gap: 32px

Info Cards:
1. App Version
2. Last Updated
3. Support Contact

System Info Box:
- Background: #f8f9fa
- Font: Monospace, 12px
- Padding: 16px
- Border Radius: 6px

Content:
- User Agent
- Language
- Storage Available
```

---

## 🎯 Interactive States

### Input States
```
Default: Border #ddd
Focus: Border #FF0000, Shadow rgba(255,0,0,0.1)
Error: Border #C62828, Help text red
Success: Border #2E7D32, Help text green
Disabled: Background #f8f9fa, cursor not-allowed
```

### Button States
```
Default: Normal appearance
Hover: Transform up 2px, shadow
Active: Transform down 1px
Disabled: Opacity 0.5, cursor not-allowed
Loading: Spinner, disabled interaction
```

### Toggle States
```
Off: Gray background, circle left
On: Red gradient, circle right
Hover: Slight scale (1.02)
Transition: 0.3s ease
```

---

## 📦 Export Settings for Figma

### Frames to Create
1. Desktop - Settings Page (1440px)
2. Tablet - Settings Page (768px)
3. Mobile - Settings Page (375px)
4. Component Library
5. Color Palette Swatches
6. Typography Samples

### Components to Build
- Navigation Bar
- Quick Access Card
- Form Input
- Toggle Switch
- Primary Button
- Secondary Button
- Status Badge
- Color Picker Option
- Section Container
- Success Message

### Auto Layout Usage
- All cards: Auto layout, vertical
- Button groups: Auto layout, horizontal
- Form groups: Auto layout, vertical
- Grid sections: CSS Grid equivalent

---

## 🔤 Text Content

### Navigation
- Page Title: "SETTINGS"
- Back Button: "Back to Dashboard"
- Logout Button: "Logout"

### Quick Access Cards
1. Account: "Manage Account"
2. Social Media: "Manage Accounts"
3. Notifications: "Configure Alerts"
4. Appearance: "Customize"
5. Security: "Security Settings"
6. About: "View Details"

### Section Titles
- "👤 Account Settings"
- "📱 Connected Social Media Accounts"
- "🔔 Notification Preferences"
- "🎨 Appearance Settings"
- "🔒 Security Settings"
- "ℹ️ About SHOTLIST"

---

## 📋 Design Checklist

### Before Exporting to Figma
- [ ] All colors use design tokens
- [ ] Typography follows scale
- [ ] Spacing follows 8px grid
- [ ] All interactive elements have states
- [ ] Responsive breakpoints defined
- [ ] Components are reusable
- [ ] Auto layout configured
- [ ] Shadows consistent
- [ ] Border radius consistent
- [ ] All text layers editable

### Figma File Structure
```
📁 SHOTLIST Settings
├── 📄 Cover (Description)
├── 🎨 Design System
│   ├── Colors
│   ├── Typography
│   ├── Spacing
│   └── Shadows
├── 🧩 Components
│   ├── Navigation
│   ├── Cards
│   ├── Forms
│   ├── Buttons
│   └── Toggles
├── 📱 Desktop
├── 📱 Tablet
└── 📱 Mobile
```

---

## 🚀 Implementation Notes

### For Developers
- Use semantic HTML
- ARIA labels for accessibility
- Focus management
- Keyboard navigation
- Form validation
- LocalStorage for persistence

### For Designers
- Maintain 8px spacing grid
- Use consistent shadows
- Follow color palette
- Test all interaction states
- Consider dark mode future
- Ensure 4.5:1 contrast ratio

---

**Status**: Ready for Figma Implementation  
**Last Updated**: October 27, 2025  
**Version**: 1.0.0

This specification document provides everything needed to recreate the Settings Page in Figma with pixel-perfect accuracy.
