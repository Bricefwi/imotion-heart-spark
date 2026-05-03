import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Inter", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "'Fira Code'", "ui-monospace", "monospace"],
      },
      backgroundImage: {
        // Legacy aliases (rétro-compat)
        "gradient-primary": "var(--gradient-primary)",
        "gradient-flame":   "var(--gradient-flame)",
        "gradient-ember":   "var(--gradient-ember)",
        "gradient-dusk":    "var(--gradient-dusk)",
        "gradient-dawn":    "var(--gradient-dawn)",
        "gradient-paper":   "var(--gradient-paper)",
        "gradient-glow":    "var(--gradient-glow)",
        "gradient-text":    "var(--gradient-text)",
        // imo-* gradients (canonical)
        "imo-flame":   "var(--imo-gradient-flame)",
        "imo-ember":   "var(--imo-gradient-ember)",
        "imo-coral":   "var(--imo-gradient-coral)",
        "imo-sunrise": "var(--imo-gradient-sunrise)",
        "imo-text":    "var(--imo-gradient-text)",
        "imo-paper":   "var(--imo-gradient-paper)",
        "imo-card":    "var(--imo-gradient-card)",
        "imo-dusk":    "var(--imo-gradient-dusk)",
        "imo-night":   "var(--imo-gradient-night)",
        "imo-dawn":    "var(--imo-gradient-dawn)",
        "imo-glow-coral": "var(--imo-glow-coral)",
        "imo-glow-amber": "var(--imo-glow-amber)",
        "imo-glow-soft":  "var(--imo-glow-soft)",
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        info: {
          DEFAULT: "hsl(var(--info))",
          foreground: "hsl(var(--info-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },

        /* ──────────────────────────────────────────────
           imo-* — palette brand v2 exposée à Tailwind
           Usage : bg-imo-coral-600, text-imo-ink-500, ring-imo-amber-300
           ────────────────────────────────────────────── */
        "imo-coral": {
          50:  "hsl(var(--imo-coral-50))",
          100: "hsl(var(--imo-coral-100))",
          200: "hsl(var(--imo-coral-200))",
          300: "hsl(var(--imo-coral-300))",
          400: "hsl(var(--imo-coral-400))",
          500: "hsl(var(--imo-coral-500))",
          600: "hsl(var(--imo-coral-600))",
          700: "hsl(var(--imo-coral-700))",
          800: "hsl(var(--imo-coral-800))",
          900: "hsl(var(--imo-coral-900))",
        },
        "imo-amber": {
          50:  "hsl(var(--imo-amber-50))",
          100: "hsl(var(--imo-amber-100))",
          200: "hsl(var(--imo-amber-200))",
          300: "hsl(var(--imo-amber-300))",
          400: "hsl(var(--imo-amber-400))",
          500: "hsl(var(--imo-amber-500))",
          600: "hsl(var(--imo-amber-600))",
          700: "hsl(var(--imo-amber-700))",
        },
        "imo-ink": {
          50:  "hsl(var(--imo-ink-50))",
          100: "hsl(var(--imo-ink-100))",
          200: "hsl(var(--imo-ink-200))",
          300: "hsl(var(--imo-ink-300))",
          400: "hsl(var(--imo-ink-400))",
          500: "hsl(var(--imo-ink-500))",
          600: "hsl(var(--imo-ink-600))",
          700: "hsl(var(--imo-ink-700))",
          800: "hsl(var(--imo-ink-800))",
          900: "hsl(var(--imo-ink-900))",
        },
        "imo-night": {
          700: "hsl(var(--imo-night-700))",
          800: "hsl(var(--imo-night-800))",
          900: "hsl(var(--imo-night-900))",
        },
      },
      borderRadius: {
        xs: "var(--radius-xs, 4px)",
        sm: "var(--radius-sm, 6px)",
        md: "var(--radius-md, 10px)",
        lg: "var(--radius-lg, 16px)",
        xl: "var(--radius-xl, 24px)",
      },
      boxShadow: {
        xs: "var(--shadow-xs)",
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        xl: "var(--shadow-xl)",
        glow: "var(--shadow-glow)",
        "glow-lg": "var(--shadow-glow-lg)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in-up": {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in": {
          from: { opacity: "0", transform: "translateX(-16px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        "slide-in-bottom": {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.95)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 0 0 hsl(0 68% 51% / 0.4)" },
          "50%": { boxShadow: "0 0 0 12px hsl(0 68% 51% / 0)" },
        },
        "pulse-dot": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.5", transform: "scale(1.2)" },
        },
        "spin-slow": {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
        "progress-shrink": {
          from: { width: "100%" },
          to: { width: "0%" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        "fade-in-up": "fade-in-up 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
        "slide-in": "slide-in 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        "slide-in-bottom": "slide-in-bottom 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        "scale-in": "scale-in 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
        "pulse-glow": "pulse-glow 2s infinite",
        "pulse-dot": "pulse-dot 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "spin-slow": "spin-slow 3s linear infinite",
        "progress-shrink": "progress-shrink linear",
      },
      transitionTimingFunction: {
        "ease-spring": "cubic-bezier(0.34, 1.56, 0.64, 1)",
        "ease-smooth": "cubic-bezier(0.4, 0, 0.2, 1)",
      },
    },
  },
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
