# InternTrack Design System - Migration Guide

## Overview
This document provides a detailed breakdown of the design system, styling approach, and component patterns used in InternTrack. Use this as a reference for migrating the design to your old codebase.

---

## 1. Color Palette

### Core Colors
```css
primary: #FF8800        /* Orange Accent - used for CTAs, highlights, icons */
surface: #2B2A2A        /* Grey - used for sidebars, cards, surfaces */
background: #141414     /* Deep Black - main background */
beige: #E4DDD2          /* Light beige - text, secondary surfaces */
```

### Implementation (Tailwind Config)
```javascript
// tailwind.config.js
theme: {
    extend: {
        colors: {
            primary: '#FF8800',        // Orange - consistent across both modes
            surface: '#2B2A2A',        // Dark grey - reference color
            background: '#141414',     // Very dark - reference color
            beige: '#E4DDD2',          // Beige - reference color
        },
    },
},
```

### Light Mode (Primary) - Color Usage
```jsx
// Backgrounds (Light mode default)
className="bg-white"                    // Card/Surface backgrounds
className="bg-gray-50"                  // Page backgrounds
className="bg-gray-100"                 // Subtle backgrounds

// Text (Light mode)
className="text-gray-900"               // Headings, main text
className="text-gray-700"               // Secondary text
className="text-gray-500"               // Tertiary/labels

// Borders (Light mode)
className="border-gray-200"             // Card borders
className="border-gray-300"             // Input borders

// Primary accent (Works in both modes)
className="bg-primary text-white"       // Orange button
className="text-primary"                // Orange text/icons
```

### Dark Mode (Secondary) - Overrides Only
```jsx
// Dark mode uses dark: prefix for overrides
className="bg-white dark:bg-slate-900/50"          // Light: white, Dark: dark slate
className="text-gray-900 dark:text-white"          // Light: black, Dark: white
className="border-gray-200 dark:border-white/5"    // Light: grey, Dark: subtle white
className="text-gray-500 dark:text-gray-400"       // Light: grey, Dark: lighter grey
```

---

## 2. Light Mode vs Dark Mode

### Primary Design: Light Mode First
The design system is built with **light mode as the primary user experience**. Dark mode is provided as an optional enhancement for users who prefer it.

- **Light Mode:** Clean, bright, professional appearance
- **Dark Mode:** Secondary for accessibility and user preference

### Theme Files
- Light colors: backgrounds, text, borders are optimized for readability in light
- Dark adjustments use `dark:` prefix as overrides only where needed

---

## 3. Typography

### Font Family
- **Primary Font:** Figtree (Google Fonts)
- **Weights Used:** 400 (regular), 500 (medium), 600 (semibold), 700+ (bold/black)

### Configuration
```javascript
// tailwind.config.js
fontFamily: {
    sans: ['Figtree', ...defaultTheme.fontFamily.sans],
},

// app.blade.php (in head)
<link href="https://fonts.bunny.net/css?family=figtree:400,500,600&display=swap" rel="stylesheet" />
```

### Text Styles Used

| Element | Style | Light Color | Dark Override |
|---------|-------|-------------|---------------|
| Page Title | `text-3xl font-black tracking-tight` | `text-gray-900` | `dark:text-white` |
| Section Header | `text-xl font-black` | `text-gray-800` | `dark:text-white` |
| Label/Small Text | `text-xs font-bold uppercase tracking-widest` | `text-gray-500` | `dark:text-gray-400` |
| Body Text | `text-sm` or `text-base` | `text-gray-700` | `dark:text-gray-300` |
| Large Numbers | `text-4xl font-black` | `text-gray-900` | `dark:text-white` |

---

## 3. Component Library & Pattern Library

### Base Components Created

#### 1. **Buttons**
```jsx
// PrimaryButton - Orange CTA
<button className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-orange-600 transition">
    Action
</button>

// SecondaryButton - Outlined
<button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
    Cancel
</button>

// DangerButton - Red destructive action
<button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
    Delete
</button>
```

#### 2. **Form Inputs**
```jsx
// TextInput - Standard input with consistent styling
<TextInput 
    type="email" 
    name="email"
    value={data.email}
    onChange={(e) => setData('email', e.target.value)}
    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
/>

// InputLabel - Form labels
<InputLabel htmlFor="email" value="Email Address" />

// InputError - Validation errors
<InputError message={errors.email} className="mt-2" />
```

#### 3. **Modal Component**
```jsx
<Modal show={showModal} onClose={closeModal}>
    <div className="p-6">
        <h2 className="text-xl font-bold">Modal Title</h2>
        <p className="text-gray-600 mt-2">Modal content goes here</p>
        <button onClick={closeModal} className="mt-6 px-4 py-2 bg-primary text-white rounded">
            Close
        </button>
    </div>
</Modal>
```

