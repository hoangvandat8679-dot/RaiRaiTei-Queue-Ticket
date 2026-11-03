import { ticketStore } from '../core/store.js';
import { applyControlPreset } from '../controls.js';
import { calculateAILayout } from '../layout-sync.js';
import { ticketDrag } from '../ticket-drag.js';
import { applyTemplateMascot } from '../image-editor.js';
import { StandardTemplate } from './templates/standard.js';
import { SpringTemplate } from './templates/spring.js';
import { SummerTemplate } from './templates/summer.js';
import { AutumnTemplate } from './templates/autumn.js';
import { WinterTemplate } from './templates/winter.js';

/**
 * RaiRaiTei Queue Ticket Studio — Template Registry Engine
 * Quản lý vòng đời, đăng ký và kích hoạt các mẫu thiết kế vé
 */

const templates = new Map();
let activeTemplateId = 'standard';

const borderControlIds = [
  'border-tool-toggle',
  'border-width',
  'dot-density',
  'dot-size-1',
  'dot-size-2',
  'dot-offset'
];

const springStaticArtControlIds = [
  'bg-color',
  'bg-opacity',
  'number-bg-color',
  'number-border-color',
  'number-border-width',
  'branch-bg',
  'branch-radius'
];

// Helper cập nhật input giá trị
const setInputValue = (id, value, eventName = 'input') => {
  const input = document.getElementById(id);
  if (!input) return;
  input.value = value;
  if (typeof Event !== 'undefined') {
    input.dispatchEvent(new Event(eventName, { bubbles: true }));
  }
};

// Helper cập nhật toggle tool
const setToolState = (id, checked, disabled = false) => {
  const toggle = document.getElementById(id);
  if (!toggle) return;
  toggle.checked = checked;
  toggle.disabled = disabled;
  if (typeof Event !== 'undefined') {
    toggle.dispatchEvent(new Event('change', { bubbles: true }));
  }
};

// Helper vô hiệu hóa control
const setControlDisabled = (id, disabled) => {
  const control = document.getElementById(id);
  if (control) control.disabled = disabled;

  const valueControl = document.getElementById(`${id}-val`);
  if (valueControl) {
    valueControl.disabled = disabled;
    valueControl.parentElement?.querySelectorAll('button').forEach((button) => {
      button.disabled = disabled;
    });
  }
};

