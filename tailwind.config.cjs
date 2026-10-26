/** Generated CSS scans only the integrated page, not reports or node_modules. */
module.exports = {
  content: ["./index.html", "./js/**/*.js", "./widgets/**/*.{html,shtml}"],
  theme: {
    extend: {
      colors: {
        background: "var(--color-background)",
        surface: "var(--color-surface)",
        section: "var(--color-section)",
        "hover-surface": "var(--color-hover-surface)",
        accent: "var(--color-accent)",
        primary: "var(--color-text)",
        secondary: "var(--color-text-secondary)",
        decorative: "var(--color-border-decorative)",
        interactive: "var(--color-border-interactive)",
        "cta-hover": "var(--color-primary-button-hover)",
        "cta-pressed": "var(--color-primary-button-pressed)",
        success: "var(--color-success)",
        error: "var(--color-error)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
        heading: ["Manrope", "system-ui", "sans-serif"],
      },
      borderRadius: { control: "12px", card: "20px", panel: "24px" },
      maxWidth: { site: "1248px" },
      minHeight: { header: "104px" },
      transitionDuration: { 120: "120ms", 180: "180ms", 250: "250ms" },
      screens: { tablet: "900px", desktop: "1100px", wide: "1200px" },
    },
  },
  plugins: [],
};
