# Modern Web App Styling Guide: Next.js + Tailwind v4 + shadcn/ui

**A Complete Replication Guide for LLMs**

Version: 1.0
Last Updated: February 2026
Source Project: DevFlow
Target Audience: LLMs building similar styled applications

---

## About This Document

This document provides complete, copy-paste ready instructions for replicating the DevFlow design system in a new Next.js project. It is specifically structured for LLM consumption with:

- ✅ Complete code snippets (not partial examples)
- ✅ Step-by-step setup instructions from scratch
- ✅ Explanations of WHY design decisions were made
- ✅ All dependencies with exact versions
- ✅ Common patterns and anti-patterns
- ✅ Real-world component examples

**Philosophy:** Dark mode first, accessible by default, animated thoughtfully, typed strictly.

---

## 1. Quick Start Checklist

Use this checklist to ensure you've set up all required pieces:

- [ ] Node.js 20+ and package manager installed
- [ ] Next.js 15+ project initialized
- [ ] All styling dependencies installed (see Section 2)
- [ ] Tailwind CSS v4 configured with PostCSS
- [ ] globals.css with OKLCH color tokens added
- [ ] Theme provider configured
- [ ] shadcn/ui initialized with components.json
- [ ] Path aliases configured in tsconfig.json
- [ ] Inter font family loaded
- [ ] cn() utility function created
- [ ] First UI component tested

**Estimated Setup Time:** 15-20 minutes

---

## 2. Dependencies Installation

### 2.1 Core Dependencies

Install all required packages in one command:

```bash
npm install next@16.1.3 react@19.2.3 react-dom@19.2.3 \
  @fontsource/inter@^5.2.8 \
  next-themes@^0.4.6 \
  class-variance-authority@^0.7.1 \
  clsx@^2.1.1 \
  tailwind-merge@^3.4.0 \
  framer-motion@^12.26.2 \
  lucide-react@^0.562.0 \
  sonner@^2.0.7 \
  canvas-confetti@^1.9.4
```

### 2.2 Radix UI Primitives

shadcn/ui components are built on Radix UI. Install these primitives:

```bash
npm install @radix-ui/react-avatar@^1.1.11 \
  @radix-ui/react-collapsible@^1.1.12 \
  @radix-ui/react-dialog@^1.1.15 \
  @radix-ui/react-dropdown-menu@^2.1.16 \
  @radix-ui/react-popover@^1.1.15 \
  @radix-ui/react-progress@^1.1.8 \
  @radix-ui/react-scroll-area@^1.2.10 \
  @radix-ui/react-separator@^1.1.8 \
  @radix-ui/react-slot@^1.2.4
```

**Why Radix UI?**
- Unstyled, accessible component primitives
- WCAG compliant out of the box
- Full keyboard navigation
- Screen reader support
- Focus management

### 2.3 Development Dependencies

```bash
npm install -D tailwindcss@^4 \
  @tailwindcss/postcss@^4 \
  tw-animate-css@^1.4.0 \
  typescript@^5 \
  @types/react@^19 \
  @types/react-dom@^19 \
  @types/node@^20 \
  @types/canvas-confetti@^1.9.0
```

### 2.4 Version Notes

- **Tailwind CSS v4**: Major upgrade with `@theme inline` syntax, OKLCH color space support
- **React 19**: Latest concurrent features and RSC support
- **Next.js 16**: App Router, React Server Components, enhanced performance

---

## 3. Project Configuration

### 3.1 TypeScript Configuration

Create or update `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

**Key Configuration:**
- `paths: { "@/*": ["./src/*"] }` - Absolute imports for clean code
- `strict: true` - Type safety for fewer runtime errors
- `jsx: "preserve"` - Let Next.js handle JSX transformation

### 3.2 PostCSS Configuration

Create `postcss.config.mjs`:

```javascript
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
```

**Note:** Tailwind v4 uses a PostCSS plugin instead of a traditional config file.

### 3.3 shadcn/ui Configuration

Create `components.json` at project root:

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "iconLibrary": "lucide",
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  }
}
```

**Configuration Choices:**
- `style: "new-york"` - Modern, clean aesthetic vs "default" style
- `rsc: true` - React Server Component support
- `cssVariables: true` - Theme tokens as CSS variables for easy theming
- `baseColor: "neutral"` - Grayscale foundation (alternatives: slate, zinc, stone)

---

## 4. Core Styling Setup

### 4.1 Global Styles (globals.css)

Create `src/app/globals.css` with complete configuration:

