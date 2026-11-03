// tools/build-sw.mjs — sinh lại danh sách tiền nạp (PRECACHE) trong sw.js
// từ cây thư mục thật, để Service Worker không bao giờ lệch khỏi repo.
// Chạy: node tools/build-sw.mjs [hậu tố cache mới, vd: r5]
// Quy tắc nạp: toàn bộ css/ + js/ của app (trừ bản nguồn Tailwind và
// vendor — vendor cộng riêng), các tệp vendor UMD, và tài sản ảnh/svg
// trong assets/ (phông woff2 KHÔNG tiền nạp: nạp lười qua cache-first).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const precache = ['./', 'index.html'];

function walk(base, filter) {
    const dir = path.join(root, base);
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const rel = base + '/' + entry.name;
        if (entry.isDirectory()) {
            if (entry.name !== 'node_modules' && entry.name !== 'vendor') walk(rel, filter);
        } else if (filter(entry.name)) {
            precache.push(rel);
        }
    }
}
walk('css', (f) => f.endsWith('.css') && !f.endsWith('.src.css'));
walk('js', (f) => f.endsWith('.js'));
precache.push('js/vendor/html2canvas.min.js', 'js/vendor/html-to-image.min.js', 'js/vendor/jspdf.umd.min.js');
walk('assets', (f) => /\.(svg|png|webp)$/.test(f));

const list = [...new Set(precache)].sort();
const swPath = path.join(root, 'sw.js');
let sw = fs.readFileSync(swPath, 'utf8');
sw = sw.replace(/const PRECACHE = \[.*?\];/s, 'const PRECACHE = ' + JSON.stringify(list) + ';');
const suffix = process.argv[2];
if (suffix) {
    sw = sw.replace(/const CACHE_NAME = '[^']+';/, `const CACHE_NAME = 'rairaitei-shell-${suffix}';`);
}
fs.writeFileSync(swPath, sw);
console.log(`sw.js: PRECACHE ${list.length} mục${suffix ? `, cache -> rairaitei-shell-${suffix}` : ''}`);
