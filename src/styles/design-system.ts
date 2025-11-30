/**
 * Design System for Jarvis Expense Tracker
 * 
 * This file contains all design tokens, component styles, and utility classes
 * to ensure consistency across the application.
 */

// ============================================================================
// COLOR PALETTE
// ============================================================================

export const colors = {
  // Base Colors
  background: {
    primary: '#0F172A',      // Slate 900 - Main background
    secondary: '#1E293B',    // Slate 800 - Cards, elevated surfaces
    tertiary: '#334155',     // Slate 700 - Hover states
  },
  
  // Text Colors
  text: {
    primary: '#F8FAFC',      // Slate 50 - Primary text
    secondary: '#CBD5E1',    // Slate 300 - Secondary text
    tertiary: '#94A3B8',     // Slate 400 - Muted text
    disabled: '#64748B',     // Slate 500 - Disabled text
  },
  
  // Border Colors
  border: {
    default: '#334155',      // Slate 700
    focus: '#3B82F6',        // Blue 500
    error: '#EF4444',        // Red 500
  },
  
  // Brand Colors with Gradients
  brand: {
    budgets: {
      from: '#3B82F6',       // Blue 500
      to: '#2563EB',         // Blue 600
      light: '#60A5FA',      // Blue 400
      dark: '#1E40AF',       // Blue 700
    },
    transactions: {
      from: '#8B5CF6',       // Violet 500
      to: '#7C3AED',         // Violet 600
      light: '#A78BFA',      // Violet 400
      dark: '#6D28D9',       // Violet 700
    },
    jarvis: {
      from: '#06B6D4',       // Cyan 500
      to: '#0891B2',         // Cyan 600
      light: '#22D3EE',      // Cyan 400
      dark: '#0E7490',       // Cyan 700
    },
    analytics: {
      from: '#EC4899',       // Pink 500
      to: '#DB2777',         // Pink 600
      light: '#F472B6',      // Pink 400
      dark: '#BE185D',       // Pink 700
    },
  },
  
  // Semantic Colors
  semantic: {
    success: {
      bg: '#10B981',         // Green 500
      bgLight: '#D1FAE5',    // Green 100
      text: '#059669',       // Green 600
      border: '#34D399',     // Green 400
    },
    warning: {
      bg: '#F59E0B',         // Amber 500
      bgLight: '#FEF3C7',    // Amber 100
      text: '#D97706',       // Amber 600
      border: '#FBBF24',     // Amber 400
    },
    error: {
      bg: '#EF4444',         // Red 500
      bgLight: '#FEE2E2',    // Red 100
      text: '#DC2626',       // Red 600
      border: '#F87171',     // Red 400
    },
    info: {
      bg: '#3B82F6',         // Blue 500
      bgLight: '#DBEAFE',    // Blue 100
      text: '#2563EB',       // Blue 600
      border: '#60A5FA',     // Blue 400
    },
  },
  
  // Chart Colors
  chart: {
    primary: ['#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#06B6D4'],
    pastel: ['#93C5FD', '#C4B5FD', '#F9A8D4', '#FCD34D', '#6EE7B7', '#67E8F9'],
  },
} as const;

// ============================================================================
// TYPOGRAPHY
// ============================================================================

export const typography = {
  fontFamily: {
    sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    mono: '"SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace',
  },
  
  fontSize: {
    xs: '0.75rem',      // 12px
    sm: '0.875rem',     // 14px
    base: '1rem',       // 16px
    lg: '1.125rem',     // 18px
    xl: '1.25rem',      // 20px
    '2xl': '1.5rem',    // 24px
    '3xl': '1.875rem',  // 30px
    '4xl': '2.25rem',   // 36px
  },
  
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  
  lineHeight: {
    tight: '1.25',
    normal: '1.5',
    relaxed: '1.75',
  },
} as const;

// ============================================================================
// SPACING
// ============================================================================

export const spacing = {
  xs: '0.25rem',    // 4px
  sm: '0.5rem',     // 8px
  md: '1rem',       // 16px
  lg: '1.5rem',     // 24px
  xl: '2rem',       // 32px
  '2xl': '3rem',    // 48px
  '3xl': '4rem',    // 64px
} as const;

// ============================================================================
// BORDER RADIUS
// ============================================================================

export const borderRadius = {
  none: '0',
  sm: '0.375rem',   // 6px
  md: '0.5rem',     // 8px
  lg: '0.75rem',    // 12px
  xl: '1rem',       // 16px
  '2xl': '1.5rem',  // 24px
  full: '9999px',
} as const;

// ============================================================================
// SHADOWS
// ============================================================================

export const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  glow: {
    blue: '0 0 20px rgba(59, 130, 246, 0.3)',
    purple: '0 0 20px rgba(139, 92, 246, 0.3)',
    cyan: '0 0 20px rgba(6, 182, 212, 0.3)',
    pink: '0 0 20px rgba(236, 72, 153, 0.3)',
  },
} as const;

// ============================================================================
// ANIMATIONS
// ============================================================================