```css
@import "tailwindcss";
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));

@theme inline {
  /* CSS Variable Mappings */
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);

  /* Sidebar Colors */
  --color-sidebar: var(--sidebar);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-ring: var(--sidebar-ring);

  /* Chart Colors */
  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --color-chart-5: var(--chart-5);

  /* Font Families */
  --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
  --font-mono: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;

  /* Border Radius Scale */
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
  --radius-2xl: calc(var(--radius) + 8px);
  --radius-3xl: calc(var(--radius) + 12px);
  --radius-4xl: calc(var(--radius) + 16px);
}

/* Light Theme (Default) */
:root {
  --radius: 0.625rem; /* 10px */

  /* OKLCH Color Space - Light Mode */
  --background: oklch(1 0 0); /* Pure white */
  --foreground: oklch(0.145 0 0); /* Near black */
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
  --destructive: oklch(0.577 0.245 27.325); /* Red-orange */
  --border: oklch(0.922 0 0);
  --input: oklch(0.922 0 0);
  --ring: oklch(0.708 0 0);

  /* Chart colors (light) */
  --chart-1: oklch(0.646 0.222 41.116);
  --chart-2: oklch(0.6 0.118 184.704);
  --chart-3: oklch(0.398 0.07 227.392);
  --chart-4: oklch(0.828 0.189 84.429);
  --chart-5: oklch(0.769 0.188 70.08);

  /* Sidebar (light) */
  --sidebar: oklch(0.985 0 0);
  --sidebar-foreground: oklch(0.145 0 0);
  --sidebar-primary: oklch(0.205 0 0);
  --sidebar-primary-foreground: oklch(0.985 0 0);
  --sidebar-accent: oklch(0.97 0 0);
  --sidebar-accent-foreground: oklch(0.205 0 0);
  --sidebar-border: oklch(0.922 0 0);
  --sidebar-ring: oklch(0.708 0 0);
}

/* Dark Theme */
.dark {
  --background: oklch(0.145 0 0); /* Near black */
  --foreground: oklch(0.985 0 0); /* Near white */
  --card: oklch(0.205 0 0); /* Dark gray */
  --card-foreground: oklch(0.985 0 0);
  --popover: oklch(0.205 0 0);
  --popover-foreground: oklch(0.985 0 0);
  --primary: oklch(0.922 0 0); /* Light gray */
  --primary-foreground: oklch(0.205 0 0);
  --secondary: oklch(0.269 0 0);
  --secondary-foreground: oklch(0.985 0 0);
  --muted: oklch(0.269 0 0);
  --muted-foreground: oklch(0.708 0 0);
  --accent: oklch(0.269 0 0);
  --accent-foreground: oklch(0.985 0 0);
  --destructive: oklch(0.704 0.191 22.216);
  --border: oklch(1 0 0 / 10%); /* Semi-transparent white */
  --input: oklch(1 0 0 / 15%);
  --ring: oklch(0.556 0 0);

  /* Chart colors (dark) - vibrant for dark backgrounds */
  --chart-1: oklch(0.488 0.243 264.376); /* Blue-purple */
  --chart-2: oklch(0.696 0.17 162.48);
  --chart-3: oklch(0.769 0.188 70.08);
  --chart-4: oklch(0.627 0.265 303.9);
  --chart-5: oklch(0.645 0.246 16.439);

  /* Sidebar (dark) */
  --sidebar: oklch(0.205 0 0);
  --sidebar-foreground: oklch(0.985 0 0);
  --sidebar-primary: oklch(0.488 0.243 264.376); /* Brand blue-purple */
  --sidebar-primary-foreground: oklch(0.985 0 0);
  --sidebar-accent: oklch(0.269 0 0);
  --sidebar-accent-foreground: oklch(0.985 0 0);
  --sidebar-border: oklch(1 0 0 / 10%);
  --sidebar-ring: oklch(0.556 0 0);
}

/* Base Styles */
@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

**Why OKLCH Color Space?**
- Perceptually uniform (equal lightness values look equally light)
- More vibrant colors than HSL/RGB
- Better for programmatic color manipulation
- Wider color gamut support
- Format: `oklch(lightness chroma hue [/ alpha])`
  - Lightness: 0-1 (0 = black, 1 = white)
  - Chroma: 0-0.4 typically (saturation)
  - Hue: 0-360 degrees

**Border and Outline Defaults:**
- `border-border` - All borders use theme color
- `outline-ring/50` - Consistent focus outlines at 50% opacity

### 4.2 Font Loading

Update `src/app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import { Providers } from "@/components/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Your App Name",
  description: "Your app description",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

**Key Attributes:**
- `suppressHydrationWarning` - Prevents warning from theme script
- `font-sans` - Uses Inter font from globals.css
- `antialiased` - Smooth font rendering

### 4.3 Theme Provider Setup

Create `src/components/providers.tsx`:

```tsx
"use client";

import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      {children}
      <Toaster position="bottom-right" />
    </ThemeProvider>
  );
}
```

**Configuration:**
- `attribute="class"` - Toggles `.dark` class on `<html>`
- `defaultTheme="dark"` - Dark mode by default
- `enableSystem` - Respects system preference
- `disableTransitionOnChange` - Prevents flash of unstyled content
- `<Toaster>` - Global toast notifications (Sonner library)

### 4.4 Utility Functions

Create `src/lib/utils.ts`:

```typescript
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

**Usage:**
```tsx
<div className={cn(
  "base-classes",
  condition && "conditional-classes",
  className // from props
)} />
```

**Why `cn()`?**
- `clsx` - Conditional class names
- `twMerge` - Resolves Tailwind class conflicts (later classes win)
- Example: `cn("p-4", "p-2")` → `"p-2"` (not "p-4 p-2")

---

## 5. Design System Tokens

### 5.1 Color Usage Patterns

**Semantic Colors (Use these in components):**
```tsx
// Backgrounds
bg-background      // Main app background
bg-card            // Card/surface backgrounds
bg-popover         // Floating elements (menus, tooltips)

// Text
text-foreground    // Primary text
text-muted-foreground  // Secondary/helper text

// Interactive Elements
bg-primary         // Primary actions (CTAs)
bg-secondary       // Secondary actions
bg-accent          // Hover states, highlights
bg-destructive     // Dangerous actions (delete, cancel)

// Borders & Inputs
border-border      // Default borders
bg-input          // Input field backgrounds
ring-ring         // Focus rings
```

**Direct Tailwind Colors (For specific use cases):**
```tsx
// Status indicators
bg-green-500      // Success/completed
bg-yellow-500     // Warning/in-progress
bg-red-500        // Error/blocked
bg-blue-500       // Info/active

// Gray scale (dark mode)
bg-gray-950       // Darkest
bg-gray-900       // Very dark
bg-gray-800       // Dark
bg-gray-700       // Medium dark
bg-gray-600       // Medium
text-gray-400     // Light text
text-gray-300     // Lighter text
```

**Gradient Patterns:**
```tsx
// Brand gradient (logo backgrounds)
className="bg-gradient-to-r from-blue-500 to-purple-600"

// Text gradients
className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent"

// Status gradients
className="bg-gradient-to-r from-purple-500 to-green-500" // Approval
className="bg-gradient-to-r from-purple-500 to-orange-500" // Review
className="bg-gradient-to-r from-purple-500 to-blue-500" // Comments
```

### 5.2 Typography Scale

**Font Sizes:**
```css
text-xs    → 12px (0.75rem)   /* Labels, metadata */
text-sm    → 14px (0.875rem)  /* Body text, descriptions */
text-base  → 16px (1rem)      /* Default body */
text-lg    → 18px (1.125rem)  /* Emphasized text */
text-xl    → 20px (1.25rem)   /* Headings */
text-2xl   → 24px (1.5rem)    /* Large headings */
```

**Font Weights:**
```css
font-normal   → 400  /* Body text */
font-medium   → 500  /* Emphasized text */
font-semibold → 600  /* Headings */
font-bold     → 700  /* Strong emphasis */
```

**Common Combinations:**
```tsx
// Page title
<h1 className="text-2xl font-bold text-white">

