/**
 * RaiRaiTei Queue Ticket Studio — Winter Template Definition
 * Mẫu vé Mùa Đông giới hạn (Bông tuyết Yukimi / Lễ hội ánh sáng)
 * Nguồn tài nguyên: https://github.com/hoangvandat8679-dot/assets-images (Mùa Đông.svg)
 */

export const WinterTemplate = {
  id: 'winter',
  name: {
    ja: '冬限定（雪・イルミネーション）',
    vi: 'Mùa Đông (Tuyết & Ánh Sáng)',
    en: 'Winter Snow Limited'
  },
  badge: 'WINTER',
  bodyClass: 'winter-template',
  datasetTemplate: 'winter',
  bgImage: "url('assets/templates/winter.svg')",

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

  // Bảng màu Mùa Đông
  colors: {
    'bg-color': '#f0f9ff',
    'number-color': '#d80000',
    'number-bg-color': '#ffffff',
    'number-border-color': '#0284c7',
    'msg-color': '#0f172a',
    'branch-color': '#ffffff',
    'branch-bg': '#0369a1'
  },

  // Phông chữ Mùa Đông
  fonts: {
    'number-font-select': "'Impact', sans-serif",
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

