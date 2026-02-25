# 🎨 SHOTLIST Figma Design System - Build Plan

## Overview

Complete design system for SHOTLIST Campaign Analytics platform with all components, pages, and design tokens.

---

## Phase 1: Design Tokens & Foundation

### Colors

**Primary Colors:**
- Black: `#000000` - Primary brand color
- White: `#FFFFFF` - Background/contrast
- Gray-900: `#111827` - Dark text
- Gray-800: `#1F2937` - Secondary text
- Gray-700: `#374151` - Tertiary text
- Gray-600: `#4B5563` - Disabled text

**Semantic Colors:**
- Success: `#10B981` - Green (confirmations, success)
- Warning: `#F59E0B` - Amber (warnings, caution)
- Error: `#EF4444` - Red (errors, danger)
- Info: `#3B82F6` - Blue (information, links)

**Neutral:**
- Light Gray: `#F3F4F6` - Light backgrounds
- Border: `#E5E7EB` - Borders, dividers
- Overlay: `rgba(0, 0, 0, 0.5)` - Modal overlays

### Typography

**Font Family:** Inter

**Font Sizes & Weights:**
- Display: 32px, Bold (700)
- Heading 1: 24px, SemiBold (600)
- Heading 2: 20px, SemiBold (600)
- Heading 3: 18px, SemiBold (600)
- Body Large: 16px, Regular (400)
- Body: 14px, Regular (400)
- Small: 12px, Regular (400)
- Tiny: 11px, Regular (400)

**Line Heights:**
- Display: 1.2
- Heading: 1.3
- Body: 1.5
- Small: 1.4

### Spacing

- xs: 4px
- sm: 8px
- md: 12px
- lg: 16px
- xl: 24px
- 2xl: 32px
- 3xl: 48px

### Border Radius

- sm: 4px
- md: 8px
- lg: 12px
- xl: 16px
- full: 9999px

---

## Phase 2: Component Library

### Buttons

