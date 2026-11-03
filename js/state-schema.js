/**
 * state-schema.js — lược đồ trạng thái thiết kế (R3).
 * Một nơi duy nhất mô tả hình dạng của một "thiết kế" (định dạng
 * rairaitei-design): các section, kiểu dữ liệu và giới hạn. design-history
 * dùng validateDesign() làm cổng nhận thiết kế (áp dụng cho cả tệp nhập,
 * preset và bản nháp); ticket-drag/design-history dùng các hằng số và
 * hàm chuẩn hoá độ lệch kéo thả ở đây thay cho input ẩn trong DOM.
 */

export const DESIGN_FORMAT = 'rairaitei-design';
export const DESIGN_VERSION = 1;

// Các mục kéo thả được trên vé và giới hạn độ lệch (mm) — khớp
// MAX_OFFSET của ticket-drag.
export const DRAG_KEYS = ['mascot', 'frame', 'number', 'msg', 'branch'];
export const MAX_DRAG_OFFSET = 150;

export const DESIGN_SCHEMA = {
    format: DESIGN_FORMAT,
    version: DESIGN_VERSION,
    sections: {
        template: 'string — id mẫu trong TemplateRegistry',
        controls: 'map id -> number (thanh trượt/số của bảng điều khiển)',
        colors: 'map id -> chuỗi màu #hex',
        fonts: 'map id -> string (giá trị của ô chọn phông)',
        toggles: 'map id -> boolean (công tắc công cụ)',
        mascots: 'map id -> string',
        texts: 'map id -> string (ô nhập chữ của thiết kế: branch-input, msg-input)',
        dragOffsets: 'map DRAG_KEYS -> { dx, dy } số mm trong [-150, 150]',
        backgroundImage: 'string (data URL) hoặc vắng mặt',
        mascotImage: 'string (data URL) hoặc vắng mặt',
        mascotType: "'default' | 'custom' hoặc vắng mặt"
    }
};

const isPlainObject = (v) => !!v && typeof v === 'object' && !Array.isArray(v);
const isFiniteNumber = (v) => typeof v === 'number' && Number.isFinite(v);
const HEX_COLOR = /^#[0-9a-fA-F]{3,8}$/;

function checkNumberMap(section, value, errors) {
    if (value == null) return;
    if (!isPlainObject(value)) { errors.push(`${section}: phải là object`); return; }
    for (const [k, v] of Object.entries(value)) {
        if (!isFiniteNumber(v)) errors.push(`${section}.${k}: phải là số`);
    }
}
function checkStringMap(section, value, errors, pattern) {
    if (value == null) return;
    if (!isPlainObject(value)) { errors.push(`${section}: phải là object`); return; }
    for (const [k, v] of Object.entries(value)) {
        if (typeof v !== 'string') errors.push(`${section}.${k}: phải là chuỗi`);
        else if (pattern && !pattern.test(v)) errors.push(`${section}.${k}: sai định dạng`);
    }
}

export function validateDesign(design) {
    const errors = [];
    if (!isPlainObject(design)) return { ok: false, errors: ['design: phải là object'] };
    if (design.format !== DESIGN_FORMAT) errors.push('format: khác rairaitei-design');
    if (design.version != null && Number(design.version) > DESIGN_VERSION) {
        errors.push(`version: ${design.version} mới hơn bản app hỗ trợ (${DESIGN_VERSION})`);
    }
    if (design.template != null && typeof design.template !== 'string') {
        errors.push('template: phải là chuỗi');
    }
    checkNumberMap('controls', design.controls, errors);
    checkStringMap('colors', design.colors, errors, HEX_COLOR);
    checkStringMap('fonts', design.fonts, errors);
    checkStringMap('mascots', design.mascots, errors);
    checkStringMap('texts', design.texts, errors);
    if (design.toggles != null) {
        if (!isPlainObject(design.toggles)) errors.push('toggles: phải là object');
        else for (const [k, v] of Object.entries(design.toggles)) {
            if (typeof v !== 'boolean') errors.push(`toggles.${k}: phải là boolean`);
        }
    }
    if (design.dragOffsets != null) {
        if (!isPlainObject(design.dragOffsets)) errors.push('dragOffsets: phải là object');
        else for (const [k, v] of Object.entries(design.dragOffsets)) {
            if (!DRAG_KEYS.includes(k)) { errors.push(`dragOffsets.${k}: khóa lạ`); continue; }
            if (!isPlainObject(v) || !isFiniteNumber(v.dx) || !isFiniteNumber(v.dy)) {
                errors.push(`dragOffsets.${k}: cần { dx, dy } dạng số`);
            } else if (Math.abs(v.dx) > MAX_DRAG_OFFSET || Math.abs(v.dy) > MAX_DRAG_OFFSET) {
                errors.push(`dragOffsets.${k}: vượt giới hạn ±${MAX_DRAG_OFFSET} mm`);
            }
        }
    }
    if (design.backgroundImage != null && typeof design.backgroundImage !== 'string') {
        errors.push('backgroundImage: phải là chuỗi');
    }
    if (design.mascotImage != null && typeof design.mascotImage !== 'string') {
        errors.push('mascotImage: phải là chuỗi');
    }
    return { ok: errors.length === 0, errors };
}

// Chuẩn hoá dragOffsets thô (cắt khóa lạ, kẹp giới hạn) để áp vào store.
export function normalizeDragOffsets(raw) {
    if (!isPlainObject(raw)) return null;
    const out = {};
    for (const key of DRAG_KEYS) {
        const v = raw[key];
        if (isPlainObject(v) && isFiniteNumber(v.dx) && isFiniteNumber(v.dy)) {
            const clamp = (n) => Math.min(MAX_DRAG_OFFSET, Math.max(-MAX_DRAG_OFFSET, n));
            out[key] = { dx: clamp(v.dx), dy: clamp(v.dy) };
        }
    }
    return Object.keys(out).length ? out : null;
}

// Thiết kế cũ (trước R3) lưu độ lệch kéo thả trong controls dưới dạng
// drag-<key>-dx / drag-<key>-dy (từ các input ẩn). Hàm này trích chúng
// ra thành dragOffsets để áp dụng thống nhất.
export function extractLegacyDragOffsets(controls) {
    if (!isPlainObject(controls)) return null;
    const out = {};
    for (const key of DRAG_KEYS) {
        const dx = controls[`drag-${key}-dx`];
        const dy = controls[`drag-${key}-dy`];
        if (isFiniteNumber(dx) || isFiniteNumber(dy)) {
            out[key] = { dx: isFiniteNumber(dx) ? dx : 0, dy: isFiniteNumber(dy) ? dy : 0 };
        }
    }
    return Object.keys(out).length ? out : null;
}
