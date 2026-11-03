import { t, setLanguage, currentLang } from './i18n.js';
import { calculateAILayout } from './layout-sync.js';
import { exportTicketPng } from './print/print.js';
import { guardInAppBrowserForPrint } from './in-app-guard.js';
import { printTestPage, refreshPreflightUI } from './print/preflight.js';

/* ============================================================ */
/* FILE: js/ui-events.js                                        */
/* ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.getElementById('controls-sidebar');
    const appContainer = document.getElementById('app-container');
    const previewArea = document.getElementById('preview-area');
    const previewHeader = document.getElementById('preview-header');
    const categoryBar =
        document.getElementById('mobile-category-bar');
    const masterTicket = document.getElementById('master-ticket');
    let mobileFitFrame = 0;

    const previewScaleEl = document.querySelector('.preview-scale');

    const fitMobilePreview = () => {
        cancelAnimationFrame(mobileFitFrame);

        mobileFitFrame = requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                if (window.innerWidth >= 768) {
                    // --- PC: tính scale để ticket vừa khít preview area ---
                    appContainer.style.removeProperty('--mobile-preview-height');

                    const previewRect = previewArea.getBoundingClientRect();
                    const availableW = Math.max(120, previewRect.width);
                    const availableH = Math.max(120, previewRect.height);

                    // Đọc kích thước core từ CSS custom properties (mm)
                    const bodyStyles = getComputedStyle(document.body);
                    const coreWmm = parseFloat(bodyStyles.getPropertyValue('--core-width'))  || 43;
                    const coreHmm = parseFloat(bodyStyles.getPropertyValue('--core-height')) || 78;
                    // 1mm = 3.7795275591px tại 96 DPI
                    const PX_PER_MM = 3.7795275591;
                    const ticketW = coreWmm * PX_PER_MM;
                    const ticketH = coreHmm * PX_PER_MM;

                    const pad = 64;
                    // Giới hạn ticket chiếm tối đa 78% chiều nhỏ hơn → nền tối luôn hiện ra xung quanh
                    const fillRatio = 0.78;
                    const scale = Math.max(
                        0.5,
                        Math.min(
                            (availableW - pad) / ticketW * fillRatio,
                            (availableH - pad) / ticketH * fillRatio,
                            3.0
                        )
                    );
                    // Set zoom trực tiếp → zoom thay đổi layout size thật → không bị clip
                    if (previewScaleEl) previewScaleEl.style.zoom = scale.toFixed(4);
                    document.body.style.setProperty('--ticket-scale', scale.toFixed(4));
                    return;
                }

                // --- Mobile ---
                const previewRect = previewArea.getBoundingClientRect();
                const categoryRect = categoryBar.getBoundingClientRect();
                const sheetIsOpen = sidebar.classList.contains('sheet-open');
                const isFocusMode = document.body.classList.contains('preview-focus-active');

                let visibleBottom = categoryRect.top;
                if (sheetIsOpen && !isFocusMode) {
                    visibleBottom = categoryRect.top - sidebar.offsetHeight;
                } else if (sheetIsOpen && isFocusMode) {
                    visibleBottom = categoryRect.top - 36; // chỉ để lộ thanh bar ở đáy
                }
                const availableHeight = Math.max(160, visibleBottom - previewRect.top);
                const availableWidth  = Math.max(120, previewArea.clientWidth);
                const ticketWidth  = Math.max(1, masterTicket.offsetWidth);
                const ticketHeight = Math.max(1, masterTicket.offsetHeight);

                const pad = 12; // Tối ưu padding để vé hiển thị to và rõ nét nhất
                const scale = Math.max(
                    0.50,
                    Math.min(
                        (availableWidth  - pad) / ticketWidth,
                        (availableHeight - pad) / ticketHeight,
                        2.2
                    )
                );

                appContainer.style.setProperty('--mobile-preview-height', availableHeight + 'px');
                if (previewScaleEl) previewScaleEl.style.zoom = scale.toFixed(4);
            });
        });
    };
    
    // Chế độ “Thiết lập” (mobile): ẩn tab, mở sheet cài đặt, nút trở lại thay thế tab
    const applySettingsMode = (enabled) => {
        categoryBar.classList.toggle('settings-open', enabled);
        sidebar.classList.toggle('settings-open', enabled);
    };

    // 1. CHUYỂN ĐỔI TAB VÀ ĐÓNG/MỞ Ở ĐIỆN THOẠI
    const catBtns = document.querySelectorAll('.cat-btn');
    const panels = document.querySelectorAll('.mobile-panel');

    const closeMobileSheet = () => {
        applySettingsMode(false);
        sidebar.classList.remove('sheet-open', 'sheet-expanded');
        document.body.classList.remove('preview-focus-active');
        const focusBtn = document.getElementById('btn-focus-preview');
        if (focusBtn) {
            focusBtn.classList.remove('active');
            const zoomIcon = focusBtn.querySelector('.focus-icon-zoom');
            const shrinkIcon = focusBtn.querySelector('.focus-icon-shrink');
            const txtEl = document.getElementById('txt_focus_preview');
            if (zoomIcon) zoomIcon.classList.remove('hidden');
            if (shrinkIcon) shrinkIcon.classList.add('hidden');
            if (txtEl) txtEl.textContent = t('txt_focus_preview');
        }
        appContainer.classList.remove('pushed-up');
        catBtns.forEach(b => {
            b.classList.remove('text-[#cbfb45]', 'border-[#cbfb45]', 'bg-[#cbfb45]/10');
            b.classList.add('text-gray-500', 'border-transparent');
        });
        panels.forEach(p => p.classList.remove('active-panel'));
        fitMobilePreview();
    };

    catBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetIds = btn.getAttribute('data-target').split(/\s+/);
            const targetPanel = document.getElementById(targetIds[0]);
            const isOpen = sidebar.classList.contains('sheet-open');
            const isThisTabActive = targetIds.every((id) => {
                const panel = document.getElementById(id);

                return panel && panel.classList.contains('active-panel');
            });

            if (window.innerWidth < 768 && isOpen && isThisTabActive) {
                closeMobileSheet();
                return; 
            }

            applySettingsMode(btn.getAttribute('data-group') === 'settings');

            catBtns.forEach(b => {
                b.classList.remove('text-[#cbfb45]', 'border-[#cbfb45]', 'bg-[#cbfb45]/10');
                b.classList.add('text-gray-500', 'border-transparent');
            });
            btn.classList.remove('text-gray-500', 'border-transparent');
            btn.classList.add('text-[#cbfb45]', 'border-[#cbfb45]', 'bg-[#cbfb45]/10');

            panels.forEach(p => p.classList.remove('active-panel'));
            targetIds.forEach((id) => {
                const panel = document.getElementById(id);

                if (panel) panel.classList.add('active-panel');
            });

            if (window.innerWidth < 768) {
                sidebar.classList.remove('sheet-expanded'); // Luôn trở về mặc định 32dvh khi chuyển tab
                sidebar.classList.add('sheet-open');
                appContainer.classList.add('pushed-up');
                const statusText = document.getElementById('handle_status_text');
                if (statusText) statusText.textContent = t('handle_compact');
                btn.blur();
                fitMobilePreview();
                // Gói UX B (4/11/2026): mở Cài đặt trên mobile → mặc định chỉ hiện mục 1 cho gọn,
                // trừ khi người dùng đã tự chọn chip trong phiên này
                if (btn.getAttribute('data-group') === 'settings' && !userChoseChip) {
                    const firstChip = document.querySelector('.subtab-chip[data-target="panel-1"]');
                    if (firstChip) firstChip.click();
                }
            }
        });
    });

    // 1.1 XỬ LÝ SUB-TAB CHIP BAR (Chuyển nhanh từng panel trên Mobile & PC)
    const subtabChips = document.querySelectorAll('.subtab-chip');
    // Gói UX B (4/11/2026): nhớ khi người dùng tự tay chọn chip để không ép lại mặc định gọn
    let userChoseChip = false;
    subtabChips.forEach(chip => chip.addEventListener('pointerdown', () => { userChoseChip = true; }));
    subtabChips.forEach(chip => {
        chip.addEventListener('click', () => {
            const targetIds = chip.getAttribute('data-target').split(/\s+/);
            subtabChips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');

            if (targetIds.length === 1 && window.innerWidth >= 768) {
                // Trên PC: cuộn mượt đến panel đó nếu đang mở
                const targetEl = document.getElementById(targetIds[0]);
                if (targetEl) {
                    targetEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
            } else if (window.innerWidth < 768) {
                // Trên Mobile: ẩn các panel khác, chỉ bật panel được chọn
                sidebar.classList.remove('sheet-expanded'); // Luôn trở về mặc định 32dvh khi chuyển sub-tab
                const statusText = document.getElementById('handle_status_text');
                if (statusText) statusText.textContent = t('handle_compact');
                chip.blur();
                sidebar.scrollTop = 0;
                panels.forEach(p => {
                    if (p.id === 'panel-template' || p.id === 'panel-saved') return;
                    if (targetIds.includes(p.id)) {
                        p.classList.add('active-panel');
                    } else {
                        p.classList.remove('active-panel');
                    }
                });
                fitMobilePreview();
            }
        });
    });

    // Chỉ mở rộng Drawer khi gõ chữ (input text/textarea) để bàn phím ảo không che
    sidebar.addEventListener('focusin', (e) => {
        if (e.target.matches('input[type="text"], textarea')) {
            sidebar.classList.add('input-focused');
            fitMobilePreview();
        }
    });
    sidebar.addEventListener('focusout', (e) => {
        if (e.target.matches('input[type="text"], textarea')) {
            sidebar.classList.remove('input-focused');
            fitMobilePreview();
        }
    });

    // 1.2 BỘ CHẤM MÀU NHANH (Quick Color Swatches 1 chạm đổi màu)
    document.querySelectorAll('.swatch-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const color = btn.getAttribute('data-color');
            const wrap = btn.closest('.color-picker-wrap');
            if (!wrap || !color) return;
            const input = wrap.querySelector('input[type="color"]');
            if (input) {
                input.value = color;
                input.dispatchEvent(new Event('input', { bubbles: true }));
                input.dispatchEvent(new Event('change', { bubbles: true }));
            }
        });
    });

    // Nút trở lại: đóng sheet và khôi phục thanh tab
    const backBtn = document.getElementById('settings-back-btn');
    backBtn.addEventListener('click', () => {
        closeMobileSheet();
    });

    // 1.3 XỬ LÝ NÚT PHÓNG TO VÉ (Mobile Focus Pill)
    const focusBtn = document.getElementById('btn-focus-preview');
    if (focusBtn) {
        focusBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isFocus = document.body.classList.toggle('preview-focus-active');
            focusBtn.classList.toggle('active', isFocus);

            const zoomIcon = focusBtn.querySelector('.focus-icon-zoom');
            const shrinkIcon = focusBtn.querySelector('.focus-icon-shrink');
            const txtEl = document.getElementById('txt_focus_preview');

            if (isFocus) {
                if (zoomIcon) zoomIcon.classList.add('hidden');
                if (shrinkIcon) shrinkIcon.classList.remove('hidden');
                if (txtEl) txtEl.textContent = t('txt_focus_restore');
            } else {
                if (zoomIcon) zoomIcon.classList.remove('hidden');
                if (shrinkIcon) shrinkIcon.classList.add('hidden');
                if (txtEl) txtEl.textContent = t('txt_focus_preview');
            }
            fitMobilePreview();
        });
    }

    // 1.4 XỬ LÝ THANH KÉO ĐỔI KÍCH THƯỚC DRAWER (Sheet Drag Handle)
    const sheetHandle = document.getElementById('sheet-drag-handle');
    if (sheetHandle) {
        sheetHandle.addEventListener('click', (e) => {
            e.stopPropagation();
            if (document.body.classList.contains('preview-focus-active')) {
                document.body.classList.remove('preview-focus-active');
                if (focusBtn) {
                    focusBtn.classList.remove('active');
                    const zoomIcon = focusBtn.querySelector('.focus-icon-zoom');
                    const shrinkIcon = focusBtn.querySelector('.focus-icon-shrink');
                    const txtEl = document.getElementById('txt_focus_preview');
                    if (zoomIcon) zoomIcon.classList.remove('hidden');
                    if (shrinkIcon) shrinkIcon.classList.add('hidden');
                    if (txtEl) txtEl.textContent = t('txt_focus_preview');
                }
            } else {
                sidebar.classList.toggle('sheet-expanded');
            }
            const isExp = sidebar.classList.contains('sheet-expanded');
            const statusText = document.getElementById('handle_status_text');
            if (statusText) {
                statusText.textContent = t(isExp ? 'handle_expanded' : 'handle_compact');
            }
            fitMobilePreview();
        });
    }

    previewArea.addEventListener('click', (e) => {
        if (e.target.closest('#btn-focus-preview')) return;
        if (document.body.classList.contains('preview-focus-active')) {
            document.body.classList.remove('preview-focus-active');
            if (focusBtn) {
                focusBtn.classList.remove('active');
                const zoomIcon = focusBtn.querySelector('.focus-icon-zoom');
                const shrinkIcon = focusBtn.querySelector('.focus-icon-shrink');
                const txtEl = document.getElementById('txt_focus_preview');
                if (zoomIcon) zoomIcon.classList.remove('hidden');
                if (shrinkIcon) shrinkIcon.classList.add('hidden');
                if (txtEl) txtEl.textContent = t('txt_focus_preview');
            }
            fitMobilePreview();
            return;
        }
        if(window.innerWidth < 768 && sidebar.classList.contains('sheet-open')) {
            closeMobileSheet();
        }
    });

    // CHUYỂN CHẾ ĐỘ IN
    document.getElementsByName('print-mode').forEach(radio => {
        radio.addEventListener('change', (e) => {
            if(e.target.value === 'sequential') {
                document.getElementById('mode-sequential-input').classList.remove('hidden');
                document.getElementById('mode-custom-input').classList.add('hidden');
            } else {
                document.getElementById('mode-sequential-input').classList.add('hidden');
                document.getElementById('mode-custom-input').classList.remove('hidden');
            }
            calculateAILayout();
        });
    });
    document.getElementById('print-custom').addEventListener('input', () => calculateAILayout());

    // ĐỔI NGÔN NGỮ
    const syncLanguageButtons = () => {
        const iconClass = currentLang === 'jp'
            ? 'lang-icon lang-jp'
            : 'lang-icon lang-vn';
        const desktopIcon =
            document.getElementById('current-lang-icon');
        const mobileIcon =
            document.getElementById('mobile-lang-icon');
        const mobileLabel =
            document.getElementById('mobile-lang-label');

        if (desktopIcon) desktopIcon.className = iconClass;
        if (mobileIcon) mobileIcon.className = iconClass;
        if (mobileLabel) {
            mobileLabel.textContent =
                currentLang === 'jp' ? 'JP' : 'VN';
        }
    };

    const toggleLang = () => {
        const nextLanguage =
            currentLang === 'jp' ? 'vn' : 'jp';

        setLanguage(nextLanguage);

        syncLanguageButtons();
    };

    document
        .getElementById('lang-toggle-btn')
        .addEventListener('click', toggleLang);
    document
        .getElementById('mobile-lang-toggle-btn')
        .addEventListener('click', toggleLang);
    syncLanguageButtons();

    // TAB IN ẤN (gộp nút in — Đạt chốt 4/11/2026): không còn pop-up
    // export-modal và 2 nút in ở header; tab In mở panel-print như mọi tab
    // khác, nút "印刷 / 保存を確定" trong panel là nút in duy nhất.
    // Canh gác trình duyệt nhúng chạy ở pha capture trên thanh tab: nếu
    // guard từ chối thì chặn luôn việc chuyển tab (giữ hành vi cũ của
    // pop-up: không cho vào khu vực in trong webview nhúng).
    categoryBar.addEventListener('click', (e) => {
        const printTab = e.target.closest('.cat-btn[data-group="print"]');
        if (printTab && !guardInAppBrowserForPrint()) {
            e.stopPropagation();
            e.preventDefault();
        }
    }, true);
    // Khi tab In được mở: tính lại bố cục A4 + làm mới cảnh báo preflight.
    const printTabBtn = document.querySelector('.cat-btn[data-group="print"]');
    if (printTabBtn) {
        printTabBtn.addEventListener('click', () => {
            calculateAILayout();
            refreshPreflightUI();
        });
    }

    // IN TRANG KIỂM TRA (GĐ4 vé 4.1)
    const printTestBtn = document.getElementById('print-test-btn');
    if (printTestBtn) {
        printTestBtn.addEventListener('click', () => {
            printTestPage();
        });
    }

    // TẢI ẢNH PNG VÉ ĐƠN
    const exportPngBtn = document.getElementById('export-single-png-btn');
    if (exportPngBtn) {
        exportPngBtn.addEventListener('click', async () => {
            if (exportTicketPng) {
                exportPngBtn.disabled = true;
                const oldText = exportPngBtn.innerHTML;
                exportPngBtn.innerHTML = '<span>生成中…</span>';
                try {
                    await exportTicketPng(3.5);
                } finally {
                    exportPngBtn.disabled = false;
                    exportPngBtn.innerHTML = oldText;
                }
            }
        });
    }


    // RESIZER CHO PC
    const appWrapper = document.getElementById('app-wrapper'); 
    document.getElementById('toggle-panel-btn').addEventListener('click', () => {
        appWrapper.classList.toggle('panel-hidden');
        if(!appWrapper.classList.contains('panel-hidden')){ appContainer.style.height = ''; sidebar.style.width = ''; }
    });

    const resizer = document.getElementById('resizer'); let startX = 0, startW = 0;
    
    const dragStart = (e) => { 
        if (window.innerWidth < 768) return; 
        startX = e.clientX; 
        startW = sidebar.getBoundingClientRect().width; 
        document.body.style.userSelect = 'none'; 
        document.addEventListener('mousemove', dragMove); 
        document.addEventListener('mouseup', dragEnd); 
    };
    const dragMove = (e) => { 
        let newWidth = startW + (e.clientX - startX); 
        if (newWidth >= 250 && newWidth <= window.innerWidth / 1.5) { sidebar.style.width = `${newWidth}px`; sidebar.style.flex = 'none'; } 
    };
    const dragEnd = () => { 
        document.body.style.userSelect = ''; 
        document.removeEventListener('mousemove', dragMove); 
        document.removeEventListener('mouseup', dragEnd); 
    };
    resizer.addEventListener('mousedown', dragStart);

    window.addEventListener('resize', fitMobilePreview);
    window.addEventListener('orientationchange', fitMobilePreview);

    if (window.visualViewport) {
        window.visualViewport.addEventListener(
            'resize',
            fitMobilePreview
        );
    }

    if (window.ResizeObserver) {
        const mobilePreviewObserver = new ResizeObserver(
            fitMobilePreview
        );
        mobilePreviewObserver.observe(masterTicket);
        mobilePreviewObserver.observe(sidebar);
    }

    // Gói UX A (4/11/2026): trên mobile, mở sẵn khay ở tab Mẫu khi vào app
    // để danh sách mẫu hiện ngay trong tầm mắt, không phải đoán thao tác mở khay
    if (window.innerWidth < 768 && !sidebar.classList.contains('sheet-open')) {
        const designBtn = document.querySelector('.cat-btn[data-group="design"]');
        if (designBtn) designBtn.click();
    }

    fitMobilePreview();
});