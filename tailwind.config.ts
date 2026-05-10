import type { Config } from "tailwindcss";

/**
 * Tailwind v4: theme extensions are primarily in `app/globals.css` (`@theme`).
 * This file documents content paths and can be loaded via `@config` if needed.
 */
export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      transitionDuration: {
        linear: "150ms",
        "linear-modal": "220ms",
      },
      transitionTimingFunction: {
        "linear-out": "cubic-bezier(0.33, 1, 0.68, 1)",
        "linear-modal": "cubic-bezier(0.32, 0.72, 0, 1)",
      },
    },
  },
} satisfies Config;
