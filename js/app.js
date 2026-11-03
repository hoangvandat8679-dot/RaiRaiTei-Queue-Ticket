/**
 * RaiRaiTei Queue Ticket Studio — điểm vào duy nhất (R1: ES Modules).
 * Nạp mọi module theo đúng thứ tự script cổ điển trước đây (thứ tự này
 * quyết định thứ tự chạy các trình nghe DOMContentLoaded). Từ R1, các
 * module trao đổi qua import/export; window chỉ còn giữ:
 *  - các thư viện vendor UMD (html2canvas, htmlToImage, jspdf),
 *  - namespace công khai duy nhất window.RaiRaiTeiApp dưới đây, dành cho
 *    kiểm thử tự động và gỡ lỗi ở console — KHÔNG dùng để liên lạc nội bộ.
 */
import './core/signal.js';
import { ticketStore } from './core/store.js';
import { t, applyTranslations, setLanguage, currentLang, translations } from './i18n.js';
import { calculateAILayout, parseCustomRange, layoutConfig } from './layout-sync.js';
import { imageState } from './image-editor.js';
import './ui-events.js';
import { applyControlPreset } from './controls.js';
import { TemplateRegistry } from './registry/template-registry.js';
import { ticketDrag } from './ticket-drag.js';
import { designHistory } from './design-history.js';
import { PresetManager } from './storage/preset-manager.js';
import { DraftManager } from './storage/draft-manager.js';
import { exportTicketPng, toggleThermalPreview, isCropMarksEnabled, drawPdfCropMarks, generateCropMarksSvg, isMobilePrintDevice } from './export.js';
import { PrintCheck, runPrintPreflight, refreshPreflightUI, printTestPage } from './print-check.js';

window.RaiRaiTeiApp = {
    ticketStore,
    t,
    applyTranslations,
    setLanguage,
    get currentLang() { return currentLang; },
    translations,
    calculateAILayout,
    parseCustomRange,
    get layoutConfig() { return layoutConfig; },
    imageState,
    applyControlPreset,
    TemplateRegistry,
    ticketDrag,
    designHistory,
    PresetManager,
    DraftManager,
    exportTicketPng,
    toggleThermalPreview,
    isCropMarksEnabled,
    drawPdfCropMarks,
    generateCropMarksSvg,
    isMobilePrintDevice,
    PrintCheck,
    runPrintPreflight,
    refreshPreflightUI,
    printTestPage
};