// Section heading
<h2 className="text-xl font-semibold text-white">

// Card title
<h3 className="text-base font-medium text-white">

// Body text
<p className="text-sm text-gray-300">

// Helper text
<span className="text-xs text-gray-400">

// Metadata
<span className="text-xs text-gray-500">
```

### 5.3 Spacing Scale

**Gap (Flexbox/Grid spacing):**
```tsx
gap-1   → 4px    // Tight
gap-2   → 8px    // Compact
gap-3   → 12px   // Default
gap-4   → 16px   // Comfortable (most common)
gap-6   → 24px   // Spacious
gap-8   → 32px   // Very spacious
```

**Padding:**
```tsx
p-2   → 8px     // Minimal (badges, icons)
p-3   → 12px    // Compact
p-4   → 16px    // Default (cards, buttons)
p-6   → 24px    // Comfortable (cards, sections)
p-8   → 32px    // Spacious (page containers)
```

**Common Patterns:**
```tsx
// Card
<div className="p-6 gap-4">

// Button
<button className="px-4 py-2">

// Icon button
<button className="p-2">

// Page container
<div className="px-6 py-8">
```

### 5.4 Border Radius

**Scale:**
```css
rounded-none → 0px
rounded-sm   → calc(0.625rem - 4px) = 6px
rounded-md   → calc(0.625rem - 2px) = 8px
rounded-lg   → 0.625rem = 10px (BASE)
rounded-xl   → calc(0.625rem + 4px) = 14px
rounded-2xl  → calc(0.625rem + 8px) = 18px
rounded-3xl  → calc(0.625rem + 12px) = 22px
rounded-4xl  → calc(0.625rem + 16px) = 26px
rounded-full → 9999px (circles, pills)
```

**Usage:**
```tsx
rounded-md   // Buttons, inputs, small components
rounded-lg   // Default radius
rounded-xl   // Cards, modals
rounded-full // Avatars, badges, pills
```

### 5.5 Shadows & Elevation

**Shadow Scale:**
```css
shadow-xs  // Subtle (1px offset)
shadow-sm  // Small (2px offset)
shadow     // Default (4px offset)
shadow-md  // Medium (6px offset)
shadow-lg  // Large (10px offset)
shadow-xl  // Extra large (20px offset)
```

**Usage Patterns:**
```tsx
// Cards
className="shadow-sm"

// Hover state
className="hover:shadow-lg hover:shadow-black/20"

// Modals/dialogs
className="shadow-xl"

// Dropdowns
className="shadow-md"
```

### 5.6 Transitions & Animations

**Transition Utilities:**
```css
transition-all      // All properties
transition-colors   // Only colors
transition-opacity  // Only opacity
transition-transform // Only transforms

duration-150  → 150ms  // Quick
duration-200  → 200ms  // Default
duration-300  → 300ms  // Moderate
duration-500  → 500ms  // Slow
duration-1000 → 1000ms // Very slow

ease-in       // Accelerating
ease-out      // Decelerating
ease-in-out   // Smooth both ends
```

**Common Patterns:**
```tsx
// Default transition
className="transition-all duration-200"

// Hover state
className="transition-colors hover:bg-accent"

// Focus state
className="transition-all focus-visible:ring-[3px]"
```

### 5.7 Z-Index Hierarchy

```css
z-0   → Header/navigation backgrounds
z-10  → Dropdowns, popovers
z-20  → Sticky elements
z-30  → Tooltips
z-40  → Modal overlays
z-50  → Modals
z-50+ → Toast notifications (highest)
```

---

## 6. Base Component Library

### 6.1 Installing shadcn/ui Components

**Method 1: Individual Components**
```bash
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add dialog
npx shadcn@latest add badge
# ... etc
```

**Method 2: Batch Install (DevFlow's set)**
```bash
npx shadcn@latest add avatar badge button card collapsible dialog \
  dropdown-menu input popover progress scroll-area separator skeleton sonner
```

**What Gets Installed:**
- Components in `src/components/ui/`
- Automatically imports required Radix primitives
- TypeScript types included
- Customizable source code (not a black box)

### 6.2 Button Component (CVA Pattern)

**File: `src/components/ui/button.tsx`**

```tsx
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  // Base styles (always applied)
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline: "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
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

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
```

**Usage Examples:**
```tsx
// Default button
<Button>Click me</Button>

// Destructive action
<Button variant="destructive">Delete</Button>

// Icon button
<Button size="icon">
  <TrashIcon className="h-4 w-4" />
</Button>

// Button with icon and text
<Button>
  <PlusIcon className="h-4 w-4" />
  Add Item
</Button>

// As child (polymorphic)
<Button asChild>
  <Link href="/page">Go to page</Link>
</Button>
```

**CVA Pattern Explanation:**
- `cva()` - Class Variance Authority, type-safe variant management
- Base classes always applied
- Variants compose with base
- TypeScript autocomplete for variants
- `data-*` attributes for testing/debugging

### 6.3 Card Component

**File: `src/components/ui/card.tsx`**

```tsx
import * as React from "react"
import { cn } from "@/lib/utils"

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

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("flex flex-col gap-2 px-6", className)}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"h3">) {
  return (
    <h3
      className={cn("text-lg font-semibold leading-none tracking-tight", className)}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("px-6", className)} {...props} />
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("flex items-center gap-3 px-6", className)}
      {...props}
    />
  )
}

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
```

**Usage:**
```tsx
<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description goes here</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Main content...</p>
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

### 6.4 Badge Component

```tsx
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

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

function Badge({ className, variant, ...props }: React.ComponentProps<"div"> & VariantProps<typeof badgeVariants>) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
```

### 6.5 Dialog (Modal) Component

