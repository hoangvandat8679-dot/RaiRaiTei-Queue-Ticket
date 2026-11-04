import { currentLang } from './i18n.js';
import { ticketStore } from './core/store.js';
import { effect } from './core/signal.js';

// ticketDrag cần trạng thái trong DOMContentLoaded — export wrapper ổn định,
// triển khai thật được gán khi DOM sẵn sàng (cùng mẫu với controls.js).
let ticketDragImpl = { resetAll() {}, select() {} };
export const ticketDrag = {
    resetAll: (...args) => ticketDragImpl.resetAll(...args),
    select: (...args) => ticketDragImpl.select(...args)
};

/* ============================================================ */
/* FILE: js/ticket-drag.js                                      */
/* Kéo thả các mục trên vé: linh vật, khung số, lời nhắn,       */
/* tên chi nhánh.                                               */
/* ============================================================ */
/*
  Nguyên tắc:
  - Vị trí kéo được lưu thành độ lệch (mm) trong ticketStore
    (R3: trước đây qua các input ẩn #drag-<key>-dx/dy). design-history
    thu thập độ lệch từ store vào design.dragOffsets.
  - Giá trị được áp vào biến CSS --<key>-dx / --<key>-dy trên body.
    Bản in (iframe) và PDF sao chép biến trên body nên vị trí in
    luôn khớp với bản xem trước.
  - Độ lệch cộng thêm vào vị trí của thanh trượt hiện có, không thay thế.
*/
document.addEventListener('DOMContentLoaded', () => {
    const ticket = document.getElementById('master-ticket-inner');
    const previewArea = document.getElementById('preview-area');

    if (!ticket || !previewArea) return;

    const TEXT = {
        jp: {
            hint: 'ドラッグで移動 ・ 矢印キーで微調整 ・ ダブルクリックで元の位置',
            hintShort: 'ドラッグ移動',
            reset: 'リセット',
            mascot: 'マスコット',
            number: '番号',
            frame: '番号枠',
            msg: 'メッセージ',
            branch: '店舗名'
        },
        vn: {
            hint: 'Kéo thả để di chuyển · Phím mũi tên để tinh chỉnh · Nhấp đúp để về vị trí cũ',
            hintShort: 'Kéo thả',
            reset: 'Đặt lại',
            mascot: 'Linh vật',
            number: 'Số thứ tự',
            frame: 'Khung số',
            msg: 'Lời nhắn',
            branch: 'Tên chi nhánh'
        }
    };

    const tr = (key) => {
        const lang = currentLang === 'vn' ? 'vn' : 'jp';
        return TEXT[lang][key] || TEXT.jp[key] || key;
    };

    const SNAP_MM = 0.8;     // khoảng hút vào tâm ngang
    const MAX_OFFSET = 150;  // giới hạn an toàn cho độ lệch
    const DRAG_THRESHOLD_PX = 3;

    const items = [
        { key: 'mascot', selector: '#mascot-preview' },
        { key: 'number', selector: '#preview-number' },
        { key: 'frame', selector: '.number-frame' },
        { key: 'msg', selector: '#display-msg' },
        { key: 'branch', selector: '#display-branch' }
    ]
        .map((item) => ({
            ...item,
            el: ticket.querySelector(item.selector)
        }))
        .filter((item) => item.el);

    if (!items.length) return;

    /* ---------- Tiện ích ---------- */
    const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
    const round1 = (value) => Math.round(value * 10) / 10;

    const formatMm = (value) => {
        const rounded = round1(value);
        if (Math.abs(rounded) < 0.05) return '0.0';
        return (rounded > 0 ? '+' : '−') + Math.abs(rounded).toFixed(1);
    };

    // Độ lệch sống trong ticketStore (R3) — không còn input ẩn.
    const getOffset = (item) => ({
        x: ticketStore.elements[item.key].dx.peek(),
        y: ticketStore.elements[item.key].dy.peek()
    });

    const applyVars = (item, x, y) => {
        document.body.style.setProperty(`--${item.key}-dx`, `${round1(x)}mm`);
        document.body.style.setProperty(`--${item.key}-dy`, `${round1(y)}mm`);
    };

    // Ghi độ lệch vào store rồi báo "thiết kế đã đổi" để lịch sử/bản nháp ghi nhận
    const commit = (item, x, y) => {
        ticketStore.actions.setElementOffset(
            item.key,
            round1(clamp(x, -MAX_OFFSET, MAX_OFFSET)),
            round1(clamp(y, -MAX_OFFSET, MAX_OFFSET))
        );
        document.dispatchEvent(new CustomEvent('rairaitei:design-changed'));
    };

    // 1 mm bằng bao nhiêu px trên màn hình (đã tính zoom xem trước)
    const pxPerMm = () => {
        const rect = ticket.getBoundingClientRect();
        const coreWidthMm =
            parseFloat(
                getComputedStyle(document.body).getPropertyValue('--core-width')
            ) || 43;

        return rect.width > 0 ? rect.width / coreWidthMm : 3.7795;
    };

    const isVisible = (el) => {
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
    };

    /* ---------- Đồng bộ store → biến CSS (R3) ---------- */
    // effect() chạy ngay một lần khi đăng ký, lúc nút reset chưa được tạo
    // (khai báo sau) — chỉ cập nhật trạng thái nút sau khi khởi tạo xong.
    let dragUiReady = false;
    items.forEach((item) => {
        item.el.classList.add('td-item');
        item.el.setAttribute('draggable', 'false');

        effect(() => {
            const x = ticketStore.elements[item.key].dx.get();
            const y = ticketStore.elements[item.key].dy.get();
            applyVars(item, x, y);
            if (dragUiReady) updateResetState();
        });
    });

    ticket.addEventListener('dragstart', (event) => event.preventDefault());

    /* ---------- Lớp phủ: khung chọn, đường căn giữa, gợi ý ---------- */
    const selectionBox = document.createElement('div');
    selectionBox.className = 'td-selection';
    selectionBox.setAttribute('aria-hidden', 'true');
    selectionBox.innerHTML =
        '<span class="td-handle tl"></span><span class="td-handle tr"></span>' +
        '<span class="td-handle bl"></span><span class="td-handle br"></span>' +
        '<div class="td-selection-label"><span class="td-name"></span>' +
        '<span class="td-coords"></span></div>';
    document.body.appendChild(selectionBox);

    const labelName = selectionBox.querySelector('.td-name');
    const labelCoords = selectionBox.querySelector('.td-coords');

    const guide = document.createElement('div');
    guide.className = 'td-guide';
    guide.setAttribute('aria-hidden', 'true');
    document.body.appendChild(guide);

    const hint = document.createElement('div');
    hint.className = 'td-hint';
    hint.id = 'ticket-drag-hint';
    hint.innerHTML =
        '<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">' +
        '<path stroke-linecap="round" stroke-linejoin="round" d="M12 3v18m0-18l-3 3m3-3l3 3m-3 15l-3-3m3 3l3-3M3 12h18M3 12l3-3m-3 3l3 3m15-3l-3-3m3 3l-3 3"/></svg>' +
        '<span class="td-hint-long"></span><span class="td-hint-short"></span>' +
        '<button type="button" class="td-hint-reset" id="ticket-drag-reset">' +
        '<svg fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24" aria-hidden="true">' +
        '<path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h5M20 20v-5h-5M5.6 15A7 7 0 0018.4 9M18.4 9H15M5.6 15H9"/></svg>' +
        '<span class="td-reset-text"></span></button>';
    const headerSlot = document.getElementById('header-drag-hint-slot');
    if (headerSlot) {
        headerSlot.appendChild(hint);
    } else {
        previewArea.appendChild(hint);
    }

    const resetButton = hint.querySelector('.td-hint-reset');

    const refreshTexts = () => {
        hint.querySelector('.td-hint-long').textContent = tr('hint');
        hint.querySelector('.td-hint-short').textContent = tr('hintShort');
        hint.querySelector('.td-reset-text').textContent = tr('reset');
        renderSelection();
    };

    function updateResetState() {
        const anyMoved = items.some((item) => {
            const { x, y } = getOffset(item);
            return x !== 0 || y !== 0;
        });
        resetButton.disabled = !anyMoved;
    }

    /* ---------- Trạng thái chọn ---------- */
    let selected = null;
    let drag = null;
    let rafId = 0;

    function renderSelection() {
        if (!selected || !isVisible(selected.el)) {
            selectionBox.classList.remove('is-visible');
            return;
        }

        const rect = selected.el.getBoundingClientRect();
        const areaRect = previewArea.getBoundingClientRect();
        const centerY = rect.top + rect.height / 2;

        // Ẩn khi vé bị cuộn ra khỏi vùng xem trước
        if (centerY < areaRect.top || centerY > areaRect.bottom) {
            selectionBox.classList.remove('is-visible');
            return;
        }

        const offset = drag && drag.item === selected
            ? { x: drag.x, y: drag.y }
            : getOffset(selected);

        selectionBox.style.left = `${rect.left}px`;
        selectionBox.style.top = `${rect.top}px`;
        selectionBox.style.width = `${rect.width}px`;
        selectionBox.style.height = `${rect.height}px`;
        selectionBox.classList.toggle('td-label-below', rect.top - areaRect.top < 34);
        selectionBox.classList.add('is-visible');

        labelName.textContent = tr(selected.key);
        labelCoords.textContent =
            `X ${formatMm(offset.x)} · Y ${formatMm(offset.y)} mm`;
    }

    const loop = () => {
        renderSelection();
        rafId = selected ? requestAnimationFrame(loop) : 0;
    };

    const select = (item) => {
        if (selected === item) return;

        if (selected) selected.el.classList.remove('td-selected');
        selected = item;

        if (selected) {
            selected.el.classList.add('td-selected');
            if (!rafId) rafId = requestAnimationFrame(loop);
        } else {
            selectionBox.classList.remove('is-visible');
        }
    };

    const showGuide = (visible) => {
        if (!visible) {
            guide.classList.remove('is-visible');
            return;
        }

        const coreRect = ticket.getBoundingClientRect();
        guide.style.left = `${coreRect.left + coreRect.width / 2}px`;
        guide.style.top = `${coreRect.top}px`;
        guide.style.height = `${coreRect.height}px`;
        guide.classList.add('is-visible');
    };

    /* ---------- Kéo thả 120 FPS với rAF Scheduling & Smart Snapping ---------- */
    const findItem = (target) =>
        items.find((item) => item.el === target || item.el.contains(target));

    let dragRafId = 0;
    let pendingDragEvent = null;

    const processDragMove = () => {
        if (!drag || !pendingDragEvent) return;
        const event = pendingDragEvent;
        pendingDragEvent = null;
        dragRafId = 0;

        const deltaPxX = event.clientX - drag.startClientX;
        const deltaPxY = event.clientY - drag.startClientY;

        if (!drag.moved) {
            if (Math.hypot(deltaPxX, deltaPxY) < DRAG_THRESHOLD_PX) return;
            drag.moved = true;
            document.body.classList.add('td-dragging');
        }

        let x = clamp(drag.start.x + deltaPxX / drag.kx, drag.minX, drag.maxX);
        const y = clamp(drag.start.y + deltaPxY / drag.ky, drag.minY, drag.maxY);

        // Smart Snapping: Bắt dính vào tâm vé (centerX) hoặc mốc 0mm (giữ Alt để tắt)
        const snapToCenter = !event.altKey && Math.abs(x - drag.centerX) < SNAP_MM;
        const snapToZero = !event.altKey && Math.abs(x) < (SNAP_MM * 0.5);

        let snapped = false;
        if (snapToCenter) {
            x = drag.centerX;
            snapped = true;
        } else if (snapToZero) {
            x = 0;
            snapped = true;
        }

        drag.x = x;
        drag.y = y;
        applyVars(drag.item, x, y);

        // Đồng bộ thời gian thực với Central TicketStore
        if (ticketStore && ticketStore.actions) {
            ticketStore.actions.setElementOffset(drag.item.key, x, y);
        }

        showGuide(snapped);
        renderSelection();
    };

    ticket.addEventListener('pointerdown', (event) => {
        if (event.button !== 0) return;

        const item = findItem(event.target);
        if (!item) {
            select(null);
            return;
        }

        event.preventDefault();
        select(item);

        const start = getOffset(item);
        const k = pxPerMm();
        // Khi khung đèn bật ở mẫu mùa, lớp nội dung bị thu nhỏ (transform
        // scale) — hệ số kéo phải nhân thêm tỉ lệ này để phần tử bám đúng
        // con trỏ theo từng trục.
        let artSx = 1;
        let artSy = 1;
        const contentLayer = ticket.querySelector('.ticket-content');
        if (contentLayer) {
            const m = new DOMMatrixReadOnly(getComputedStyle(contentLayer).transform);
            if (Number.isFinite(m.a) && m.a > 0) artSx = m.a;
            if (Number.isFinite(m.d) && m.d > 0) artSy = m.d;
        }
        const kx = k * artSx;
        const ky = k * artSy;
        const elRect = item.el.getBoundingClientRect();
        const coreRect = ticket.getBoundingClientRect();

        const limitX = [
            start.x + (coreRect.left - elRect.left) / kx,
            start.x + (coreRect.right - elRect.right) / kx
        ];
        const limitY = [
            start.y + (coreRect.top - elRect.top) / ky,
            start.y + (coreRect.bottom - elRect.bottom) / ky
        ];

        drag = {
            item,
            pointerId: event.pointerId,
            startClientX: event.clientX,
            startClientY: event.clientY,
            start,
            kx,
            ky,
            moved: false,
            x: start.x,
            y: start.y,
            minX: Math.min(start.x, ...limitX),
            maxX: Math.max(start.x, ...limitX),
            minY: Math.min(start.y, ...limitY),
            maxY: Math.max(start.y, ...limitY),
            centerX:
                start.x -
                (elRect.left + elRect.width / 2 -
                    (coreRect.left + coreRect.width / 2)) / kx
        };

        try {
            item.el.setPointerCapture(event.pointerId);
        } catch (error) {
            // Fallback an toàn nếu không hỗ trợ capture
        }
    });

    window.addEventListener('pointermove', (event) => {
        if (!drag || event.pointerId !== drag.pointerId) return;
        pendingDragEvent = event;
        if (!dragRafId) {
            dragRafId = requestAnimationFrame(processDragMove);
        }
    });

    const endDrag = (event) => {
        if (!drag || event.pointerId !== drag.pointerId) return;

        if (dragRafId) {
            cancelAnimationFrame(dragRafId);
            processDragMove();
        }

        const { item, moved, x, y } = drag;
        drag = null;

        document.body.classList.remove('td-dragging');
        showGuide(false);

        if (moved) commit(item, x, y);
    };

    window.addEventListener('pointerup', endDrag);
    window.addEventListener('pointercancel', endDrag);

    // Nhấp đúp: đưa mục về vị trí gốc
    ticket.addEventListener('dblclick', (event) => {
        const item = findItem(event.target);
        if (!item) return;

        event.preventDefault();
        select(item);
        commit(item, 0, 0);
    });

    // Nhấp ra ngoài vé để bỏ chọn
    document.addEventListener('pointerdown', (event) => {
        if (!selected) return;
        if (ticket.contains(event.target) || hint.contains(event.target)) return;
        select(null);
    });

    /* ---------- Bàn phím: mũi tên tinh chỉnh, Esc bỏ chọn ---------- */
    document.addEventListener('keydown', (event) => {
        if (!selected) return;

        const tag = (event.target && event.target.tagName) || '';
        if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag) ||
            (event.target && event.target.isContentEditable)) {
            return;
        }

        if (event.key === 'Escape') {
            select(null);
            return;
        }

        const step = event.shiftKey ? 1 : 0.1;
        const moves = {
            ArrowLeft: [-step, 0],
            ArrowRight: [step, 0],
            ArrowUp: [0, -step],
            ArrowDown: [0, step]
        };
        const move = moves[event.key];
        if (!move) return;

        event.preventDefault();
        const { x, y } = getOffset(selected);
        commit(selected, x + move[0], y + move[1]);
    });

    /* ---------- Đặt lại ---------- */
    const resetAll = () => {
        items.forEach((item) => {
            const { x, y } = getOffset(item);
            if (x !== 0 || y !== 0) commit(item, 0, 0);
        });
    };

    resetButton.addEventListener('click', resetAll);

    /* ---------- Ngôn ngữ ---------- */
    document.addEventListener('rairaitei:language-changed', refreshTexts);

    // Khởi tạo
    dragUiReady = true;
    items.forEach((item) => {
        const { x, y } = getOffset(item);
        applyVars(item, x, y);
    });
    refreshTexts();
    updateResetState();

    ticketDragImpl = { resetAll, select: (key) => select(items.find((i) => i.key === key) || null) };
});
