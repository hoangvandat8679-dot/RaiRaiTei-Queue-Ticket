window.detectInAppBrowserForPrint = function() {
    const userAgent =
        navigator.userAgent || navigator.vendor || '';
    const isIOS =
        /iPad|iPhone|iPod/i.test(userAgent) ||
        (
            navigator.platform === 'MacIntel' &&
            navigator.maxTouchPoints > 1
        );
    const isAndroid = /Android/i.test(userAgent);
    const isMobile = isIOS || isAndroid;

    if (!isMobile) return null;

    const embeddedBrowsers = [
        {
            pattern:
                /FBAN\/MessengerForiOS|MessengerForiOS|FB_IAB\/Messenger/i,
            name: 'Messenger'
        },
        {
            pattern: /FBAN|FBAV|FB_IAB|FB4A/i,
            name: 'Facebook'
        },
        {
            pattern: /Line\/|LIFF/i,
            name: 'LINE'
        },
        {
            pattern: /Instagram/i,
            name: 'Instagram'
        },
        {
            pattern: /Zalo/i,
            name: 'Zalo'
        },
        {
            pattern: /TikTok|musical_ly/i,
            name: 'TikTok'
        },
        {
            pattern: /MicroMessenger/i,
            name: 'WeChat'
        },
        {
            pattern: /Telegram/i,
            name: 'Telegram'
        }
    ];

    const knownBrowser = embeddedBrowsers.find(
        ({ pattern }) => pattern.test(userAgent)
    );

    if (knownBrowser) return knownBrowser.name;

    if (
        isAndroid &&
        (
            /;\s*wv\)/i.test(userAgent) ||
            /Version\/\d+(?:\.\d+)*\s+Chrome\/.*Mobile Safari/i
                .test(userAgent)
        )
    ) {
        return window.t('in_app_browser_generic');
    }

    if (
        isIOS &&
        !/Safari|CriOS|FxiOS|EdgiOS|OPiOS|CocCoc|DuckDuckGo/i
            .test(userAgent)
    ) {
        return window.t('in_app_browser_generic');
    }

    return null;
};

window.guardInAppBrowserForPrint = function() {
    const browserName = window.detectInAppBrowserForPrint();

    if (!browserName) return true;

    alert(
        window.t(
            'in_app_browser_warning',
            { browser: browserName }
        )
    );
    return false;
};

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

    const fitMobilePreview = () => {
        cancelAnimationFrame(mobileFitFrame);

        mobileFitFrame = requestAnimationFrame(() => {
            if (window.innerWidth >= 768) {
                appContainer.style.removeProperty(
                    '--mobile-preview-height'
                );
                appContainer.style.removeProperty(
                    '--mobile-ticket-scale'
                );
                return;
            }

            const previewRect = previewArea.getBoundingClientRect();
            const categoryRect = categoryBar.getBoundingClientRect();
            const sheetIsOpen =
                sidebar.classList.contains('sheet-open');
            const visibleBottom = sheetIsOpen
                ? categoryRect.top - sidebar.offsetHeight
                : categoryRect.top;
            const availableHeight = Math.max(
                120,
                visibleBottom - previewRect.top
            );
            const availableWidth = Math.max(
                120,
                previewArea.clientWidth
            );
            const ticketWidth = Math.max(1, masterTicket.offsetWidth);
            const ticketHeight = Math.max(1, masterTicket.offsetHeight);

            /*
              Chừa 16 px ở trên và dưới để đường cắt không nằm dưới
              bóng của thanh tab hoặc sát mép màn hình Safari.
            */
            const safePadding = 32;
            const scale = Math.max(
                0.35,
                Math.min(
                    (availableWidth - safePadding) / ticketWidth,
                    (availableHeight - safePadding) / ticketHeight,
                    1.8
                )
            );

            appContainer.style.setProperty(
                '--mobile-preview-height',
                availableHeight + 'px'
            );
            appContainer.style.setProperty(
                '--mobile-ticket-scale',
                scale.toFixed(4)
            );
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
        sidebar.classList.remove('sheet-open');
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
                sidebar.classList.add('sheet-open');
                appContainer.classList.add('pushed-up');
                fitMobilePreview();
            }
        });
    });

    // Nút trở lại: đóng sheet và khôi phục thanh tab
    const backBtn = document.getElementById('settings-back-btn');
    backBtn.addEventListener('click', () => {
        closeMobileSheet();
    });

    previewArea.addEventListener('click', () => {
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
            window.calculateAILayout();
        });
    });
    document.getElementById('print-custom').addEventListener('input', () => window.calculateAILayout());

    // ĐỔI NGÔN NGỮ
    const syncLanguageButtons = () => {
        const iconClass = window.currentLang === 'jp'
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
                window.currentLang === 'jp' ? 'JP' : 'VN';
        }
    };

    const toggleLang = () => {
        const nextLanguage =
            window.currentLang === 'jp' ? 'vn' : 'jp';

        if (window.setLanguage) {
            window.setLanguage(nextLanguage);
        } else {
            window.currentLang = nextLanguage;
            if (window.applyTranslations) window.applyTranslations();
        }

        syncLanguageButtons();
    };

    document
        .getElementById('lang-toggle-btn')
        .addEventListener('click', toggleLang);
    document
        .getElementById('mobile-lang-toggle-btn')
        .addEventListener('click', toggleLang);
    syncLanguageButtons();

    // MỞ/ĐÓNG POP-UP XUẤT FILE
    const exportModal = document.getElementById('export-modal');
    const openModal = () => {
        if (
            window.guardInAppBrowserForPrint &&
            !window.guardInAppBrowserForPrint()
        ) {
            return;
        }

        exportModal.classList.remove('hidden');
        exportModal.classList.add('flex');
        window.calculateAILayout();
    };
    const closeModal = () => { exportModal.classList.add('hidden'); exportModal.classList.remove('flex'); };
    
    document.getElementById('mobile-print-btn').addEventListener('click', openModal);
    const topPrintBtn =
        document.getElementById('pc-top-print-btn') ||
        document.getElementById('design-print-btn');

    if (topPrintBtn) {
        topPrintBtn.addEventListener('click', openModal);
    }
    document.getElementById('close-export-modal').addEventListener('click', closeModal);
    exportModal.addEventListener('click', (e) => { if(e.target === exportModal) closeModal(); });

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

    fitMobilePreview();
});