#### 4. **Dropdown Component**
```jsx
<Dropdown>
    <Dropdown.Trigger>
        <button className="px-3 py-2 text-gray-500 hover:text-gray-700">
            {user.name}
            <ChevronDown size={16} />
        </button>
    </Dropdown.Trigger>
    
    <Dropdown.Content>
        <Dropdown.Link href={route('profile.edit')}>Profile</Dropdown.Link>
        <Dropdown.Link href={route('logout')} method="post">Log Out</Dropdown.Link>
    </Dropdown.Content>
</Dropdown>
```

#### 5. **Checkbox Component**
```jsx
<Checkbox 
    name="agree" 
    checked={data.agree}
    onChange={(e) => setData('agree', e.target.checked)}
/>
```

#### 6. **Dark Mode Toggle**
```jsx
import { Sun, Moon } from 'lucide-react';

const toggleTheme = () => {
    const root = document.documentElement;
    if (isDark) {
        root.classList.remove('dark');
        localStorage.setItem('theme', 'light');
    } else {
        root.classList.add('dark');
        localStorage.setItem('theme', 'dark');
    }
};

// Button with icons
<button onClick={toggleTheme}>
    {isDark ? <Sun size={20} /> : <Moon size={20} />}
</button>
```

#### 7. **Carousel Component**
```jsx
// Auto-rotating carousel with keyboard controls
<Carousel>
    {/* Auto-slides every 5 seconds */}
    {/* Click indicators to jump to slide */}
    {/* Gradient overlay on images */}
</Carousel>
```

#### 8. **Navigation Components**
```jsx
// NavLink - Active state aware
<NavLink href={route('dashboard')} active={route().current('dashboard')}>
    Dashboard
</NavLink>

// ResponsiveNavLink - Mobile navigation
<ResponsiveNavLink href={route('profile.edit')}>
    Profile
</ResponsiveNavLink>
```

---

## 4. Card & Surface Design

### Standard Card Pattern - Light Mode First
```jsx
<div className="bg-white p-6 rounded-[2rem] border border-gray-200 shadow-sm backdrop-blur-md dark:bg-slate-900/50 dark:border-white/5">
    {/* Card content */}
</div>
```

### Key Features:
- **Border Radius:** `rounded-[2rem]` to `rounded-[2.5rem]` (large rounded corners)
- **Light Mode (Primary):**
  - Background: `bg-white` (clean, bright)
  - Border: `border-gray-200` (subtle grey)
  - Shadow: `shadow-sm` (soft shadow for depth)
- **Dark Mode (Override):**
  - Background: `dark:bg-slate-900/50` (semi-transparent dark)
  - Border: `dark:border-white/5` (subtle white)
- **Backdrop:** `backdrop-blur-md` (glassmorphism effect, both modes)

---

## 5. Animation Library - Framer Motion

### Installation
```bash
npm install framer-motion
```

### Common Patterns

#### 1. **Fade In On Load**
```jsx
import { motion } from 'framer-motion';

<motion.div 
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.5 }}
>
    Content fades in
</motion.div>
```

#### 2. **Staggered List Animation**
```jsx
<motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.1 }}
>
    Item animates with delay
</motion.div>
```

#### 3. **Full Dashboard Fade In**
```jsx
<div className="animate-in fade-in duration-700">
    {/* Content */}
</div>
```

### Animation Classes
```tailwindcss
animate-in          /* Fade in from element */
fade-in             /* Fade in animation */
duration-500        /* Animation duration */
duration-700        /* Longer animations */
```

---

## 6. Icon Library - Lucide React

### Installation
```bash
npm install lucide-react
```

### Available Icons Used in Codebase

```javascript
import { 
    Users,          // Multiple people
    UserCheck,      // Person with checkmark
    Clock,          // Clock/Timer
    Activity,       // Activity/Pulse
    ArrowRight,     // Right arrow
    Sun,            // Light/Sun for dark mode
    Moon,           // Moon for dark mode
    ChevronDown,    // Dropdown indicator
    // ... and many more available
} from 'lucide-react';

// Usage
<Users className="text-blue-500" size={24} />
<Clock className="text-orange-500" size={20} />
```

### Icon Size Conventions
- **Navigation/Headers:** `size={24}`
- **Inline in text:** `size={20}` or `size={16}`
- **Large decorative:** `size={32}` or `size={48}`

---

## 7. Layout Patterns

### Dashboard Layout Grid
```jsx
<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
    {/* 1 column on mobile, 3 columns on desktop */}
    <StatCard />
    <StatCard />
    <StatCard />
</div>
```

