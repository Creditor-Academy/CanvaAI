# Mobile Responsive Quick Reference

## Breakpoint Cheat Sheet

```jsx
// Tailwind breakpoints
sm: 640px   // Small devices
md: 768px   // Tablets
lg: 1024px  // Laptops
xl: 1280px  // Desktops
2xl: 1536px // Large screens
```

## Common Patterns

### Responsive Padding
```jsx
className="p-3 sm:p-4 md:p-6 lg:p-8"
```

### Responsive Grid
```jsx
className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6"
```

### Responsive Text
```jsx
className="text-sm md:text-base lg:text-lg"
```

### Responsive Flex
```jsx
className="flex flex-col sm:flex-row items-start sm:items-center gap-4"
```

### Hide on Mobile
```jsx
className="hidden sm:block"  // Hide below 640px
className="hidden md:block"  // Hide below 768px
```

### Show Only on Mobile
```jsx
className="block sm:hidden"  // Show only below 640px
```

## Touch-Friendly Elements

```jsx
// Buttons (min 44px touch target)
<button className="min-h-[44px] min-w-[44px] px-4 py-2">
  Click Me
</button>

// Links with adequate spacing
<a className="inline-block p-2">Link</a>
```

## Images

```jsx
// Responsive image
<img 
  src="/image.jpg" 
  className="w-full h-auto max-w-full"
  alt="Description"
/>

// Background image
<div className="bg-cover bg-center bg-no-repeat" style={{backgroundImage: 'url(...)'}}>
```

## Forms

```jsx
// Input with mobile-friendly size
<input 
  className="w-full px-4 py-3 text-base border rounded-lg"
  style={{fontSize: '16px'}} // Prevents iOS zoom
/>
```

## Layout Containers

```jsx
// Standard container
<div className="w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">

// Full width section
<section className="w-full px-4 sm:px-6 lg:px-8">
```

## Device Detection Hook

```jsx
import { useDeviceType } from '@/utils/responsiveUtils';

function MyComponent() {
  const deviceType = useDeviceType();
  
  return (
    <div>
      {deviceType === 'mobile' && <MobileView />}
      {deviceType === 'tablet' && <TableView />}
      {deviceType === 'desktop' && <DesktopView />}
    </div>
  );
}
```

## Media Query Hook

```jsx
import { useMediaQuery } from '@/utils/responsiveUtils';

function MyComponent() {
  const isMobile = useMediaQuery(768);
  
  return (
    <div className={isMobile ? 'mobile-layout' : 'desktop-layout'}>
      Content
    </div>
  );
}
```

## Common Issues

### ❌ Horizontal Scroll
```css
/* Fix */
body { overflow-x: hidden; }
.container { max-width: 100%; }
```

### ❌ Text Overflow
```css
/* Fix */
.text-truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
```

### ❌ Fixed Element Overlap
```css
/* Fix - add padding to main content */
main { padding-top: 60px; } /* Match header height */
```

### ❌ Images Not Scaling
```css
/* Fix */
img { max-width: 100%; height: auto; }
```

## Testing Commands

```bash
# Open Chrome DevTools
F12 or Ctrl+Shift+I

# Toggle device toolbar
Ctrl+Shift+M (Cmd+Shift+M on Mac)

# Test common devices
- iPhone SE (375px)
- iPhone 14 Pro (393px)
- iPad Mini (768px)
- iPad Pro (1024px)
- Desktop (1440px+)
```

## Utility Imports

```jsx
// All responsive utilities
import {
  isMobile,
  isTablet,
  isDesktop,
  getDeviceType,
  useViewport,
  useMediaQuery,
  useDeviceType,
  getResponsivePadding,
  getResponsiveGrid,
  RESPONSIVE_CONTAINER,
  RESPONSIVE_BUTTON
} from '@/utils/responsiveUtils';
```

## Spacing Scale

```
p-1  = 0.25rem (4px)
p-2  = 0.5rem (8px)
p-3  = 0.75rem (12px)
p-4  = 1rem (16px)
p-6  = 1.5rem (24px)
p-8  = 2rem (32px)
p-12 = 3rem (48px)
```

## Font Sizes

```
text-xs   = 0.75rem (12px)
text-sm   = 0.875rem (14px)
text-base = 1rem (16px)
text-lg   = 1.125rem (18px)
text-xl   = 1.25rem (20px)
text-2xl  = 1.5rem (24px)
text-3xl  = 1.875rem (30px)
text-4xl  = 2.25rem (36px)
```

## Key Files Modified

1. ✅ `components/AppLayout.jsx` - Responsive layout margins
2. ✅ `components/Navbar.jsx` - Mobile-friendly navigation
3. ✅ `components/SideBar.jsx` - Mobile drawer (already existed)
4. ✅ `styles/real-pagination.css` - Full viewport scrollbar
5. ✅ `index.css` - Comprehensive responsive styles
6. ✅ `utils/responsiveUtils.js` - Utility functions (NEW)
7. ✅ `components/homepage/Dashboard.jsx` - Responsive hero section

## Checklist Before Deploy

- [ ] Test on iPhone Safari
- [ ] Test on Android Chrome
- [ ] Test on iPad
- [ ] Test landscape orientation
- [ ] Verify all buttons are tappable (44px min)
- [ ] Check no horizontal scrolling
- [ ] Verify images scale properly
- [ ] Test form inputs (no iOS zoom)
- [ ] Check modals/dropdowns fit screen
- [ ] Verify text is readable
- [ ] Test touch gestures
- [ ] Check performance (Lighthouse)

---

**Remember:** Mobile-first approach - design for mobile, then enhance for larger screens!
