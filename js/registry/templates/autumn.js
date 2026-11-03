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
  bgImage: "url('../assets/templates/autumn.svg')",
  mascotImage: 'assets/images/templates/autumn-mascot.png',
  msgLineHeight: 0.98,

  // Preset thông số phần tử chuẩn xác theo lớp vector
  preset: {
    'bg-opacity': 1,
    'cut-margin-x': 1.0,
    'cut-margin-y': 1.0,
    'mascot-width': 30.8,
    'mascot-y': 5.7,
    'number-size': 74,
    'number-offset-y': -1.3,
    'frame-width': 36.5,
    'frame-height': 35.7,
    'frame-y': 21.8,
    'msg-size': 7.6,
    'msg-y': 8.1,
    'branch-size': 5.3,
    'branch-y': 3.8,
    'branch-width': 75,
    'branch-pad-y': 0.4,
    'branch-radius': 1.4
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
    'number-border-color': '#c70000',
    'msg-color': '#111111',
    'branch-color': '#ffffff',
    'branch-bg': '#d0010a'
  },

  // Phông chữ Mùa Thu
  fonts: {
    'number-font-select': "'Impact', 'Anton', sans-serif",
    'msg-font': "'M PLUS Rounded 1c', 'Noto Sans JP', sans-serif",
    'msg-weight': '900',
    'branch-font': "'M PLUS Rounded 1c', 'Noto Sans JP', sans-serif",
    'branch-weight': '900'
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

