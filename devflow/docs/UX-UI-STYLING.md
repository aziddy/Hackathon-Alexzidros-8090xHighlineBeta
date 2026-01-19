# DevFlow UX/UI & Styling Overview

A quick reference for the styling patterns and design choices in DevFlow.

---

## Tech Stack

| Technology | Purpose |
|------------|---------|
| **Tailwind CSS v4** | Utility-first styling with OKLCH color space |
| **Radix UI** | Accessible component primitives |
| **shadcn/ui style** | Pre-built component patterns (`components.json`) |
| **Framer Motion** | React animations and transitions |
| **next-themes** | Dark/light mode switching |
| **Lucide React** | Icon library |
| **Inter** | Primary font (weights: 400, 500, 600, 700) |

---

## Color Palette

### Dark Theme (Default)
- **Background:** `bg-gray-950` / `bg-gray-900`
- **Cards/Surfaces:** `bg-gray-900` / `bg-gray-800`
- **Borders:** `border-gray-800`
- **Text Primary:** `text-white`
- **Text Secondary:** `text-gray-400`

### Brand Colors
- **Logo Gradient:** `from-blue-500 to-purple-600`
- **Text Gradient:** `from-blue-400 to-purple-500`
- **Success/Completed:** `text-green-400`
- **Sidebar Accent (dark):** Blue-purple `oklch(0.488 0.243 264.376)`

### Status Colors
- **Destructive/Error:** Red-orange `oklch(0.577 0.245 27.325)`
- **Progress < 30%:** Red
- **Progress 30-70%:** Yellow
- **Progress > 70%:** Green

### Theme Variables (globals.css)

**Light Mode:**
```css
:root {
  --radius: 0.625rem;
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.145 0 0);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);
  --secondary: oklch(0.97 0 0);
  --secondary-foreground: oklch(0.205 0 0);
  --muted: oklch(0.97 0 0);
  --muted-foreground: oklch(0.556 0 0);
  --accent: oklch(0.97 0 0);
  --accent-foreground: oklch(0.205 0 0);
  --destructive: oklch(0.577 0.245 27.325);
  --border: oklch(0.922 0 0);
  --input: oklch(0.922 0 0);
  --ring: oklch(0.708 0 0);
}
```

**Dark Mode:**
```css
.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  --card: oklch(0.205 0 0);
  --card-foreground: oklch(0.985 0 0);
  --popover: oklch(0.205 0 0);
  --popover-foreground: oklch(0.985 0 0);
  --primary: oklch(0.922 0 0);
  --primary-foreground: oklch(0.205 0 0);
  --secondary: oklch(0.269 0 0);
  --secondary-foreground: oklch(0.985 0 0);
  --muted: oklch(0.269 0 0);
  --muted-foreground: oklch(0.708 0 0);
  --accent: oklch(0.269 0 0);
  --accent-foreground: oklch(0.985 0 0);
  --destructive: oklch(0.704 0.191 22.216);
  --border: oklch(1 0 0 / 10%);
  --input: oklch(1 0 0 / 15%);
  --ring: oklch(0.556 0 0);
  --sidebar-primary: oklch(0.488 0.243 264.376);
}
```

### Gradient Examples

**Logo with gradient background:**
```tsx
<div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600">
  <Zap className="h-5 w-5 text-white" />
</div>
```

**Gradient text:**
```tsx
<span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
  DevFlow
</span>
```

---

## Theme Provider Setup

```tsx
// src/components/providers.tsx
"use client";

import { ThemeProvider } from "next-themes";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </ThemeProvider>
  );
}
```

---

## Utility Functions

### cn() - Class Name Merger

```typescript
// src/lib/utils.ts
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

**Usage:**
```tsx
<div className={cn(
  "bg-card text-card-foreground rounded-xl border",
  isActive && "border-blue-500",
  className
)} />
```

---

## Component Patterns

### Directory Structure
```
src/components/
├── ui/          # Base components (button, card, dialog, etc.)
├── layout/      # Header, sidebar, theme toggle
├── chat/        # Chat interface components
├── kanban/      # Board and card views
├── issues/      # Issue detail and step lists
└── projects/    # Project management
```

### Button Variants (CVA)

```typescript
// src/components/ui/button.tsx
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-white hover:bg-destructive/90",
        outline: "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md gap-1.5 px-3",
        lg: "h-10 rounded-md px-6",
        icon: "size-9",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)
