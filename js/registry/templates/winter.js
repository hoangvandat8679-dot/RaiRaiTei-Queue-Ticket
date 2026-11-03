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
  bgImage: "url('../assets/templates/winter.svg')",
  mascotImage: 'assets/images/templates/winter-mascot.png',

  // Preset thông số phần tử chuẩn xác theo lớp vector
  preset: {
    'bg-opacity': 1,
    'cut-margin-x': 1.0,
    'cut-margin-y': 1.0,
    'mascot-width': 30.8,
    'mascot-y': 5.9,
    'number-size': 74,
    'number-offset-y': -1.4,
    'frame-width': 36.2,
    'frame-height': 35.7,
    'frame-y': 21.8,
    'msg-size': 6.4,
    'msg-y': 8.0,
    'branch-size': 6.5,
    'branch-y': 3.8,
    'branch-width': 75,
    'branch-pad-y': 0.15,
    'branch-radius': 1.4
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
    'number-border-color': '#023882',
    'msg-color': '#ffffff',
    'branch-color': '#ffffff',
    'branch-bg': '#d40009'
  },

  // Phông chữ Mùa Đông
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

