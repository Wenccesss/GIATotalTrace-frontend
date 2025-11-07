# Design Guidelines: GIATotalTrace Industrial Traceability System

## Design Approach

**Selected System:** Material Design with industrial refinement
**Rationale:** Industrial monitoring application requiring clarity, reliability, and professional aesthetics. Material Design provides robust components while allowing customization for industrial context.

**Key Principles:**
- Professional clarity over decorative elements
- Information hierarchy for quick scanning
- Trust through consistency and precision
- Scalable modular design for multi-machine expansion

## Typography

**Font Family:** Roboto (Material Design standard)
- **Primary Headings:** Roboto Medium (500) - 32px-48px for main titles
- **Section Headings:** Roboto Regular (400) - 24px for view titles
- **Body Text:** Roboto Regular (400) - 16px for labels and content
- **Data Display:** Roboto Mono (400) - 14px for timestamps and technical data
- **Buttons:** Roboto Medium (500) - 14px uppercase with letter-spacing

## Layout System

**Spacing Scale:** Tailwind units of 2, 4, 6, 8, 12, 16, 24
- Consistent padding: p-8 for cards, p-6 for inner content
- Section spacing: mb-8 between major elements, mb-4 between related items
- Button spacing: gap-4 for button groups

**Container Structure:**
- Max width: max-w-6xl for dashboard
- Centered layouts with mx-auto
- Responsive padding: px-4 (mobile) to px-8 (desktop)

## Component Library

### Login Screen
- **Layout:** Centered card (max-w-md) in full viewport with subtle gradient background
- **Card:** Elevated Material card with rounded corners, p-8 padding
- **Logo/Title:** Large centered "GIATotalTrace" text (text-4xl font-bold mb-8)
- **Form Fields:** Full-width Material text inputs with labels, mb-4 spacing
- **Error Messages:** Alert component below form, red accent with icon
- **Submit Button:** Full-width contained button, primary color, h-12

### Dashboard
- **Header:** Full-width with "GIATotalTrace" prominently centered (text-5xl font-bold py-12)
- **Subheader:** Subtle descriptor text below title (text-xl text-gray-600)
- **Machine Grid:** Responsive grid (grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6)
- **Machine Cards:** 
  - Elevated cards with hover elevation increase
  - Image placeholder at top (aspect-ratio-video, object-cover)
  - Card content: p-6 with machine name (text-xl font-medium)
  - Full card clickable with cursor-pointer
  - Subtle border-radius for modern feel

### Machine View
- **Layout:** max-w-4xl centered container
- **Header Section:** 
  - Title: "Trazabilidad de Máquina 1" (text-3xl font-medium mb-6)
  - Back button: top-left or as first element with arrow icon
- **Status Card:**
  - Large centered card showing current status
  - Status text: "No hay datos disponibles" (text-xl text-center py-16)
  - Prepared for future data displays (charts, metrics grids)
- **Footer Section:**
  - Timestamp display bottom-right (text-sm text-gray-600)
  - Format: "DD/MM/YYYY - HH:MM:SS"

### Navigation Elements
- **Back Button:** Outlined button with left arrow icon, mb-6
- **Logout/Settings:** Top-right corner icons (if added later)

## Visual Treatment

**Elevation:**
- Login card: elevation-8
- Dashboard machine cards: elevation-2 (hover: elevation-6)
- Machine view status card: elevation-4

**Borders & Radius:**
- Card border-radius: rounded-lg (8px)
- Button border-radius: rounded-md (6px)
- Input border-radius: rounded (4px)

**Spacing Rhythm:**
- Vertical sections: py-12 to py-16 for major areas
- Card internal: p-6 to p-8
- Between elements: mb-4 to mb-8 based on hierarchy

## Images

**Machine Placeholder Images:**
- Industrial machinery photos or illustrations
- Aspect ratio: 16:9 for consistency
- Placement: Top of each machine card
- Style: Professional industrial photography or clean technical illustrations
- Suggested: CNC machines, assembly lines, manufacturing equipment
- Size: Full card width, height ~200px

**No Hero Image:** This application doesn't use traditional hero sections

## Accessibility

- Maintain ARIA labels on all interactive elements
- Ensure form inputs have associated labels
- Error messages with appropriate role="alert"
- Keyboard navigation fully supported
- Focus indicators visible on all interactive elements
- Minimum touch target size: 44x44px for buttons

## Responsive Behavior

**Breakpoints:**
- Mobile: < 768px - Single column, stacked layout
- Tablet: 768px-1024px - 2-column grid for machines
- Desktop: > 1024px - 3-column grid, full spacing

**Mobile Optimizations:**
- Reduce title sizes by 25-30%
- Full-width buttons and cards
- Simplified padding (p-4 instead of p-8)
- Timestamp moves to centered position on small screens

## Animation Guidelines

**Minimal, purposeful animations only:**
- Card hover elevation: transition-shadow duration-200
- Button interactions: built-in Material transitions
- Page transitions: simple fade or none
- No loading animations unless data fetching implemented