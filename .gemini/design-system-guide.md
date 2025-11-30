# Design System Guide - Jarvis Expense Tracker

## Overview
This design system ensures visual consistency, accessibility, and a premium user experience across the Jarvis Expense Tracker application.

---

## 🎨 Color Palette

### Background Colors
- **Primary Background**: `#0F172A` (Slate 900) - Main app background
- **Secondary Background**: `#1E293B` (Slate 800) - Cards and elevated surfaces
- **Tertiary Background**: `#334155` (Slate 700) - Hover states

### Text Colors
- **Primary Text**: `#F8FAFC` (Slate 50) - Main content
- **Secondary Text**: `#CBD5E1` (Slate 300) - Supporting text
- **Tertiary Text**: `#94A3B8` (Slate 400) - Muted text
- **Disabled Text**: `#64748B` (Slate 500) - Inactive elements

### Brand Gradients

#### Budgets (Blue)
```css
background: linear-gradient(to right, #3B82F6, #2563EB);
```
Use for: Budget page, financial planning features

#### Transactions (Violet)
```css
background: linear-gradient(to right, #8B5CF6, #7C3AED);
```
Use for: Transaction history, expense tracking

#### Jarvis AI (Cyan)
```css
background: linear-gradient(to right, #06B6D4, #0891B2);
```
Use for: AI features, chat interface

#### Analytics (Pink)
```css
background: linear-gradient(to right, #EC4899, #DB2777);
```
Use for: Charts, insights, overview

### Semantic Colors

#### Success (Green)
- Background: `#10B981`
- Light: `#D1FAE5`
- Text: `#059669`
- Use for: Positive actions, confirmations, under-budget

#### Warning (Amber)
- Background: `#F59E0B`
- Light: `#FEF3C7`
- Text: `#D97706`
- Use for: Cautions, 75-90% budget usage

#### Error (Red)
- Background: `#EF4444`
- Light: `#FEE2E2`
- Text: `#DC2626`
- Use for: Errors, deletions, over-budget

#### Info (Blue)
- Background: `#3B82F6`
- Light: `#DBEAFE`
- Text: `#2563EB`
- Use for: Information, tips, neutral notifications

---

## 📝 Typography

### Font Family
- **Sans-serif**: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`
- **Monospace**: `"SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace`

### Font Sizes
- **xs**: 12px - Small labels, captions
- **sm**: 14px - Secondary text, buttons
- **base**: 16px - Body text
- **lg**: 18px - Subheadings
- **xl**: 20px - Section titles
- **2xl**: 24px - Page headers
- **3xl**: 30px - Large numbers, stats
- **4xl**: 36px - Hero text

### Font Weights
- **Normal**: 400 - Body text
- **Medium**: 500 - Emphasized text
- **Semibold**: 600 - Buttons, labels
- **Bold**: 700 - Headings, important numbers

---

## 📏 Spacing Scale

Use consistent spacing throughout:
- **xs**: 4px - Tight spacing
- **sm**: 8px - Compact spacing
- **md**: 16px - Default spacing
- **lg**: 24px - Comfortable spacing
- **xl**: 32px - Generous spacing
- **2xl**: 48px - Section spacing
- **3xl**: 64px - Large gaps

---

## 🔲 Border Radius

- **sm**: 6px - Small elements (badges, chips)
- **md**: 8px - Buttons, inputs
- **lg**: 12px - Cards, containers
- **xl**: 16px - Large cards
- **2xl**: 24px - Modals, sheets
- **full**: 9999px - Pills, circular buttons

---

## 🌟 Component Styles

### Buttons

#### Primary Button
```tsx
<button className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-semibold px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-300">
  Primary Action
</button>
```

#### Secondary Button
```tsx
<button className="bg-slate-700 hover:bg-slate-600 text-white font-medium px-4 py-2 rounded-lg border border-slate-600 transition-all duration-300">
  Secondary Action
</button>
```

#### Ghost Button
```tsx
<button className="bg-transparent hover:bg-slate-800 text-slate-300 hover:text-white px-4 py-2 rounded-lg transition-all duration-300">
  Ghost Action
</button>
```

#### Icon Button
```tsx
<button className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-all duration-300">
  <IconComponent />
</button>
```

#### Danger Button
```tsx
<button className="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white font-semibold px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-300">
  Delete
</button>
```

### Cards

#### Default Card
```tsx
<div className="bg-slate-800 rounded-xl p-4 border border-slate-700 shadow-md">
  Card Content
</div>
```

#### Interactive Card
```tsx
<div className="bg-slate-800 rounded-xl p-4 border border-slate-700 shadow-md hover:shadow-lg hover:border-slate-600 cursor-pointer transition-all duration-300 active:scale-[0.98]">
  Clickable Card
</div>
```

#### Glass Card (Glassmorphism)
```tsx
<div className="bg-white/5 backdrop-blur-lg rounded-xl p-4 border border-white/10 shadow-lg">
  Glass Effect Card
</div>
```

#### Gradient Card
```tsx
<div className="bg-gradient-to-br from-blue-900/40 to-blue-800/20 rounded-xl p-4 border border-blue-700/30 shadow-lg">
  Gradient Card
</div>
```

### Inputs