```

### Badge Variants (CVA)

```typescript
// src/components/ui/badge.tsx
const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 transition-[color,box-shadow] overflow-hidden",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        destructive: "border-transparent bg-destructive text-white",
        outline: "text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)
```

### Card Component

```tsx
// src/components/ui/card.tsx
function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm",
        className
      )}
      {...props}
    />
  )
}
```

---

## Animation Patterns

### Bouncing Dots (Loading)

```tsx
// src/components/chat/chat-loading.tsx
import { motion } from "framer-motion";

{[0, 1, 2].map((i) => (
  <motion.div
    key={i}
    className="w-2 h-2 bg-purple-400 rounded-full"
    animate={{ y: [0, -6, 0] }}
    transition={{
      duration: 0.6,
      repeat: Infinity,
      delay: i * 0.15,
    }}
  />
))}
```

### Spring Slide-In (Sidebar)

```tsx
// src/components/chat/chat-sidebar.tsx
import { motion, AnimatePresence } from "framer-motion";

<AnimatePresence>
  {isOpen && (
    <motion.div
      initial={{ x: -320, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -320, opacity: 0 }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      className="absolute left-0 top-0 bottom-0 w-80 bg-gray-900 border-r border-gray-700"
    >
      {/* Content */}
    </motion.div>
  )}
</AnimatePresence>
```

### Layout Animation (Cards)

```tsx
// src/components/kanban/wide-ticket-card.tsx
<motion.div
  layout
  initial={{ opacity: 0, y: 10 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -10 }}
  transition={{ duration: 0.2 }}
>
  {/* Card content */}
</motion.div>
```

### Progress Bar Animation

```tsx
// src/components/kanban/wide-ticket-card.tsx
<motion.div
  initial={{ width: 0 }}
  animate={{ width: `${percentage}%` }}
  transition={{ duration: 0.5, ease: "easeOut" }}
  className={cn("h-full rounded-full", getProgressColor(percentage))}
/>
```

### Checkbox Spring Animation

```tsx
// src/components/issues/atomic-step-item.tsx
{isCompleted && (
  <motion.div
    initial={{ scale: 0 }}
    animate={{ scale: 1 }}
    transition={{ type: "spring", stiffness: 500, damping: 30 }}
  >
    <Check className="h-4 w-4 text-white" />
  </motion.div>
)}
```

### Staggered List Entrance

```tsx
// src/components/issues/atomic-step-list.tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: index * 0.05 }}
>
  {/* List item */}
</motion.div>
```

### Shimmer Effect (100% Complete)

```tsx
// src/components/issues/step-progress-bar.tsx
{progress === 100 && (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: [0, 1, 0] }}
    transition={{ duration: 2, repeat: Infinity }}
    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
  />
)}
```

### Confetti Celebration

```tsx
// src/components/issues/issue-detail-modal.tsx
import confetti from "canvas-confetti";

const celebrateCompletion = () => {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    colors: ["#22c55e", "#3b82f6", "#8b5cf6"], // green, blue, purple
  });
};
```

---

## Notable Design Choices

- **Dark mode by default** - Set via `next-themes` with system detection
- **Border radius:** Base `0.625rem` (10px) with variants (sm through 4xl)
- **Header:** Fixed height `h-16`, backdrop blur, semi-transparent bg
- **Sidebar:** Fixed width `w-64`, darker than main content
- **Cards:** `rounded-xl`, subtle shadow, `gap-6` internal spacing
- **Focus states:** Ring-based with `ring-[3px]` and `ring/50` opacity

---

## Key Files

| File | Contains |
|------|----------|
| `src/app/globals.css` | Theme variables, color tokens, custom variants |
| `src/components/ui/button.tsx` | Button with 6 variants, 6 sizes |
| `src/components/ui/badge.tsx` | Badge with 4 variants |
| `src/components/ui/card.tsx` | Card container components |
| `src/components/layout/sidebar.tsx` | Main navigation, brand colors |
| `src/lib/utils.ts` | `cn()` class merge utility |
| `src/components/providers.tsx` | ThemeProvider setup |
| `components.json` | shadcn/ui configuration |