**Usage Pattern:**
```tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

function MyModal() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Open Modal</Button>
      </DialogTrigger>
      <DialogContent className="bg-gray-900 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white">Modal Title</DialogTitle>
          <DialogDescription className="text-gray-400">
            Modal description
          </DialogDescription>
        </DialogHeader>
        {/* Content */}
      </DialogContent>
    </Dialog>
  )
}
```

**Dark Mode Styling:**
```tsx
// Always specify dark mode colors in className
<DialogContent className="bg-gray-900 border-gray-700">
```

### 6.6 Complete Component List

**Installed Components:**
1. **Avatar** - User profile images with fallback
2. **Badge** - Status indicators, labels
3. **Button** - Primary interactive element
4. **Card** - Container for grouped content
5. **Collapsible** - Expandable sections
6. **Dialog** - Modals, confirmations
7. **Dropdown Menu** - Action menus
8. **Input** - Form text inputs
9. **Popover** - Floating content (tooltips, menus)
10. **Progress** - Progress bars
11. **Scroll Area** - Custom scrollbars
12. **Separator** - Visual dividers
13. **Skeleton** - Loading placeholders
14. **Sonner (Toast)** - Notifications

**Adding More:**
```bash
npx shadcn@latest add [component-name]
```

Browse: https://ui.shadcn.com/docs/components

---

## 7. Animation Patterns with Framer Motion

### 7.1 Animation Fundamentals

**Basic Motion Component:**
```tsx
import { motion } from "framer-motion"

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -20 }}
  transition={{ duration: 0.2 }}
>
  Content
</motion.div>
```

**Properties:**
- `initial` - Starting state (before component appears)
- `animate` - Ending state (after animation)
- `exit` - State when component unmounts (requires AnimatePresence)
- `transition` - How to animate between states

### 7.2 Common Animation Recipes

**Recipe 1: Fade In**
```tsx
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.3 }}
>
```

**Recipe 2: Slide Up**
```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
>
```

**Recipe 3: Scale In**
```tsx
<motion.div
  initial={{ scale: 0.8, opacity: 0 }}
  animate={{ scale: 1, opacity: 1 }}
  transition={{ duration: 0.2 }}
>
```

**Recipe 4: Spring Physics**
```tsx
<motion.div
  initial={{ x: -320, opacity: 0 }}
  animate={{ x: 0, opacity: 1 }}
  exit={{ x: -320, opacity: 0 }}
  transition={{ type: "spring", damping: 25, stiffness: 300 }}
>
```

**Spring Parameters:**
- `damping: 25` - How quickly spring settles (higher = faster)
- `stiffness: 300` - How bouncy (higher = more bounce)

### 7.3 Loading Animations

**Bouncing Dots:**
```tsx
<div className="flex gap-1">
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
</div>
```

**Spinner:**
```tsx
<motion.div
  className="w-5 h-5 border-2 border-gray-700 border-t-blue-500 rounded-full"
  animate={{ rotate: 360 }}
  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
/>
```

**Pulse:**
```tsx
<motion.div
  animate={{ scale: [1, 1.1, 1] }}
  transition={{ duration: 2, repeat: Infinity }}
>
```

### 7.4 Interactive Animations

**Hover Scale:**
```tsx
<motion.button
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
  transition={{ type: "spring", stiffness: 400, damping: 17 }}
>
  Click me
</motion.button>
```

**Checkbox Animation:**
```tsx
<button onClick={handleToggle}>
  {isCompleted && (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
    >
      <Check className="h-4 w-4 text-white" />
    </motion.div>
  )}
</button>
```

### 7.5 Progress Bar Animation

```tsx
const [progress, setProgress] = useState(0)

<div className="h-2 bg-gray-700 rounded-full overflow-hidden">
  <motion.div
    initial={{ width: 0 }}
    animate={{ width: `${progress}%` }}
    transition={{ duration: 0.5, ease: "easeOut" }}
    className="h-full bg-green-500 rounded-full"
  />
</div>
```

**Dynamic Color Based on Progress:**
```tsx
function getProgressColor(percent: number) {
  if (percent < 30) return "bg-red-500"
  if (percent < 70) return "bg-yellow-500"
  return "bg-green-500"
}

<motion.div
  animate={{ width: `${progress}%` }}
  className={cn("h-full rounded-full", getProgressColor(progress))}
/>
```

### 7.6 List Animations

**Staggered Children:**
```tsx
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
}

<motion.div variants={container} initial="hidden" animate="show">
  {items.map((item) => (
    <motion.div key={item.id} variants={item}>
      {item.name}
    </motion.div>
  ))}
</motion.div>
```

**Simple Stagger (without variants):**
```tsx
{items.map((item, index) => (
  <motion.div
    key={item.id}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.05 }}
  >
    {item.name}
  </motion.div>
))}
```

### 7.7 AnimatePresence (Enter/Exit)

**Required for exit animations:**
```tsx
import { motion, AnimatePresence } from "framer-motion"

<AnimatePresence>
  {isOpen && (
    <motion.div
      initial={{ x: -320, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -320, opacity: 0 }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
    >
      Sidebar content
    </motion.div>
  )}
</AnimatePresence>
```

**List with exit animations:**
```tsx
<AnimatePresence mode="popLayout">
  {items.map((item) => (
    <motion.div
      key={item.id}
      layout
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.15 }}
    >
      {item.name}
    </motion.div>
  ))}
</AnimatePresence>
```

**mode="popLayout"** - Items don't shift until exit animation completes

### 7.8 Layout Animations

**Automatic layout shift animation:**
```tsx
<motion.div layout>
  {/* Content that changes size/position */}
</motion.div>
```

**Example: Expanding card**
```tsx
const [expanded, setExpanded] = useState(false)

<motion.div layout onClick={() => setExpanded(!expanded)}>
  <h3>Title</h3>
  {expanded && <p>Extra content...</p>}
</motion.div>
```

### 7.9 Celebration Effects

