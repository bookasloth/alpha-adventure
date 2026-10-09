/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#fe5100",
          light: "#ff7a33",
          dark: "#d85d0b",
        },
        accent: "#FFB52A",
        dark: "#110F0F",
        ink: "#110F0F",
        page: "#f6f8fc",
        line: "#E8E8E8",
      },
      fontFamily: {
        sans: ["var(--font-poppins)", "system-ui", "sans-serif"],
        heading: ["var(--font-poppins)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 18px 40px -18px rgba(17,15,15,0.22)",
        soft: "0 10px 30px -14px rgba(17,15,15,0.16)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      // Skeletons fade in after a short delay so fast loads never flash a
      // placeholder (no JS timers -> no stale-timer/unmount races).
      keyframes: {
        appear: { from: { opacity: "0" }, to: { opacity: "1" } },
      },
      animation: {
        appear: "appear 200ms ease-out 150ms both",
      },
      backgroundImage: {
        "hero-pattern":
          "linear-gradient(135deg, rgba(17,15,15,0.82), rgba(216,93,11,0.45))",
        "btn-gradient": "linear-gradient(135deg, #fe5100, #d85d0b)",
      },
    },
  },
  plugins: [],
};