const TemplateRegistry = {
  register(templateDef) {
    if (!templateDef || !templateDef.id) {
      console.warn('[TemplateRegistry] Định nghĩa mẫu không hợp lệ:', templateDef);
      return;
    }
    templates.set(templateDef.id, templateDef);
    console.log(`[TemplateRegistry] Đã đăng ký mẫu: "${templateDef.id}"`);
  },

  get(id) {
    return templates.get(id);
  },

  getAll() {
    return Array.from(templates.values());
  },

  getActiveId() {
    return activeTemplateId;
  },

  apply(templateId) {
    const tpl = templates.get(templateId);
    if (!tpl) {
      console.error(`[TemplateRegistry] Không tìm thấy mẫu với id: "${templateId}"`);
      return false;
    }

    const masterTicketInner = document.getElementById('master-ticket-inner');
    if (!masterTicketInner) return false;

    activeTemplateId = templateId;

    // 1. Cập nhật class và dataset trên DOM
    const allSeasonalClasses = ['spring-template', 'summer-template', 'autumn-template', 'winter-template'];
    allSeasonalClasses.forEach((cls) => masterTicketInner.classList.remove(cls));

    if (tpl.bodyClass) {
      masterTicketInner.classList.add(tpl.bodyClass);
    }

    if (tpl.datasetTemplate) {
      document.body.dataset.template = tpl.datasetTemplate;
    } else {
      delete document.body.dataset.template;
    }

    // 2. Cập nhật ảnh nền --bg-image
    if (tpl.bgImage) {
      document.body.style.setProperty('--bg-image', tpl.bgImage);
    } else {
      document.body.style.removeProperty('--bg-image');
    }

    // 3. Áp dụng Presets thông số
    applyControlPreset(tpl.preset || undefined);

    // 4. Khôi phục tọa độ kéo thả
    ticketDrag?.resetAll();

    // 5. Kích thước Core (nếu có)
    if (tpl.coreDimensions) {
      if (tpl.coreDimensions.width) setInputValue('core-width-input', tpl.coreDimensions.width);
      if (tpl.coreDimensions.height) setInputValue('core-height-input', tpl.coreDimensions.height);
    }

    // 6. Màu sắc
    if (tpl.colors) {
      for (const [id, color] of Object.entries(tpl.colors)) {
        setInputValue(id, color);
      }
    }

    // 7. Phông chữ
    if (tpl.fonts) {
      for (const [id, font] of Object.entries(tpl.fonts)) {
        setInputValue(id, font, 'change');
      }
    }

    // 8. Linh vật: mẫu tách lớp có linh vật riêng (mascotImage) thì nạp ảnh
    // của mẫu; còn lại đặt lại linh vật mặc định như trước.
    if (tpl.mascotImage) {
      applyTemplateMascot(tpl.mascotImage);
    } else {
      applyTemplateMascot(null);
      const defaultMascot = document.querySelector('input[name="mascot-type"][value="default"]');
      if (defaultMascot) {
        defaultMascot.checked = true;
        defaultMascot.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }

    // 9. Công cụ bật/tắt (Tools)
    if (tpl.tools) {
      for (const [id, state] of Object.entries(tpl.tools)) {
        setToolState(id, state.checked, state.disabled || false);
      }
    }

    // 10. Các khóa điều khiển (Locks)
    const lockBorder = tpl.locks ? !!tpl.locks.borderControls : false;
    const lockStatic = tpl.locks ? !!tpl.locks.staticArtControls : false;

    borderControlIds.forEach((id) => setControlDisabled(id, lockBorder));
    springStaticArtControlIds.forEach((id) => setControlDisabled(id, lockStatic));

    // 11. Đồng bộ sang Central TicketStore
    if (ticketStore && ticketStore.actions) {
      ticketStore.actions.setTemplate(templateId);
    }

    // 12. Cập nhật trạng thái nút bấm giao diện
    document.querySelectorAll('[data-template]').forEach((button) => {
      const isSelected = button.dataset.template === templateId;
      button.classList.toggle('is-selected', isSelected);
      button.setAttribute('aria-pressed', String(isSelected));
    });

    // 13. Tính toán lại bố cục
    calculateAILayout();

    console.log(`✅ [TemplateRegistry] Đã kích hoạt thành công mẫu: "${tpl.name?.vi || templateId}"`);
    return true;
  },

  initButtons() {
    document.querySelectorAll('[data-template]').forEach((btn) => {
      // Tránh gắn trùng listener nếu đã có
      if (!btn.dataset.registryBound) {
        btn.dataset.registryBound = 'true';
        btn.addEventListener('click', () => {
          const tid = btn.dataset.template;
          if (tid) TemplateRegistry.apply(tid);
        });
      }
    });
    // Đồng bộ trạng thái active nút hiện tại
    document.querySelectorAll('[data-template]').forEach((button) => {
      const isSelected = button.dataset.template === activeTemplateId;
      button.classList.toggle('is-selected', isSelected);
      button.setAttribute('aria-pressed', String(isSelected));
    });
  }
};

// Đăng ký 5 mẫu đi cùng app
[StandardTemplate, SpringTemplate, SummerTemplate, AutumnTemplate, WinterTemplate]
  .forEach((tpl) => TemplateRegistry.register(tpl));

export { TemplateRegistry };

// Tự động khởi tạo khi DOM sẵn sàng
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      TemplateRegistry.initButtons();
    });
  } else {
    TemplateRegistry.initButtons();
  }
}