**Confetti (canvas-confetti):**
```tsx
import confetti from "canvas-confetti"

const celebrateCompletion = () => {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    colors: ["#22c55e", "#3b82f6", "#8b5cf6"], // green, blue, purple
  })
}

<Button onClick={celebrateCompletion}>Complete</Button>
```

**Shimmer Effect (100% progress):**
```tsx
{progress === 100 && (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: [0, 1, 0] }}
    transition={{ duration: 2, repeat: Infinity }}
    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
  />
)}
```

### 7.10 Performance Tips

**DO:**
- Animate `transform` and `opacity` (GPU accelerated)
- Use `layout` for size changes
- Set `will-change` for frequently animated elements

**DON'T:**
- Animate `width`, `height`, `top`, `left` directly
- Animate too many elements simultaneously
- Use complex gradients in animated elements

**Optimization:**
```tsx
// Good
<motion.div
  style={{ willChange: "transform" }}
  animate={{ x: 100 }}
>

// Bad (causes reflow)
<motion.div animate={{ width: "100%" }}>
```

---

## 8. Icon System (Lucide React)

### 8.1 Using Lucide Icons

**Import and Use:**
```tsx
import {
  Check,
  X,
  Plus,
  Trash,
  Edit,
  Search,
  Settings,
  User,
  LogOut
} from "lucide-react"

<Button>
  <Plus className="h-4 w-4" />
  Add Item
</Button>
```

**Size Classes:**
```tsx
className="h-3 w-3"  // 12px - Very small (badges)
className="h-4 w-4"  // 16px - Small (buttons, inline)
className="h-5 w-5"  // 20px - Medium (default)
className="h-6 w-6"  // 24px - Large (headings)
className="h-8 w-8"  // 32px - Extra large (hero)
```

### 8.2 Icon Mapping Pattern

**Create icon maps for dynamic rendering:**
```tsx
import {
  Code,
  FlaskConical,
  Play,
  GitCommit,
  GitPullRequest,
  GitBranch,
  Users,
  MessageSquare,
  CheckCircle,
  GitMerge,
  Rocket,
  CheckSquare,
  Circle,
} from "lucide-react"

const STEP_ICONS: Record<StepType, React.ElementType> = {
  CREATE_BRANCH: GitBranch,
  CODE: Code,
  TEST: FlaskConical,
  RUN_TESTS: Play,
  COMMIT: GitCommit,
  CREATE_PR: GitPullRequest,
  REQUEST_REVIEW: Users,
  ADDRESS_COMMENTS: MessageSquare,
  GET_APPROVAL: CheckCircle,
  MERGE: GitMerge,
  DEPLOY: Rocket,
  CLOSE_ISSUE: CheckSquare,
  CUSTOM: Circle,
}

// Usage
const Icon = STEP_ICONS[step.type]
<Icon className="h-5 w-5 text-white" />
```

### 8.3 Icon Color Patterns

```tsx
// Semantic colors
text-white          // Primary (dark backgrounds)
text-gray-400       // Secondary/muted
text-blue-400       // Info/primary actions
text-green-400      // Success
text-yellow-400     // Warning
text-red-400        // Error/destructive
text-purple-400     // Special/featured
```

### 8.4 Icon in Colored Backgrounds

```tsx
<div className="p-2 rounded-lg bg-blue-600">
  <Icon className="h-5 w-5 text-white" />
</div>

<div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600">
  <Icon className="h-5 w-5 text-white" />
</div>
```

### 8.5 Common Icon Sets

**Navigation:**
```tsx
Home, Search, Settings, Bell, User, Menu, X
```

**Actions:**
```tsx
Plus, Edit, Trash, Check, X, Save, Download, Upload
```

**Git/Development:**
```tsx
GitBranch, GitCommit, GitPullRequest, GitMerge, Code, Terminal
```

**Status:**
```tsx
CheckCircle, XCircle, AlertCircle, Info, HelpCircle
```

**Communication:**
```tsx
MessageSquare, Mail, Send, Users, UserPlus
```

Browse all: https://lucide.dev/icons/

---

## 9. Advanced Component Patterns

### 9.1 Polymorphic Components (asChild)

**Pattern:**
```tsx
import { Slot } from "@radix-ui/react-slot"

function Button({ asChild, ...props }) {
  const Comp = asChild ? Slot : "button"
  return <Comp {...props} />
}
```

**Usage:**
```tsx
// Regular button
<Button onClick={handler}>Click</Button>

// As link (maintains button styles)
<Button asChild>
  <Link href="/page">Go to page</Link>
</Button>

// As Next.js Link
<Button asChild>
  <NextLink href="/page">Navigate</NextLink>
</Button>
```

**Why?**
- Reuse component styles with different underlying elements
- Better semantics (actual `<a>` for navigation)
- Maintains accessibility

### 9.2 Composition Pattern

**Instead of:**
```tsx
// BAD: Props explosion
<Card
  title="Title"
  description="Desc"
  footer={<Button>Action</Button>}
  headerClass="custom"
/>
```

**Do:**
```tsx
// GOOD: Composable components
<Card>
  <CardHeader className="custom">
    <CardTitle>Title</CardTitle>
    <CardDescription>Desc</CardDescription>
  </CardHeader>
  <CardContent>...</CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

**Benefits:**
- More flexible
- Easier to customize
- Better TypeScript inference
- Follows React composition model

### 9.3 Data Attributes for Styling

**Pattern:**
```tsx
<div data-status="completed" className="...">
```

**CSS:**
```css
[data-status="completed"] {
  /* styles */
}
```

**Tailwind (with plugin):**
```tsx
className="data-[status=completed]:bg-green-500"
```

**Example from DevFlow:**
```tsx
<Button
  data-slot="button"
  data-variant={variant}
  data-size={size}
>
```

**Usage:**
- Testing selectors (`[data-testid="submit-button"]`)
- Conditional styling without className logic
- State representation

### 9.4 Controlled vs Uncontrolled

**Controlled (React state):**
```tsx
const [open, setOpen] = useState(false)

<Dialog open={open} onOpenChange={setOpen}>
  <DialogTrigger>Open</DialogTrigger>
  <DialogContent>...</DialogContent>
