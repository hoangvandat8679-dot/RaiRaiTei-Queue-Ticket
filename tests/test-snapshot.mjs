// ============================================================
// Test snapshot mốc (R0 — đóng băng hành vi trước tái cấu trúc):
// chụp (1) trạng thái DOM đầy đủ qua chuỗi bấm 7 lượt đổi mẫu và
// (2) toàn bộ computed style của lõi vé + thẻ mẫu ở 5 mẫu, rồi đối
// chiếu với fixture đã chốt trong tests/fixtures/.
// Mọi bước tái cấu trúc R1–R5 phải giữ hai snapshot này không đổi
// (trừ thay đổi hành vi có chủ đích, khi đó sinh lại fixture và
// ghi rõ lý do trong commit).
// Chạy: node test-snapshot.mjs          (đối chiếu)
//       node test-snapshot.mjs --write  (sinh lại fixture)
// ============================================================
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadApp } from './lib/load-app.mjs';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const FIX_DIR = path.join(root, 'tests', 'fixtures');
const writeMode = process.argv.includes('--write');

const { window, document: d } = await loadApp(root);

// --- (1) Snapshot trạng thái DOM ---
function snapState() {
    const inputs = {};
    d.querySelectorAll('input, select, textarea').forEach(el => {
        if (!el.id) return;
        inputs[el.id] = { v: el.type === 'checkbox' || el.type === 'radio' ? el.checked : el.value, dis: !!el.disabled };
    });
    const core = d.getElementById('master-ticket-inner');
    const cs = (sel) => {
        const el = d.querySelector(sel);
        if (!el) return null;
        const s = window.getComputedStyle(el);
        return { bg: s.backgroundColor, color: s.color, fs: s.fontSize };
    };
    return {
        inputs,
        bodyTemplate: d.body.dataset.template || null,
        coreClass: core ? core.className : null,
        bgImage: d.body.style.getPropertyValue('--bg-image') || null,
        branchBgVar: d.body.style.getPropertyValue('--branch-bg') || '',
        branch: cs('.branch-name'),
        number: cs('.ticket-number'),
        selected: [...d.querySelectorAll('[data-template]')].map(b => [b.dataset.template, b.classList.contains('is-selected')]),
        activeTpl: window.RaiRaiTeiApp.TemplateRegistry ? window.RaiRaiTeiApp.TemplateRegistry.getActiveId() : null
    };
}
const stateSnap = {};
for (const id of ['standard', 'spring', 'summer', 'autumn', 'winter', 'spring', 'standard']) {
    d.querySelector(`[data-template="${id}"]`).click();
    await new Promise(r => setTimeout(r, 50));
    stateSnap[id + (stateSnap[id] ? '#2' : '')] = snapState();
}

// --- (2) Snapshot computed style toàn phần ---
const pathOf = (el) => {
    const parts = [];
    let n = el;
    while (n && n !== d.body) {
        let s = n.tagName.toLowerCase();
        if (n.id) s += '#' + n.id;
        else if (n.className && typeof n.className === 'string') s += '.' + n.className.trim().split(/\s+/).join('.');
        parts.unshift(s);
        n = n.parentElement;
    }
    return parts.join('>');
};
const cssSnap = {};
for (const t of ['standard', 'spring', 'summer', 'autumn', 'winter']) {
    d.querySelector(`[data-template="${t}"]`).click();
    await new Promise(r => setTimeout(r, 400));
    const styles = {};
    const core = d.getElementById('master-ticket-inner');
    const els = [d.body, core, ...core.querySelectorAll('*'),
        ...d.querySelectorAll('.template-card, .template-reset-button, .template-card-preview')];
    const seen = new Set();
    for (const el of els) {
        if (!el || seen.has(el)) continue;
        seen.add(el);
        const cs = window.getComputedStyle(el);
        const props = {};
        for (let i = 0; i < cs.length; i++) { const k = cs[i]; props[k] = cs.getPropertyValue(k); }
        styles[pathOf(el)] = props;
    }
    cssSnap[t] = styles;
}

// --- Đối chiếu / ghi fixture ---
function diffPaths(a, b, prefix = '') {
    const out = [];
    if (JSON.stringify(a) === JSON.stringify(b)) return out;
    if (typeof a !== 'object' || typeof b !== 'object' || !a || !b) { out.push(prefix); return out; }
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    for (const k of keys) out.push(...diffPaths(a[k], b[k], prefix ? prefix + '.' + k : k));
    return out;
}

let failed = 0;
for (const [name, data] of [['state-snapshot.json', stateSnap], ['css-dump.json', cssSnap]]) {
    const file = path.join(FIX_DIR, name);
    if (writeMode) {
        fs.writeFileSync(file, JSON.stringify(data, null, 1));
        console.log(`  ✍️  đã ghi fixture ${name}`);
        continue;
    }
    if (!fs.existsSync(file)) { console.log(`  ❌ thiếu fixture ${name} — chạy node test-snapshot.mjs --write`); failed++; continue; }
    const golden = JSON.parse(fs.readFileSync(file, 'utf8'));
    const diffs = diffPaths(golden, data);
    if (diffs.length === 0) console.log(`  ✅ ${name}: khớp hoàn toàn`);
    else { failed++; console.log(`  ❌ ${name}: ${diffs.length} đường khác — đầu tiên: ${diffs.slice(0, 5).join(', ')}`); }
}
console.log(`\nTEST SNAPSHOT: ${failed === 0 ? 'KHỚP TOÀN BỘ' : failed + ' FILE LỆCH'}`);
process.exit(failed > 0 ? 1 : 0);
