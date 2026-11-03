import { t } from './i18n.js';

// Canh gác in ấn trong trình duyệt nhúng (Messenger/Facebook/LINE/Zalo…):
// các webview này in/chia sẻ PDF rất kém, nên chặn in và nhắc mở bằng
// Chrome/Safari. Tách thành module lá riêng để ui-events.js và
// print/print.js cùng import mà không tạo vòng phụ thuộc (trước đây
// print.js import hàm này từ ui-events trong khi ui-events import
// exportTicketPng từ print.js — vòng import thứ hai trong app).

export function detectInAppBrowserForPrint() {
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
        return t('in_app_browser_generic');
    }

    if (
        isIOS &&
        !/Safari|CriOS|FxiOS|EdgiOS|OPiOS|CocCoc|DuckDuckGo/i
            .test(userAgent)
    ) {
        return t('in_app_browser_generic');
    }

    return null;
};

export function guardInAppBrowserForPrint() {
    const browserName = detectInAppBrowserForPrint();

    if (!browserName) return true;

    alert(
        t(
            'in_app_browser_warning',
            { browser: browserName }
        )
    );
    return false;
};