</Dialog>
```

**Uncontrolled (component state):**
```tsx
<Dialog>
  <DialogTrigger>Open</DialogTrigger>
  <DialogContent>...</DialogContent>
</Dialog>
```

**When to use each:**
- Controlled: Need to programmatically open/close, track state
- Uncontrolled: Simple use cases, less boilerplate

### 9.5 Accessibility Patterns

**Screen Reader Only Text:**
```tsx
<span className="sr-only">Loading...</span>
<Spinner aria-hidden="true" />
```

**ARIA Labels:**
```tsx
<button aria-label="Close dialog">
  <X className="h-4 w-4" />
</button>
```

**Focus Management:**
```tsx
const buttonRef = useRef<HTMLButtonElement>(null)

useEffect(() => {
  if (isOpen) {
    buttonRef.current?.focus()
  }
}, [isOpen])

<button ref={buttonRef}>...</button>
```

**Keyboard Navigation:**
```tsx
<div
  role="button"
  tabIndex={0}
  onKeyDown={(e) => {
    if (e.key === "Enter" || e.key === " ") {
      handleClick()
    }
  }}
>
```

### 9.6 Custom Hooks for UI State

**useToggle:**
```tsx
function useToggle(initial = false) {
  const [state, setState] = useState(initial)
  const toggle = () => setState((s) => !s)
  return [state, toggle] as const
}

// Usage
const [isOpen, toggleOpen] = useToggle()
<Button onClick={toggleOpen}>Toggle</Button>
```

**useDisclosure:**
```tsx
function useDisclosure(initial = false) {
  const [isOpen, setIsOpen] = useState(initial)
  const open = () => setIsOpen(true)
  const close = () => setIsOpen(false)
  const toggle = () => setIsOpen((s) => !s)
  return { isOpen, open, close, toggle }
}

// Usage
const dialog = useDisclosure()
<Button onClick={dialog.open}>Open</Button>
<Dialog open={dialog.isOpen} onOpenChange={dialog.close}>
```

### 9.7 Responsive Patterns

**Mobile-First Breakpoints:**
```tsx
// Tailwind breakpoints
sm:  640px   // Small tablets
md:  768px   // Tablets
lg:  1024px  // Small laptops
xl:  1280px  // Laptops
2xl: 1536px  // Large screens
```

**Usage:**
```tsx
<div className="
  flex-col gap-2        // Mobile: vertical stack, small gap
  md:flex-row md:gap-4  // Tablet+: horizontal, larger gap
  xl:gap-6              // Desktop: even larger gap
">
```

**Responsive Card:**
```tsx
<Card className="
  p-4              // Mobile padding
  md:p-6           // Tablet padding
  flex flex-col    // Mobile: vertical
  xl:flex-row      // Desktop: horizontal
  gap-4 xl:gap-6   // Responsive gap
">
```

**Hide/Show by Breakpoint:**
```tsx
<div className="hidden md:block">Desktop only</div>
<div className="block md:hidden">Mobile only</div>
```

---

## 10. Real-World Component Examples

### 10.1 Complete Step Item Component

**Features:**
- Checkbox with spring animation
- Status-based colors
- Icon mapping
- Progress indicator
- Multiple dialog types

```tsx
"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { Check, Circle } from "lucide-react"
import { cn } from "@/lib/utils"

interface StepItemProps {
  step: {
    id: string
    name: string
    status: "PENDING" | "IN_PROGRESS" | "COMPLETED"
    description?: string
  }
  stepNumber: number
  isLast: boolean
  onToggle: (id: string) => void
}

const STATUS_COLORS = {
  PENDING: "bg-gray-700 text-gray-400",
  IN_PROGRESS: "bg-blue-900 text-blue-400 border-blue-500",
  COMPLETED: "bg-green-900 text-green-400 border-green-500",
}

export function StepItem({ step, stepNumber, isLast, onToggle }: StepItemProps) {
  const isCompleted = step.status === "COMPLETED"
  const isInProgress = step.status === "IN_PROGRESS"

  return (
    <div className="flex gap-4">
      {/* Vertical Progress Line */}
      <div className="flex flex-col items-center">
        {/* Step Number Circle */}
        <div
          className={cn(
            "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all",
            isCompleted
              ? "bg-green-500 text-white"
              : isInProgress
              ? "bg-blue-500 text-white ring-2 ring-blue-400 ring-offset-2 ring-offset-gray-900"
              : "bg-gray-700 text-gray-400"
          )}
        >
          {isCompleted ? <Check className="h-4 w-4" /> : stepNumber}
        </div>

        {/* Connecting Line */}
        {!isLast && (
          <div
            className={cn(
              "w-0.5 flex-1 min-h-[24px] mt-2",
              isCompleted ? "bg-green-500" : "bg-gray-700"
            )}
          />
        )}
      </div>

      {/* Main Content */}
      <motion.div
        layout
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className={cn(
          "flex-1 flex items-center gap-4 p-4 rounded-lg border transition-all mb-3",
          isCompleted
            ? "bg-green-950/30 border-green-800"
            : isInProgress
            ? "bg-blue-950/30 border-blue-700"
            : "bg-gray-800/50 border-gray-700 hover:border-gray-600"
        )}
      >
        {/* Checkbox */}
        <button
          onClick={() => onToggle(step.id)}
          className={cn(
            "flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
            isCompleted
              ? "bg-green-500 border-green-500"
              : "border-gray-600 hover:border-gray-400"
          )}
        >
          {isCompleted && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            >
              <Check className="h-4 w-4 text-white" />
            </motion.div>
          )}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4
              className={cn(
                "font-medium",
                isCompleted ? "text-green-300 line-through" : "text-white"
              )}
            >
              {step.name}
            </h4>
            <Badge variant="outline" className={STATUS_COLORS[step.status]}>
              {step.status.toLowerCase()}
            </Badge>
          </div>
          {step.description && (
            <p className="text-sm text-gray-500 mt-1">{step.description}</p>
          )}
        </div>
      </motion.div>
    </div>
  )
}
```

### 10.2 Progress Card with Animation

```tsx
"use client"

import { motion } from "framer-motion"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

