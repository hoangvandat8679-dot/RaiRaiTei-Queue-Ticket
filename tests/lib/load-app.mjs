// Bộ nạp app dùng chung cho các test hành vi (R0): dựng index.html vào
// jsdom bằng đúng mã nguồn của repo — CSS/JS local được nội tuyến như
// trang thật, script ngoài (http) bị bỏ. Mọi test hành vi/snapshot
// dùng chung bộ nạp này để kết quả so sánh được với nhau.
import { JSDOM, VirtualConsole } from 'jsdom';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

// Từ R1 app chuyển sang ES Modules (js/app.js là điểm vào duy nhất).
// jsdom không chạy được module script, nên khi gặp thẻ module trỏ vào
// js/app.js, bộ nạp gói nó bằng esbuild (chỉ là công cụ kiểm thử —
// app phát hành vẫn chạy module native, zero-build) rồi nội tuyến
// như script thường. Các script classic còn lại nội tuyến trực tiếp.
function bundleEntry(root, entryAbs) {
    const out = path.join(root, 'tests', '.app-bundle.tmp.js');
    const esbuild = path.join(root, 'node_modules', '.bin', 'esbuild');
    execFileSync(esbuild, [entryAbs, '--bundle', '--format=iife', '--outfile=' + out], { stdio: 'pipe' });
    const code = fs.readFileSync(out, 'utf8');
    fs.unlinkSync(out);
    return code;
}

export async function loadApp(root, settleMs = 1200) {
    let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
    html = html.replace(/<link[^>]*href="(css\/[^"?]+)[^"]*"[^>]*>/g, (m, p) => {
        try { return '<style>' + fs.readFileSync(path.join(root, p), 'utf8') + '</style>'; } catch { return ''; }
    });
    html = html.replace(/<script[^>]*src="([^"]+)"[^>]*>\s*<\/script>/g, (m, src) => {
        if (src.startsWith('http')) return '';
        const p = src.split('?')[0];
        try {
            if (/type="module"/.test(m)) return '<script>' + bundleEntry(root, path.join(root, p)) + '</script>';
            return '<script>' + fs.readFileSync(path.join(root, p), 'utf8') + '</script>';
        } catch { return ''; }
    });
    // Thu mọi lỗi chạy trang (jsdomError) để test khẳng định được
    // "khởi động không có lỗi" — ghim cả lớp lỗi handler chết dây chuyền.
    const pageErrors = [];
    const virtualConsole = new VirtualConsole();
    virtualConsole.on('jsdomError', (e) => pageErrors.push(String((e && e.detail && e.detail.message) || e.message || e)));
    const dom = new JSDOM(html, { url: 'http://localhost/', runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole });
    const { window } = dom;
    await new Promise(r => setTimeout(r, settleMs));
    return { dom, window, document: window.document, pageErrors };
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
