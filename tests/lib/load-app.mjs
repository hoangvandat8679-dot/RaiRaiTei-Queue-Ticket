// Bộ nạp app dùng chung cho các test hành vi (R0): dựng index.html vào
// jsdom bằng đúng mã nguồn của repo — CSS/JS local được nội tuyến như
// trang thật, script ngoài (http) bị bỏ. Mọi test hành vi/snapshot
// dùng chung bộ nạp này để kết quả so sánh được với nhau.
import { JSDOM } from 'jsdom';
import fs from 'node:fs';
import path from 'node:path';

export async function loadApp(root, settleMs = 1200) {
    let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
    html = html.replace(/<link[^>]*href="(css\/[^"?]+)[^"]*"[^>]*>/g, (m, p) => {
        try { return '<style>' + fs.readFileSync(path.join(root, p), 'utf8') + '</style>'; } catch { return ''; }
    });
    html = html.replace(/<script[^>]*src="([^"]+)"[^>]*>\s*<\/script>/g, (m, src) => {
        if (src.startsWith('http')) return '';
        const p = src.split('?')[0];
        try { return '<script>' + fs.readFileSync(path.join(root, p), 'utf8') + '</script>'; } catch { return ''; }
    });
    const dom = new JSDOM(html, { url: 'http://localhost/', runScripts: 'dangerously', pretendToBeVisual: true });
    const { window } = dom;
    await new Promise(r => setTimeout(r, settleMs));
    return { dom, window, document: window.document };
}

export function makeChecker(label) {
    let pass = 0, fail = 0;
    const failures = [];
    return {
        check(name, cond, detail = '') {
            if (cond) { pass++; console.log(`  ✅ ${name}`); }
            else { fail++; failures.push(name); console.log(`  ❌ ${name}${detail ? ' — ' + detail : ''}`); }
        },
        summary() {
            console.log(`\n${label}: ${pass} ĐẠT / ${fail} LỖI`);
            if (failures.length) console.log('Lỗi ở: ' + failures.join(' | '));
            return fail;
        }
    };
}