**Primary Button**
- Background: Black (#000000)
- Text: White
- Padding: 12px 24px
- Border Radius: 8px
- States: Default, Hover (darker), Active (pressed), Disabled

**Secondary Button**
- Background: Gray Light (#F3F4F6)
- Text: Black
- Padding: 12px 24px
- Border Radius: 8px
- States: Default, Hover, Active, Disabled

**Danger Button**
- Background: Error Red (#EF4444)
- Text: White
- Padding: 12px 24px
- Border Radius: 8px
- States: Default, Hover, Active, Disabled

**Ghost Button**
- Background: Transparent
- Text: Black
- Border: 1px solid #E5E7EB
- Padding: 12px 24px
- Border Radius: 8px

### Input Fields

**Text Input**
- Border: 1px solid #E5E7EB
- Border Radius: 8px
- Padding: 12px 16px
- Background: White
- States: Default, Focus (border blue), Error (border red), Disabled

**Email Input**
- Same as text input
- Type: email

**Password Input**
- Same as text input
- Type: password
- Show/hide toggle

**Textarea**
- Border: 1px solid #E5E7EB
- Border Radius: 8px
- Padding: 12px 16px
- Background: White
- Min-height: 120px

### Cards

**Default Card**
- Background: White
- Border: 1px solid #E5E7EB
- Border Radius: 12px
- Padding: 20px
- Box Shadow: 0 1px 3px rgba(0, 0, 0, 0.1)

**Elevated Card**
- Background: White
- Border: None
- Border Radius: 12px
- Padding: 20px
- Box Shadow: 0 10px 15px rgba(0, 0, 0, 0.1)

**Bordered Card**
- Background: White
- Border: 2px solid #000000
- Border Radius: 12px
- Padding: 20px

### Modals

**Modal Container**
- Background: White
- Border Radius: 16px
- Padding: 32px
- Box Shadow: 0 20px 25px rgba(0, 0, 0, 0.15)
- Max Width: 500px

**Modal Header**
- Title: 24px, Bold
- Close Button: X icon, top right

**Modal Body**
- Content: 14px, regular
- Padding: 20px 0

**Modal Footer**
- Buttons: Primary + Secondary
- Spacing: 16px between buttons

### Tabs

**Tab Bar**
- Background: White
- Border Bottom: 2px solid #E5E7EB

**Tab Item (Inactive)**
- Text: 14px, regular
- Color: #6B7280
- Padding: 16px 24px
- Border Bottom: None

**Tab Item (Active)**
- Text: 14px, semibold
- Color: Black
- Padding: 16px 24px
- Border Bottom: 3px solid #000000

### Toggle Switch

**Off State**
- Background: #E5E7EB
- Circle: White, left position
- Size: 44px x 24px

**On State**
- Background: #10B981 (Success)
- Circle: White, right position
- Size: 44px x 24px

### Alerts

**Success Alert**
- Background: #ECFDF5
- Border Left: 4px solid #10B981
- Icon: Checkmark
- Text: #065F46
- Padding: 16px

**Error Alert**
- Background: #FEF2F2
- Border Left: 4px solid #EF4444
- Icon: X or Warning
- Text: #7F1D1D
- Padding: 16px

**Warning Alert**
- Background: #FFFBEB
- Border Left: 4px solid #F59E0B
- Icon: Warning triangle
- Text: #78350F
- Padding: 16px

**Info Alert**
- Background: #EFF6FF
- Border Left: 4px solid #3B82F6
- Icon: Info
- Text: #1E40AF
- Padding: 16px

---

## Phase 3: Page Designs

### Marketing Site

**1. Landing Page**
- Hero Section
  - Large headline (Display type)
  - Subheadline (Body Large)
  - CTA button
  - Background image/video area
  - Height: 600px

- Features Section
  - 3-4 feature cards
  - Icon + Title + Description
  - Grid layout
  - Padding: 60px horizontal

- Pricing Section
  - 3 pricing tiers
  - Card layout
  - Pricing plans: Free, Pro, Enterprise
  - Feature list per tier
  - CTA buttons

- Footer
  - Logo
  - Links (About, Pricing, Blog, Contact)
  - Social icons
  - Copyright

**2. Features Page**
- Feature showcase cards
- Screenshots/mockups
- Detailed descriptions
- Testimonials section

**3. Pricing Page**
- Pricing comparison table
- Feature checklist
- FAQ section
- CTA

### Dashboard (Admin)

**1. Dashboard Home**
- Header with logo, search, user menu
- Key metrics section (4 cards)
- Recent campaigns list
- Activity feed
- Quick actions

**2. Campaigns**
- Campaign list table
- Columns: Name, Status, Created, Updated, Actions
- Filters: Status, Date range
- Create campaign button
- Bulk actions

**3. Analytics**
- Metrics cards (top section)
- Chart area (large chart)
- Date range selector
- Export button
- Detailed metrics table

**4. Social Media**
- Connected accounts section
- Platform cards (Instagram, Facebook, Twitter, etc.)
- Connect button per platform
- Performance metrics per account

### Client Interface

**1. Login Page**
- Email input
- Password input
- Remember me checkbox
- Login button
- Social login buttons (Google, Apple, Facebook)
- Forgot password link
- Sign up link

**2. Client Dashboard**
- Similar to admin but limited scope
- My campaigns
- Performance overview
- Recent reports

**3. Settings Page**

**Tab 1: Account**
- Profile image
- Full name input
- Email input
- Company input
- Phone input
- Bio textarea
- Save button

**Tab 2: Social Media**
- Connected accounts list
- Connect new account buttons
- Disconnect buttons per account
- Account status indicators

**Tab 3: Notifications**
- Email notifications toggle
- Campaign updates toggle
- Performance alerts toggle
- Daily summary toggle
- Weekly reports toggle
- Marketing emails toggle

**Tab 4: Appearance**
- Theme selector (Light, Dark, Auto)
- Accent color picker (5 options)
- Rows per page selector
- Live preview

**Tab 5: Security**
- Current password input
- New password input
- Confirm password input
- Password strength indicator
- 2FA toggle
- Change password button

**Tab 6: API & Integrations**
- API keys list
- Generate new key button
- Webhook configuration
- Figma sync settings
- Connected apps list

---

## Phase 4: Component States

### Interactive States

**Buttons:**
- Default
- Hover
- Active/Pressed
- Disabled
- Loading (with spinner)

**Inputs:**
- Default
- Focus
- Error
- Disabled
- Filled/Value state

**Cards:**
- Default
- Hover
- Selected
- Disabled

**Modals:**
- Default
- With error state
- With success state
- Loading state

---

## Phase 5: Responsive Breakpoints

- Mobile: 360px - 767px
- Tablet: 768px - 1024px
- Desktop: 1025px+

**Responsive Adjustments:**
- Mobile: Single column, stacked
- Tablet: 2 columns, adjusted spacing
- Desktop: Full multi-column layout

---

## Implementation Checklist

### In Figma:

- [ ] Create color library with all colors
- [ ] Create typography styles for all sizes
- [ ] Create component variants for buttons
- [ ] Create component variants for inputs
- [ ] Create component variants for cards
- [ ] Create modal component with states
- [ ] Create tab component
- [ ] Create toggle component
- [ ] Create alert component variants
- [ ] Design landing page
- [ ] Design features page
- [ ] Design pricing page
- [ ] Design dashboard home
- [ ] Design campaigns list
- [ ] Design analytics page
- [ ] Design social media page
- [ ] Design login page
- [ ] Design settings page (all tabs)
- [ ] Create interactive prototypes
- [ ] Add annotations for developers

### In Code:

- [ ] Export all components as SVG/PNG
- [ ] Generate CSS from design
- [ ] Create component library in code
- [ ] Implement landing page
- [ ] Implement dashboard pages
- [ ] Implement settings page
- [ ] Implement responsive designs
- [ ] Test across devices
- [ ] Sync with Figma

---

## Design System File Structure (in Figma)

```
SHOTLIST Design System
├── Colors & Tokens
│   ├── Primary Colors
│   ├── Semantic Colors
│   └── Spacing
├── Typography
│   ├── Display
│   ├── Headings
│   └── Body
├── Components
│   ├── Buttons
│   ├── Inputs
│   ├── Cards
│   ├── Modals
│   ├── Tabs
│   ├── Toggles
│   └── Alerts
├── Marketing Site
│   ├── Landing Page
│   ├── Features Page
│   └── Pricing Page
├── Dashboard
│   ├── Home
│   ├── Campaigns
│   ├── Analytics
│   └── Social Media
└── Client Interface
    ├── Login
    ├── Dashboard
    └── Settings
```

---

## Design System Usage

### For Designers:
1. Use components from library
2. Apply colors from color tokens
3. Use typography styles
4. Follow spacing guidelines
5. Maintain consistency

### For Developers:
1. Reference components for implementation
2. Use design tokens for CSS variables
3. Implement responsive breakpoints
4. Create component library
5. Test against designs

---

## Next Steps

1. **Create in Figma** - Build all components and pages
2. **Export Assets** - Get all design resources
3. **Generate Code** - Create HTML/CSS/JS from designs
4. **Implement** - Build missing pages/features
5. **Sync** - Keep design and code in sync using dual sync service

---

**Design System Owner:** SHOTLIST Team  
**Last Updated:** October 28, 2025  
**Status:** Ready for implementation
