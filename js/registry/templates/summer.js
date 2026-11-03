/**
 * RaiRaiTei Queue Ticket Studio — Summer Template Definition
 * Mẫu vé Mùa Hè giới hạn (Lễ Hội Matsuri / Hiyashi Chuka)
 * Nguồn tài nguyên: https://github.com/hoangvandat8679-dot/assets-images (Mùa Hè.svg)
 */

(function (global) {
  const SummerTemplate = {
    id: 'summer',
    name: {
      ja: '夏限定（祭り・ひまわり）',
      vi: 'Mẫu Mùa Hè (Lễ Hội & Hướng Dương)',
      en: 'Summer Festival Limited'
    },
    badge: 'SUMMER',
    bodyClass: 'summer-template',
    datasetTemplate: 'summer',
    bgImage: "url('assets/templates/summer.svg')",

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

    // Bảng màu Mùa Hè
    colors: {
      'bg-color': '#fffbe8',
      'number-color': '#d90012',
      'number-bg-color': '#ffffff',
      'number-border-color': '#ff9900',
      'msg-color': '#111111',
      'branch-color': '#ffffff',
      'branch-bg': '#d90012'
    },

    // Phông chữ Mùa Hè
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

  global.SummerTemplate = SummerTemplate;
  if (global.TemplateRegistry) {
    global.TemplateRegistry.register(SummerTemplate);
  }
})(typeof window !== 'undefined' ? window : this);
