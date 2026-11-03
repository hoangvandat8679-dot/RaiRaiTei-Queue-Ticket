/**
 * RaiRaiTei Queue Ticket Studio — Standard Template Definition
 * Mẫu vé Chuẩn RaiRaiTei (Truyền thống / Tiêu chuẩn vàng)
 */

export const StandardTemplate = {
  id: 'standard',
  name: {
    ja: '定番（基本）',
    vi: 'Mẫu Chuẩn (Tiêu chuẩn)',
    en: 'Standard Official'
  },
  badge: 'STANDARD',
  bodyClass: '',
  datasetTemplate: '',
  bgImage: null,

  // Preset thông số phần tử
  preset: null, // Dùng preset mặc định

  // Màu sắc mặc định
  colors: {
    'bg-color': '#fcd116',
    'number-color': '#e60012',
    'number-bg-color': '#ffffff',
    'number-border-color': '#e60012',
    'msg-color': '#111111',
    'branch-color': '#ffffff',
    'branch-bg': '#e60012'
  },

  // Phông chữ mặc định
  fonts: {
    'number-font-select': "'Impact', 'Anton', sans-serif",
    'msg-font': "'Noto Sans JP', sans-serif",
    'msg-weight': '700',
    'branch-font': "'Noto Sans JP', sans-serif",
    'branch-weight': '900'
  },

  // Trạng thái bật/tắt các công cụ (Tool Toggles)
  tools: {
    'background-tool-toggle': { checked: true, disabled: false },
    'border-tool-toggle': { checked: true, disabled: false },
    'mascot-tool-toggle': { checked: true, disabled: false },
    'frame-tool-toggle': { checked: true, disabled: false },
    'number-tool-toggle': { checked: true, disabled: false },
    'message-tool-toggle': { checked: true, disabled: false },
    'branch-tool-toggle': { checked: true, disabled: false }
  },

  // Các điều khiển bị khóa
  locks: {
    borderControls: false,
    staticArtControls: false
  }
};