function getProgressColor(percent: number) {
  if (percent < 30) return "bg-red-500"
  if (percent < 70) return "bg-yellow-500"
  return "bg-green-500"
}

export function ProgressCard({
  title,
  completed,
  total
}: {
  title: string
  completed: number
  total: number
}) {
  const percentage = Math.round((completed / total) * 100)

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Stats */}
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-gray-400">Progress</span>
          <span className="font-medium text-white">{percentage}%</span>
        </div>

        {/* Progress Bar */}
        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className={cn("h-full rounded-full", getProgressColor(percentage))}
          />
        </div>

        {/* Count */}
        <p className="text-xs text-gray-400 mt-2">
          {completed} / {total} completed
        </p>
      </CardContent>
    </Card>
  )
}
```

### 10.3 Header with Theme Toggle

```tsx
"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
    >
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
```

### 10.4 Loading States

**Spinner:**
```tsx
export function Spinner({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "w-4 h-4 border-2",
    md: "w-6 h-6 border-2",
    lg: "w-8 h-8 border-3",
  }

  return (
    <div
      className={cn(
        "border-gray-700 border-t-blue-500 rounded-full animate-spin",
        sizeClasses[size]
      )}
    />
  )
}
```

**Skeleton:**
```tsx
import { Skeleton } from "@/components/ui/skeleton"

export function CardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-4 w-2/3 mt-2" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-20 w-full" />
      </CardContent>
    </Card>
  )
}
```

**Loading Dots:**
```tsx
export function LoadingDots() {
  return (
    <div className="flex gap-1">
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
    </div>
  )
}
```

### 10.5 Toast Notifications

```tsx
import { toast } from "sonner"

// Success
toast.success("Item saved successfully")

// Error
toast.error("Failed to save item")

// Info
toast.info("Processing your request...")

// Custom
toast("Custom message", {
  description: "Additional details here",
  action: {
    label: "Undo",
    onClick: () => console.log("Undo"),
  },
})

// Promise (auto-resolves)
toast.promise(
  saveItem(),
  {
    loading: "Saving...",
    success: "Saved!",
    error: "Failed to save",
  }
)
```

---

## 11. Common Patterns & Anti-Patterns

### 11.1 DO: Use Semantic Color Tokens

**Good:**
```tsx
<div className="bg-card text-card-foreground border-border">
```

**Bad:**
```tsx
<div className="bg-gray-900 text-white border-gray-800">
```

**Why?** Theme tokens adapt to light/dark mode automatically.

### 11.2 DO: Compose with cn()

**Good:**
```tsx
<Button className={cn("w-full", isLoading && "opacity-50")} />
```

**Bad:**
```tsx
<Button className={`w-full ${isLoading ? "opacity-50" : ""}`} />
```

**Why?** cn() handles Tailwind conflicts and conditional logic cleanly.

### 11.3 DON'T: Hardcode Dark Mode Classes

**Bad:**
```tsx
<div className="bg-gray-900 dark:bg-gray-800">
```

**Good:**
```tsx
<div className="bg-card">
```

**Why?** Use theme tokens; only add dark: variants for specific overrides.

### 11.4 DO: Extract Color Maps

**Good:**
```tsx
const STATUS_COLORS: Record<Status, string> = {
  PENDING: "bg-gray-700 text-gray-400",
  COMPLETED: "bg-green-900 text-green-400",
  ERROR: "bg-red-900 text-red-400",
}

<Badge className={STATUS_COLORS[status]} />
```

**Bad:**
```tsx
<Badge className={
  status === "PENDING" ? "bg-gray-700 text-gray-400" :
  status === "COMPLETED" ? "bg-green-900 text-green-400" :
  "bg-red-900 text-red-400"
} />
```

### 11.5 DO: Use Data Attributes for State

**Good:**
```tsx
<div data-status={status} className="data-[status=active]:bg-blue-500">
```

**Bad:**
```tsx
<div className={status === "active" ? "bg-blue-500" : ""}>
```

**Why?** Cleaner for multiple states, better for testing.

### 11.6 DON'T: Animate Layout Properties

**Bad:**
```tsx
<motion.div animate={{ width: "100%" }}>
```

**Good:**
```tsx
<motion.div animate={{ scaleX: 1 }} style={{ transformOrigin: "left" }}>
```

**Why?** Transform properties are GPU-accelerated.

### 11.7 DO: Use AnimatePresence for Exits

**Bad:**
```tsx
{isOpen && <motion.div exit={{ opacity: 0 }}>}
```

**Good:**
```tsx
<AnimatePresence>
  {isOpen && <motion.div exit={{ opacity: 0 }}>}
</AnimatePresence>
```

**Why?** Without AnimatePresence, exit animations don't run.

### 11.8 DO: Memoize Icon Maps

**Good:**
```tsx
const ICONS: Record<Type, React.ElementType> = {
  CODE: Code,
  TEST: FlaskConical,
}