#### Default Input
```tsx
<input 
  type="text"
  className="w-full bg-slate-900 text-white border border-slate-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 placeholder:text-slate-500"
  placeholder="Enter text..."
/>
```

#### Error Input
```tsx
<input 
  type="text"
  className="w-full bg-slate-900 text-white border-2 border-red-500 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-300"
  placeholder="Invalid input"
/>
```

### Badges

#### Default Badge
```tsx
<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-700 text-slate-200">
  Default
</span>
```

#### Success Badge
```tsx
<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-900/30 text-green-400 border border-green-500/30">
  Success
</span>
```

#### Warning Badge
```tsx
<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-900/30 text-amber-400 border border-amber-500/30">
  Warning
</span>
```

#### Error Badge
```tsx
<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-900/30 text-red-400 border border-red-500/30">
  Error
</span>
```

### Modals

#### Modal Overlay
```tsx
<div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
  {/* Modal Content */}
</div>
```

#### Modal Content
```tsx
<div className="bg-slate-800 rounded-2xl w-full max-w-md p-6 border border-slate-700 shadow-2xl animate-in zoom-in-95 duration-300">
  Modal Content
</div>
```

---

## 🎭 Animations

### Duration
- **Fast**: 150ms - Micro-interactions
- **Normal**: 300ms - Standard transitions
- **Slow**: 500ms - Complex animations

### Easing Functions
- **Default**: `cubic-bezier(0.4, 0, 0.2, 1)` - Standard ease
- **In**: `cubic-bezier(0.4, 0, 1, 1)` - Ease in
- **Out**: `cubic-bezier(0, 0, 0.2, 1)` - Ease out
- **Spring**: `cubic-bezier(0.34, 1.56, 0.64, 1)` - Bouncy effect

### Common Animations

#### Hover Scale
```css
transition: transform 300ms cubic-bezier(0.4, 0, 0.2, 1);
&:hover {
  transform: scale(1.05);
}
&:active {
  transform: scale(0.98);
}
```

#### Fade In
```css
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
animation: fadeIn 300ms ease-out;
```

#### Slide Up
```css
@keyframes slideUp {
  from { 
    opacity: 0;
    transform: translateY(10px);
  }
  to { 
    opacity: 1;
    transform: translateY(0);
  }
}
animation: slideUp 300ms ease-out;
```

---

## ♿ Accessibility Guidelines

### Touch Targets
- Minimum size: **44x44px** for all interactive elements
- Add padding to small icons to meet minimum size

### Color Contrast
- Text on background: Minimum **4.5:1** ratio (WCAG AA)
- Large text (18px+): Minimum **3:1** ratio

### Focus States
- Always show visible focus indicators
- Use `focus:ring-2 focus:ring-blue-500` for keyboard navigation

### ARIA Labels
- Add `aria-label` to icon-only buttons
- Use semantic HTML (`<nav>`, `<main>`, `<article>`)
- Add `role` attributes where needed

---

## 📱 Mobile-First Principles

### Responsive Breakpoints
- **sm**: 640px
- **md**: 768px
- **lg**: 1024px
- **xl**: 1280px
- **2xl**: 1536px

### Mobile Optimizations
- Use bottom sheets instead of centered modals
- Implement swipe gestures for common actions
- Add pull-to-refresh on list views
- Ensure all text is readable at 16px minimum

---

## 🎯 Usage Examples

### Page Header
```tsx
<header className="mb-6">
  <div className="flex justify-between items-center mb-3">
    <h1 className="text-2xl font-bold text-white">Page Title</h1>
    <button className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-all duration-300">
      <SettingsIcon />
    </button>
  </div>
</header>
```

### Stat Card
```tsx
<div className="bg-gradient-to-br from-blue-900/40 to-blue-800/20 rounded-xl p-4 border border-blue-700/30">
  <div className="flex items-center gap-2 mb-2">
    <IconComponent className="text-blue-400" />
    <span className="text-xs text-blue-300 font-medium">Label</span>
  </div>
  <p className="text-2xl font-bold text-white">₹12,345</p>
  <p className="text-xs mt-1 text-slate-400">+12% vs last month</p>
</div>
```

### Empty State
```tsx
<div className="text-center py-10">
  <div className="bg-slate-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
    <IconComponent className="w-8 h-8 text-slate-600" />
  </div>
  <p className="text-slate-400 mb-2">No data found</p>
  <p className="text-slate-600 text-sm">Try adding some items to get started</p>
  <button className="mt-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold px-4 py-2 rounded-lg">
    Add Item
  </button>
</div>
```

---

## 🚀 Implementation Checklist

When creating new components:
- [ ] Use design system colors (no hardcoded hex values)
- [ ] Apply consistent spacing from the scale
- [ ] Use appropriate border radius
- [ ] Add smooth transitions (300ms default)
- [ ] Ensure 44x44px minimum touch targets
- [ ] Include hover and active states
- [ ] Add loading and disabled states
- [ ] Test with keyboard navigation
- [ ] Verify color contrast ratios
- [ ] Add appropriate ARIA labels

---

## 📚 Resources

- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Material Design Color Tool](https://material.io/resources/color/)
- [Coolors Palette Generator](https://coolors.co/)

---

**Last Updated**: November 30, 2025  
**Version**: 1.0.0