export const animations = {
  duration: {
    fast: '150ms',
    normal: '300ms',
    slow: '500ms',
  },
  
  easing: {
    default: 'cubic-bezier(0.4, 0, 0.2, 1)',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
} as const;

// ============================================================================
// COMPONENT STYLES
// ============================================================================

export const components = {
  // Button Variants
  button: {
    primary: `
      bg-gradient-to-r from-blue-600 to-blue-500
      hover:from-blue-700 hover:to-blue-600
      active:from-blue-800 active:to-blue-700
      text-white font-semibold
      px-4 py-2 rounded-lg
      transition-all duration-300
      shadow-md hover:shadow-lg
      disabled:opacity-50 disabled:cursor-not-allowed
    `,
    
    secondary: `
      bg-slate-700 hover:bg-slate-600 active:bg-slate-500
      text-white font-medium
      px-4 py-2 rounded-lg
      transition-all duration-300
      border border-slate-600
      disabled:opacity-50 disabled:cursor-not-allowed
    `,
    
    ghost: `
      bg-transparent hover:bg-slate-800 active:bg-slate-700
      text-slate-300 hover:text-white
      px-4 py-2 rounded-lg
      transition-all duration-300
      disabled:opacity-50 disabled:cursor-not-allowed
    `,
    
    icon: `
      p-2 rounded-full
      hover:bg-slate-800 active:bg-slate-700
      text-slate-400 hover:text-white
      transition-all duration-300
      disabled:opacity-50 disabled:cursor-not-allowed
    `,
    
    danger: `
      bg-gradient-to-r from-red-600 to-red-500
      hover:from-red-700 hover:to-red-600
      active:from-red-800 active:to-red-700
      text-white font-semibold
      px-4 py-2 rounded-lg
      transition-all duration-300
      shadow-md hover:shadow-lg
      disabled:opacity-50 disabled:cursor-not-allowed
    `,
  },
  
  // Card Variants
  card: {
    default: `
      bg-slate-800 rounded-xl p-4
      border border-slate-700
      shadow-md
      transition-all duration-300
    `,
    
    elevated: `
      bg-slate-800 rounded-xl p-4
      border border-slate-700
      shadow-lg hover:shadow-xl
      transition-all duration-300
    `,
    
    interactive: `
      bg-slate-800 rounded-xl p-4
      border border-slate-700
      shadow-md hover:shadow-lg
      hover:border-slate-600
      cursor-pointer
      transition-all duration-300
      active:scale-[0.98]
    `,
    
    glass: `
      bg-white/5 backdrop-blur-lg rounded-xl p-4
      border border-white/10
      shadow-lg
      transition-all duration-300
    `,
    
    gradient: (from: string, to: string) => `
      bg-gradient-to-br from-${from} to-${to}
      rounded-xl p-4
      shadow-lg
      transition-all duration-300
    `,
  },
  
  // Input Variants
  input: {
    default: `
      w-full bg-slate-900 text-white
      border border-slate-700 rounded-lg
      px-3 py-2
      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
      transition-all duration-300
      placeholder:text-slate-500
      disabled:opacity-50 disabled:cursor-not-allowed
    `,
    
    error: `
      w-full bg-slate-900 text-white
      border-2 border-red-500 rounded-lg
      px-3 py-2
      focus:outline-none focus:ring-2 focus:ring-red-500
      transition-all duration-300
      placeholder:text-slate-500
    `,
  },
  
  // Badge Variants
  badge: {
    default: `
      inline-flex items-center px-2.5 py-0.5
      rounded-full text-xs font-medium
      bg-slate-700 text-slate-200
    `,
    
    success: `
      inline-flex items-center px-2.5 py-0.5
      rounded-full text-xs font-medium
      bg-green-900/30 text-green-400 border border-green-500/30
    `,
    
    warning: `
      inline-flex items-center px-2.5 py-0.5
      rounded-full text-xs font-medium
      bg-amber-900/30 text-amber-400 border border-amber-500/30
    `,
    
    error: `
      inline-flex items-center px-2.5 py-0.5
      rounded-full text-xs font-medium
      bg-red-900/30 text-red-400 border border-red-500/30
    `,
    
    info: `
      inline-flex items-center px-2.5 py-0.5
      rounded-full text-xs font-medium
      bg-blue-900/30 text-blue-400 border border-blue-500/30
    `,
  },
  
  // Modal/Dialog
  modal: {
    overlay: `
      fixed inset-0 bg-black/80 backdrop-blur-sm
      flex items-center justify-center z-50 p-4
      animate-in fade-in duration-300
    `,
    
    content: `
      bg-slate-800 rounded-2xl w-full max-w-md p-6
      border border-slate-700 shadow-2xl
      animate-in zoom-in-95 duration-300
    `,
  },
} as const;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generate gradient background class
 */
export const gradient = (from: string, to: string, direction: 'r' | 'l' | 'b' | 't' | 'br' | 'bl' = 'r') => {
  return `bg-gradient-to-${direction} from-${from} to-${to}`;
};

/**
 * Generate glassmorphism effect
 */
export const glass = (opacity: number = 5) => {
  return `bg-white/${opacity} backdrop-blur-lg border border-white/10`;
};

/**
 * Generate hover scale effect
 */
export const hoverScale = (scale: number = 1.05) => {
  return `transition-transform duration-300 hover:scale-[${scale}] active:scale-[${scale * 0.95}]`;
};

/**
 * Combine multiple class strings
 */
export const cn = (...classes: (string | undefined | null | false)[]) => {
  return classes.filter(Boolean).join(' ');
};

// ============================================================================
// BREAKPOINTS (for reference)
// ============================================================================

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// ============================================================================
// Z-INDEX LAYERS
// ============================================================================

export const zIndex = {
  base: 0,
  dropdown: 10,
  sticky: 20,
  fixed: 30,
  modalBackdrop: 40,
  modal: 50,
  popover: 60,
  tooltip: 70,
} as const;
