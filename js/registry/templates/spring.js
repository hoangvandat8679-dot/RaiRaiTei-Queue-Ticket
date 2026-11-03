/**
 * RaiRaiTei Queue Ticket Studio — Spring Limited Template Definition
 * Mẫu vé Mùa Xuân giới hạn (Hoa anh đào, linh vật Kimono)
 */

export const SpringTemplate = {
  id: 'spring',
  name: {
    ja: '春限定（桜デザイン）',
    vi: 'Mẫu Mùa Xuân (Hoa Anh Đào)',
    en: 'Spring Blossom Limited'
  },
  badge: 'SPRING',
  bodyClass: 'spring-template',
  datasetTemplate: 'spring',
  bgImage: "url('assets/images/templates/spring-background.png')",

  // Preset thông số phần tử chuẩn xác
  preset: {
    'bg-opacity': 1,
    'cut-margin-x': 1.0,
    'cut-margin-y': 1.0,
    'mascot-width': 67.2,
    'mascot-y': -1.1,
    'number-size': 108,
    'number-offset-y': 0.4,
    'frame-width': 40.0,
    'frame-height': 35.0,
    'frame-y': 22.8,
    'msg-size': 8,
    'msg-y': 6.4,
    'branch-size': 6,
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

  // Bảng màu Mùa Xuân
  colors: {
    'bg-color': '#fff9f2',
    'number-color': '#ed5793',
    'number-bg-color': '#ffffff',
    'number-border-color': '#d5ad45',
    'msg-color': '#111111',
    'branch-color': '#ffffff',
    'branch-bg': '#ec5a8b'
  },

  // Phông chữ Mùa Xuân
  fonts: {
    'number-font-select': "'Times New Roman', 'Noto Serif JP', serif",
    'msg-font': "'Noto Sans JP', sans-serif",
    'branch-font': "'Noto Sans JP', sans-serif"
  },

  // Trạng thái bật/tắt các công cụ (Tool Toggles)
  tools: {
    'background-tool-toggle': { checked: true, disabled: true },
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
    staticArtControls: true
  }
};

