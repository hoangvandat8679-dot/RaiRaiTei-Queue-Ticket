/**
 * RaiRaiTei Queue Ticket Studio — Central Ticket Store
 * Single Source of Truth sử dụng TicketSignal.
 * Từ R3 store là nơi duy nhất giữ độ lệch kéo thả; không còn adapter
 * hai chiều với input ẩn trong DOM (đã tháo cùng đợt R3).
 */

import { signal, effect } from './signal.js';

// 1. Khởi tạo các Signals chính của Store
const templateId = signal('standard');
  
// Tọa độ và trạng thái các phần tử động (mm & scale)
const elements = {
  frame: {
    dx: signal(0),
    dy: signal(0),
    scale: signal(1.0),
    visible: signal(true)
  },
  number: {
    dx: signal(0),
    dy: signal(0),
    scale: signal(1.0),
    value: signal('22')
  },
  mascot: {
    dx: signal(0),
    dy: signal(0),
    scale: signal(1.0),
    visible: signal(true)
  },
  msg: {
    dx: signal(0),
    dy: signal(0),
    scale: signal(1.0)
  },
  branch: {
    dx: signal(0),
    dy: signal(0),
    scale: signal(1.0)
  }
};

// Studio & Zoom
const studio = {
  zoom: signal(1.0),
  activeDragElement: signal(null),
  showSafeZone: signal(true)
};

// 2. Các Actions hỗ trợ thao tác an toàn
const actions = {
  setElementOffset(name, dx, dy) {
    if (!elements[name]) return;
    if (typeof dx === 'number') elements[name].dx.set(dx);
    if (typeof dy === 'number') elements[name].dy.set(dy);
  },

  setElementScale(name, scale) {
    if (!elements[name] || typeof scale !== 'number') return;
    elements[name].scale.set(scale);
  },

  setTemplate(id) {
    templateId.set(id);
  },

  getSnapshot() {
    const snap = {
      templateId: templateId.peek(),
      elements: {}
    };
    for (const [key, val] of Object.entries(elements)) {
      snap.elements[key] = {
        dx: val.dx.peek(),
        dy: val.dy.peek(),
        scale: val.scale ? val.scale.peek() : 1.0
      };
    }
    return snap;
  },

  applySnapshot(snap) {
    if (!snap) return;
    {
      if (snap.templateId) templateId.set(snap.templateId);
      if (snap.elements) {
        for (const [key, data] of Object.entries(snap.elements)) {
          if (elements[key]) {
            if (typeof data.dx === 'number') elements[key].dx.set(data.dx);
            if (typeof data.dy === 'number') elements[key].dy.set(data.dy);
            if (typeof data.scale === 'number' && elements[key].scale) {
              elements[key].scale.set(data.scale);
            }
          }
        }
      }
    }
  }
};

export const ticketStore = {
  templateId,
  elements,
  studio,
  actions
};