### Responsive Breakpoints
```tailwind
sm:     640px
md:     768px
lg:     1024px
xl:     1280px
2xl:    1536px
```

### Common Responsive Patterns
```jsx
// Hide on mobile, show on desktop
<div className="hidden md:block">Desktop only</div>

// Full width on mobile, constrained on desktop
<div className="w-full md:max-w-7xl mx-auto">Container</div>

// Stack on mobile, row on desktop
<div className="flex flex-col md:flex-row gap-4">
    <div className="flex-1">Column 1</div>
    <div className="flex-1">Column 2</div>
</div>
```

---

## 8. Dark Mode Implementation

### Setup
```javascript
// tailwind.config.js
darkMode: 'class',  // Class-based dark mode (not system preference based)
```

### HTML Implementation - Light Mode by Default
```html
<!-- app.blade.php -->
<script>
    // Default to LIGHT mode
    // Only switch to dark if explicitly stored in localStorage
    if (localStorage.theme === 'dark') {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
        // No system preference fallback - light is always default
    }
</script>
```

**Key Point:** Unlike some designs, this does NOT use `prefers-color-scheme`. Light mode is the guaranteed default experience.

### Implementation Pattern: Light First, Dark Override
```jsx
// CORRECT: Light mode as primary, dark mode as override
<div className="bg-white dark:bg-slate-900">
    <p className="text-gray-900 dark:text-white">Text</p>
</div>

// CORRECT: Borders
<div className="border-gray-200 dark:border-white/5">
    Borders
</div>

// CORRECT: Hover states
<button className="hover:bg-gray-100 dark:hover:bg-slate-800">
    Hover
</button>
```

### Color Opacity Values in Dark Mode
```css
/* Use opacity to create visual hierarchy in dark mode */
border-white/5          /* 5% white opacity - very subtle */
border-white/10         /* 10% white opacity - slightly visible */
text-white/70           /* 70% opaque white - secondary text */
bg-white/5              /* 5% white overlay */
```

---

## 9. Spacing & Sizing System

### Padding/Margin (Tailwind default scale)
```css
p-2   = 8px
p-4   = 16px
p-6   = 24px
p-8   = 32px

gap-2  = 8px gap
gap-3  = 12px gap
gap-4  = 16px gap
gap-6  = 24px gap
```

### Common Spacing Patterns
```jsx
// Card padding
<div className="p-6">Card with standard padding</div>

// Section spacing
<div className="space-y-8">
    <div>Section 1</div>  {/* 32px gap between */}
    <div>Section 2</div>
</div>

// Grid gaps
<div className="grid grid-cols-3 gap-6">Columns with 24px gaps</div>
```

---

## 10. Stat Card Component Pattern

### Standard Stat Card
```jsx
<motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.1 }}
    className="bg-white dark:bg-slate-900/50 p-6 rounded-[2rem] border border-slate-200 dark:border-white/5 shadow-sm backdrop-blur-md"
>
    {/* Icon with colored background */}
    <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-4">
        <Users className="text-blue-500" size={24} />
    </div>
    
    {/* Label */}
    <h3 className="text-slate-500 dark:text-gray-400 text-sm uppercase tracking-widest font-bold">
        Total Users
    </h3>
    
    {/* Value */}
    <p className="text-4xl font-black text-slate-900 dark:text-white mt-1">
        {value}
    </p>
</motion.div>
```

### Color-Coded Icon Backgrounds
```javascript
const stats = [
    { color: 'text-blue-500', bg: 'bg-blue-500/10' },      // Blue
    { color: 'text-green-500', bg: 'bg-green-500/10' },    // Green
    { color: 'text-orange-500', bg: 'bg-orange-500/10' },  // Orange (Primary)
    { color: 'text-purple-500', bg: 'bg-purple-500/10' },  // Purple
];
```

---

## 11. Table Component Pattern

### Bordered Table Card
```jsx
<div className="bg-white dark:bg-slate-900/50 rounded-[2.5rem] border border-slate-200 dark:border-white/5 overflow-hidden shadow-sm backdrop-blur-md">
    {/* Header */}
    <div className="px-8 py-6 border-b border-slate-200 dark:border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
            <Activity className="text-orange-500" size={20} />
            <h2 className="text-xl font-black text-slate-800 dark:text-white">
                Title
            </h2>
        </div>
        <button className="flex items-center gap-2 text-sm font-bold text-orange-500 hover:gap-3 transition-all">
            View All <ArrowRight size={16} />
        </button>
    </div>
    
    {/* Content */}
    <div className="px-8 py-6">
        {/* Table or list items */}
    </div>
</div>
```

---

## 12. Button States & Hover Effects

