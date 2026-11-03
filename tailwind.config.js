/** Tailwind biên dịch tĩnh (GĐ2 vé 2.4) — thay Play CDN.
 *  Nội dung quét: index.html + toàn bộ js/ (có class trong HTML do JS sinh).
 *  Build: npm run build:css  ->  css/tailwind.css (file này được commit). */
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './js/**/*.js'],
  theme: { extend: { spacing: { '4.5': '1.125rem' } } }, // 4.5: index.html đang dùng w-4.5/h-4.5 cho icon nút in (thang mặc định của Tailwind không có 4.5)
  plugins: [],
};
