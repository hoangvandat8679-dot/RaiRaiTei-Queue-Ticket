/**
 * RaiRaiTei Queue Ticket Studio — Autumn Template Definition
 * Mẫu vé Mùa Thu giới hạn (Lá phong Momiji / Ngắm trăng Otsukimi)
 * Nguồn tài nguyên: https://github.com/hoangvandat8679-dot/assets-images (Mùa Thu.svg)
 */

export const AutumnTemplate = {
  id: 'autumn',
  name: {
    ja: '秋限定（紅葉・月見）',
    vi: 'Mùa Thu (Lá Đỏ & Ngắm Trăng)',
    en: 'Autumn Maple Limited'
  },
  badge: 'AUTUMN',
  bodyClass: 'autumn-template',
  datasetTemplate: 'autumn',
  bgImage: "url('assets/templates/autumn.svg')",

  // Preset thông số phần tử chuẩn xác theo lớp vector
  preset: {
    'bg-opacity': 1,
    'cut-margin-x': 1.0,
    'cut-margin-y': 1.0,
    'mascot-width': 67,
    'mascot-y': -1.0,
    'number-size': 110,
    'number-offset-y': 0.0,
    'frame-width': 34.0,
    'frame-height': 36.0,
    'frame-y': 21.3,
    'msg-size': 7.5,
    'msg-y': 7.0,
    'branch-size': 6.5,
    'branch-y': 2.0,
    'branch-width': 73,
    'branch-pad-y': 0.5,
    'branch-radius': 0
  },

  // Kích thước vé
  coreDimensions: {
    width: '43.0',
    height: '78.0'
  },

  // Bảng màu Mùa Thu
  colors: {
    'bg-color': '#fff5eb',
    'number-color': '#e10000',
    'number-bg-color': '#ffffff',
    'number-border-color': '#d97706',
    'msg-color': '#111111',
    'branch-color': '#ffffff',
    'branch-bg': '#b45309'
  },

  // Phông chữ Mùa Thu
  fonts: {
    'number-font-select': "'Times New Roman', 'Noto Serif JP', serif",
    'msg-font': "'Noto Sans JP', sans-serif",
    'branch-font': "'Noto Sans JP', sans-serif"
  },

  // Trạng thái bật/tắt các công cụ (Tool Toggles)
  tools: {
    'background-tool-toggle': { checked: true, disabled: false },
    'border-tool-toggle': { checked: false, disabled: true },
    'mascot-tool-toggle': { checked: true, disabled: false },
    'frame-tool-toggle': { checked: true, disabled: false },
    'number-tool-toggle': { checked: true, disabled: false },
    'message-tool-toggle': { checked: true, disabled: false },
    'branch-tool-toggle': { checked: true, disabled: false }
  },

  // Các điều khiển bị khóa
  locks: {
    borderControls: true,
    staticArtControls: false
  }
};