### Primary Button Full Example
```jsx
<button className="
    px-6 py-3 
    bg-primary text-white 
    rounded-lg 
    font-bold 
    hover:bg-orange-600 
    active:scale-95 
    disabled:opacity-50 disabled:cursor-not-allowed
    transition-all duration-200
">
    Click Me
</button>
```

### Transition Classes
```css
transition-all         /* Animate all properties */
duration-150          /* 150ms animation */
duration-200          /* 200ms animation */
duration-500          /* 500ms animation */
ease-in-out          /* Standard easing */
```

---

## 13. Responsive Mobile Navigation

### Mobile Base Structure
```jsx
{/* Mobile only menu */}
<div className="-me-2 flex items-center sm:hidden">
    <button
        onClick={() => setShowingNavigationDropdown(!showingNavigationDropdown)}
        className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-100"
    >
        {/* Hamburger menu or close icon */}
    </button>
</div>

{/* Mobile navigation dropdown */}
{showingNavigationDropdown && (
    <div className="space-y-1 pb-3 pt-2 sm:hidden">
        <ResponsiveNavLink href="/dashboard">Dashboard</ResponsiveNavLink>
        <ResponsiveNavLink href="/profile">Profile</ResponsiveNavLink>
    </div>
)}
```

---

## 14. Copy-Paste Ready Component Examples

### Stat Card (Light Mode First)
```jsx
import { motion } from 'framer-motion';
import { Users } from 'lucide-react';

function StatCard({ label, value, icon: Icon, color, bg, delay = 0 }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            className="bg-white dark:bg-slate-900/50 p-6 rounded-[2rem] border border-gray-200 dark:border-white/5 shadow-sm backdrop-blur-md"
        >
            <div className={`w-12 h-12 ${bg} rounded-2xl flex items-center justify-center mb-4`}>
                <Icon className={color} size={24} />
            </div>
            <h3 className="text-gray-500 dark:text-gray-400 text-sm uppercase tracking-widest font-bold">
                {label}
            </h3>
            <p className="text-4xl font-black text-gray-900 dark:text-white mt-1">
                {value ?? 0}
            </p>
        </motion.div>
    );
}
```

### Page Header (Light Mode First)
```jsx
function PageHeader({ title, subtitle, statusText = null }) {
    return (
        <div className="flex justify-between items-end">
            <div>
                <h2 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">
                    {title}
                </h2>
                <p className="text-gray-500 dark:text-gray-400">
                    {subtitle}
                </p>
            </div>
            {statusText && (
                <div className="hidden md:block text-right">
                    <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                        Status
                    </span>
                    <div className="flex items-center gap-2 text-green-500 font-bold">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        {statusText}
                    </div>
                </div>
            )}
        </div>
    );
}
```

---

## 15. Build & Deployment

### Development
```bash
npm run dev      # Start Vite dev server
php artisan serve # Start Laravel dev server
npm run build    # Build for production
```

### Vite Configuration
- **Input:** `resources/js/app.jsx` - React entry point
- **Output:** Hashed files in `public/build/`
- **HMR:** Hot Module Replacement enabled
- **Plugins:** Laravel plugin + React plugin

---

## Summary: Key Takeaways for Migration

### Primary Design Principles (Light Mode First)
1. **Default Experience:** Light mode with white backgrounds, dark text
2. **Colors:** Orange accent (`#FF8800`) on light, clean backgrounds
3. **Typography:** Figtree font, large bold headings, small caps for labels
4. **Cards:** White backgrounds with subtle gray borders, large rounded corners, soft shadows
5. **Text Colors (Light):** Gray-900 for headings, Gray-700 for body, Gray-500 for labels

### Dark Mode (Secondary Enhancement)
6. **Dark Mode Setup:** Class-based, optional user toggle
7. **Dark Implementation:** Override light styles with `dark:` prefix only where needed
8. **Dark Colors:** Use slate-900/50 and white/opacity for transparency layering

### Additional Features
9. **Animations:** Framer Motion for micro-interactions, Tailwind animations for transitions
10. **Icons:** Lucide React icons, color-coded with 24px/20px/16px sizing
11. **Spacing:** Use Tailwind's gap/p/m scale consistently
12. **Responsive:** Mobile-first approach with `md:` breakpoints
13. **Components:** Build reusable, motion-ready patterns
14. **Transitions:** Always use `transition-all` with appropriate durations

### Color Coding Quick Reference
```
Light Mode (Primary):       Dark Mode (Override):
Background: white           dark:bg-slate-900/50
Text: gray-900              dark:text-white
Border: gray-200            dark:border-white/5
Secondary: gray-500         dark:text-gray-400
Accent: #FF8800             (same in both modes)
```

