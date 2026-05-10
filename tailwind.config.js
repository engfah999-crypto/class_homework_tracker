/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // ให้ Tailwind ใช้ฟอนต์ Prompt เป็นค่าเริ่มต้น
        sans: ['var(--font-prompt)', 'sans-serif'],
      },
    },
  },
  plugins: [],
};