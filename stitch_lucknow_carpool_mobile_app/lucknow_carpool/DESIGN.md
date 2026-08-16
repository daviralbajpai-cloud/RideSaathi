---
name: RideSaathi
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#434655'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#737686'
  outline-variant: '#c3c6d7'
  surface-tint: '#0053db'
  primary: '#004ac6'
  on-primary: '#ffffff'
  primary-container: '#2563eb'
  on-primary-container: '#eeefff'
  inverse-primary: '#b4c5ff'
  secondary: '#006c4a'
  on-secondary: '#ffffff'
  secondary-container: '#82f5c1'
  on-secondary-container: '#00714e'
  tertiary: '#784b00'
  on-tertiary: '#ffffff'
  tertiary-container: '#996100'
  on-tertiary-container: '#ffeedd'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dbe1ff'
  primary-fixed-dim: '#b4c5ff'
  on-primary-fixed: '#00174b'
  on-primary-fixed-variant: '#003ea8'
  secondary-fixed: '#85f8c4'
  secondary-fixed-dim: '#68dba9'
  on-secondary-fixed: '#002114'
  on-secondary-fixed-variant: '#005137'
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb95f'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 30px
    fontWeight: '700'
    lineHeight: 38px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-bold:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  container-margin: 16px
  gutter: 12px
---

## Brand & Style

This design system is built on a **Modern-Corporate** foundation with a friendly, approachable veneer. It prioritizes clarity and speed, catering to commuters who need to make quick, reliable decisions. The aesthetic balances professionalism (to establish trust) with a soft, tactile interface (to encourage social connection).

The visual language avoids the coldness of traditional enterprise software by using generous whitespace, soft rounded corners, and a vibrant primary palette. The focus remains strictly on the core utility: finding a ride or a passenger without friction.

## Colors

The color strategy uses a logic of "Actionable Trust." 
- **Primary Blue (#2563EB):** Used for primary navigation, "Find a Ride" CTAs, and core branding. It signals reliability and established service.
- **Secondary Teal (#059669):** Specifically reserved for positive "Offer" actions, successful bookings, and available seats. It differentiates the supply side of the marketplace from the demand side.
- **Tertiary Amber (#F59E0B):** Used sparingly for urgent notifications or pending requests that require attention.
- **Neutral Grays:** We use a cool-toned slate palette for surfaces and text to maintain a clean, premium feel. Backgrounds should use a very light tint of blue-gray (`#F8FAFC`) rather than pure white to reduce eye strain.

## Typography

We use **Plus Jakarta Sans** across the entire platform. Its slightly wider stance and open counters provide excellent legibility on mobile screens while maintaining a friendly, modern character.

- **Headlines:** Use tight letter-spacing and bold weights to create a strong visual anchor.
- **Body Text:** Use standard weights with generous line-heights to ensure ride details and routes are easily scannable while walking or in transit.
- **Labels:** Small, uppercase labels should be used for metadata (e.g., "SEATS LEFT", "SMOKING ALLOWED") to differentiate them from primary content.

## Layout & Spacing

This design system follows a **fluid grid** model optimized for mobile-first consumption. 
- **Mobile (360px-430px):** Single-column layout with 16px side margins. Elements are stacked vertically to prioritize the thumb-zone.
- **Tablet/Desktop:** Content is capped at a maximum width of 600px and centered. This ensures the "app-like" feel is maintained even on larger screens, preventing line lengths from becoming unreadable.
- **Rhythm:** Use an 8px spacing scale. Most vertical gaps between related items should be 12px or 16px, while distinct sections should be separated by 32px.

## Elevation & Depth

We utilize **Tonal Layers** combined with **Ambient Shadows** to create a sense of hierarchy without clutter.
- **Level 0 (Background):** Slate-50 (#F8FAFC) creates a soft canvas.
- **Level 1 (Cards):** Pure white surfaces with a very soft, diffused shadow (10% opacity, 12px blur, 4px offset). This is the primary container for ride listings.
- **Level 2 (Floating/Active):** Higher contrast shadows for active elements like search bars or "Book Now" sticky footers, signaling they are above the main content stream.
- **Outlines:** Use 1px borders in Slate-200 for inactive input states or secondary buttons instead of shadows to keep the UI from looking "heavy."

## Shapes

The shape language is consistently **Rounded**. 
- Standard components like cards and input fields use a **12px (0.75rem)** radius.
- Large CTAs and interactive buttons use a **16px (1rem)** radius to make them feel "touchable" and friendly.
- Avatars and status indicators (like "Active Now") use full circles (pill-shaped) to distinguish them from structural layout elements.

## Components

### Buttons
- **Primary:** Min-height 52px. Solid Blue-600 background with white text. 16px rounded corners.
- **Secondary (Offer):** Min-height 52px. Solid Teal-600 background.
- **Ghost:** Transparent background with 1px Slate-200 border for less important actions like "View Profile."

### Input Fields
- Height of 52px for easy tapping. 
- Use 12px rounded corners.
- Placeholder text in Slate-400.
- Focused state: 2px Primary Blue border with a soft blue outer glow.

### Ride Cards
- White background, 12px rounded corners, subtle shadow.
- Top section: Driver avatar, name, and rating.
- Middle section: Large, bold "From" and "To" text with a vertical line connecting them.
- Bottom section: Price and "Seats Available" tag in Secondary Teal.

### Chips
- Used for ride preferences (e.g., "No Smoking," "AC," "Women Only").
- Small (28px height), light gray background (#F1F5F9), 12px font size.

### Lists
- Standard list items should have a minimum tap target height of 64px.
- Use 1px Slate-100 dividers that stop 16px before the edge of the screen to maintain a "contained" feel.
