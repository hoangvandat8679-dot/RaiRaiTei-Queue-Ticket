/**
 * RaiRaiTei Queue Ticket Studio — Summer Template Definition
 * Mẫu vé Mùa Hè giới hạn (Lễ Hội Matsuri / Hiyashi Chuka)
 * Nguồn tài nguyên: https://github.com/hoangvandat8679-dot/assets-images (Mùa Hè.svg)
 */

export const SummerTemplate = {
  id: 'summer',
  name: {
    ja: '夏限定（祭り・ひまわり）',
    vi: 'Mẫu Mùa Hè (Lễ Hội & Hướng Dương)',
    en: 'Summer Festival Limited'
  },
  badge: 'SUMMER',
  bodyClass: 'summer-template',
  datasetTemplate: 'summer',
  bgImage: "url('../assets/templates/summer.svg')",
  mascotImage: 'assets/images/templates/summer-mascot.png',
  msgLineHeight: 1.16,

  // Preset thông số phần tử chuẩn xác theo lớp vector
  preset: {
    'bg-opacity': 1,
    'cut-margin-x': 1.0,
    'cut-margin-y': 1.0,
    'mascot-width': 31.5,
    'mascot-y': 5.1,
    'number-size': 82,
    'number-offset-y': -1.1,
    'frame-width': 36.7,
    'frame-height': 35.9,
    'frame-y': 21.5,
    'msg-size': 6.4,
    'msg-y': 8.2,
    'branch-size': 5.3,
    'branch-y': 3.5,
    'branch-width': 76,
    'branch-pad-y': 0.4,
    'branch-radius': 1.4
  },

  // Kích thước vé
  coreDimensions: {
    width: '43.0',
    height: '78.0'
  },

  // Bảng màu Mùa Hè
  colors: {
    'bg-color': '#fffbe8',
    'number-color': '#d90012',
    'number-bg-color': '#ffffff',
    'number-border-color': '#d90012',
    'msg-color': '#ffffff',
    'branch-color': '#ffffff',
    'branch-bg': '#db0010'
  },

  // Phông chữ Mùa Hè
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