const Icon = ICONS[type]
<Icon className="h-5 w-5" />
```

**Bad:**
```tsx
{type === "CODE" && <Code />}
{type === "TEST" && <FlaskConical />}
```

### 11.9 DON'T: Nest cn() Calls

**Bad:**
```tsx
cn("base", cn("conditional", className))
```

**Good:**
```tsx
cn("base", "conditional", className)
```

**Why?** cn() already merges all arguments.

### 11.10 DO: Use Controlled Components for Complex State

**When to control:**
- Programmatic open/close needed
- State affects other components
- Need to validate before state change

**When to leave uncontrolled:**
- Simple toggles
- No external state dependencies
- Less boilerplate needed

---

## 12. Replication Checklist

Use this checklist when building a new app with this design system:

### Phase 1: Setup (15 min)
- [ ] Initialize Next.js project (npx create-next-app@latest)
- [ ] Install all dependencies (Section 2)
- [ ] Configure tsconfig.json with path aliases
- [ ] Create postcss.config.mjs
- [ ] Create components.json for shadcn/ui

### Phase 2: Styling Foundation (20 min)
- [ ] Create src/app/globals.css with full OKLCH theme
- [ ] Update src/app/layout.tsx with font imports
- [ ] Create src/components/providers.tsx
- [ ] Create src/lib/utils.ts with cn() function
- [ ] Test dark/light theme toggle

### Phase 3: Base Components (30 min)
- [ ] Install shadcn/ui components (button, card, dialog, etc.)
- [ ] Verify all components render correctly
- [ ] Test theme switching on all components
- [ ] Customize component defaults if needed

### Phase 4: Layout (20 min)
- [ ] Create Header component
- [ ] Create Sidebar/Navigation (if needed)
- [ ] Set up page layout structure
- [ ] Add ThemeToggle component

### Phase 5: Custom Components (variable)
- [ ] Build custom components following composition pattern
- [ ] Add Framer Motion animations where appropriate
- [ ] Implement loading states (skeletons, spinners)
- [ ] Add toast notifications

### Phase 6: Testing & Refinement
- [ ] Test all interactive states (hover, focus, active)
- [ ] Verify accessibility (keyboard nav, screen readers)
- [ ] Test responsive breakpoints
- [ ] Optimize animations for performance
- [ ] Add error states and edge cases

### Verification Steps:
1. **Color System**: Toggle dark/light mode - all colors should adapt
2. **Typography**: All text should use Inter font, proper weights
3. **Spacing**: Consistent gaps and padding throughout
4. **Animations**: Smooth, no jank, appropriate timing
5. **Accessibility**: All interactive elements keyboard accessible
6. **Icons**: Lucide icons load, proper sizing
7. **Responsive**: Works on mobile, tablet, desktop

### Quick Test Page:
```tsx
// Test page
export default function TestPage() {
  return (
    <div className="p-8 space-y-8">
      {/* Test theme colors */}
      <Card>
        <CardHeader>
          <CardTitle>Theme Test</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="bg-background p-4">Background</div>
            <div className="bg-card p-4">Card</div>
            <div className="bg-primary p-4">Primary</div>
            <div className="bg-destructive p-4">Destructive</div>
          </div>
        </CardContent>
      </Card>

      {/* Test buttons */}
      <Card>
        <CardHeader>
          <CardTitle>Button Variants</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button variant="default">Default</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
          <Button size="icon"><Plus /></Button>
        </CardContent>
      </Card>

      {/* Test animations */}
      <Card>
        <CardHeader>
          <CardTitle>Animations</CardTitle>
        </CardHeader>
        <CardContent>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-blue-500 p-4 rounded"
          >
            Animated Element
          </motion.div>
        </CardContent>
      </Card>
    </div>
  )
}
```

---

## 13. Troubleshooting Guide

### Issue: Theme not switching

**Symptoms:** Dark mode toggle doesn't work

**Solutions:**
1. Check `suppressHydrationWarning` on `<html>`
2. Verify ThemeProvider wraps app
3. Ensure globals.css has `.dark` class definitions
4. Check browser console for theme errors

### Issue: Tailwind classes not applying

**Symptoms:** Colors, spacing don't work

**Solutions:**
1. Verify PostCSS config exists
2. Check globals.css imports `@import "tailwindcss"`
3. Restart dev server
4. Clear `.next` cache

### Issue: Icons not showing

**Symptoms:** Missing icons, broken imports

**Solutions:**
1. Verify `lucide-react` installed
2. Check icon name spelling (case-sensitive)
3. Import from correct path: `from "lucide-react"`

### Issue: Animations not smooth

**Symptoms:** Janky animations, layout shift

**Solutions:**
1. Animate `transform` not `width/height`
2. Add `will-change: transform` for frequently animated
3. Use `layout` prop for size changes
4. Reduce number of simultaneous animations

### Issue: cn() conflicts

**Symptoms:** Wrong classes applied

**Solutions:**
1. Order matters: later classes win
2. Don't nest cn() calls
3. Check for typos in class names

### Issue: Dark mode colors wrong

**Symptoms:** Elements too bright/dark

**Solutions:**
1. Use semantic tokens (`bg-card` not `bg-gray-900`)
2. Check OKLCH values in globals.css
3. Test with theme toggle

### Issue: shadcn components error

**Symptoms:** Import errors, missing components

**Solutions:**
1. Run `npx shadcn@latest add [component]`
2. Check components.json aliases
3. Verify Radix dependencies installed
4. Ensure utils.ts exists with cn() function

---

## 14. Additional Resources

### Official Documentation
- **Tailwind CSS v4**: https://tailwindcss.com/docs
- **shadcn/ui**: https://ui.shadcn.com
- **Framer Motion**: https://www.framer.com/motion
- **Radix UI**: https://www.radix-ui.com
- **Lucide Icons**: https://lucide.dev
- **Next.js**: https://nextjs.org/docs
- **next-themes**: https://github.com/pacocoursey/next-themes

### Color Tools
- **OKLCH Color Picker**: https://oklch.com
- **Tailwind Shades**: https://www.tails-ui.com/

### Learning Resources
- **CVA Documentation**: https://cva.style
- **Framer Motion Tutorial**: https://www.framer.com/motion/introduction/

### DevFlow Source
- View complete implementation examples in DevFlow repository
- All patterns in this document are production-tested

---

## Appendix: Complete File Structure

```
your-project/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout with Providers
│   │   ├── globals.css         # Tailwind + theme tokens
│   │   └── page.tsx            # Home page
│   ├── components/
│   │   ├── ui/                 # shadcn components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── badge.tsx
│   │   │   └── ...
│   │   ├── layout/             # Layout components
│   │   │   ├── header.tsx
│   │   │   ├── sidebar.tsx
│   │   │   └── theme-toggle.tsx
│   │   ├── providers.tsx       # Client providers
│   │   └── [feature]/          # Feature components
│   └── lib/
│       └── utils.ts            # cn() and utilities
├── public/                     # Static assets
├── components.json             # shadcn config
├── postcss.config.mjs          # PostCSS config
├── tsconfig.json               # TypeScript config
└── package.json                # Dependencies
```

---

**END OF DOCUMENT**

This guide provides everything needed to replicate the DevFlow design system in a new Next.js project. All code snippets are production-tested and ready to use.
