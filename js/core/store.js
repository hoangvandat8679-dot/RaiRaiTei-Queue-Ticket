/**
 * RaiRaiTei Queue Ticket Studio — Central Ticket Store
 * Single Source of Truth sử dụng TicketSignal
 * Đi kèm Adapter 2 chiều tương thích 100% với hệ thống DOM input cũ (#drag-offset-store)
 */

(function (global) {
  const { signal, effect } = global.TicketSignal || {};

  if (!signal) {
    console.error('[TicketStore] Lỗi: TicketSignal chưa được nạp!');
    return;
  }

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

  // Cờ chống đệ quy giữa Store và DOM Adapter
  let isInternalSync = false;

  // 2. Các Actions hỗ trợ thao tác an toàn
  const actions = {
    setElementOffset(name, dx, dy) {
      if (!elements[name]) return;
      isInternalSync = true;
      try {
        if (typeof dx === 'number') elements[name].dx.set(dx);
        if (typeof dy === 'number') elements[name].dy.set(dy);
      } finally {
        isInternalSync = false;
      }
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
      isInternalSync = true;
      try {
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
      } finally {
        isInternalSync = false;
      }
    }
  };

  // 3. Adapter Tương Thích Ngược 2 Chiều với #drag-offset-store
  function initLegacyDOMAdapter() {
    const fieldMapping = [
      { key: 'frame', xId: 'drag-frame-dx', yId: 'drag-frame-dy' },
      { key: 'number', xId: 'drag-number-dx', yId: 'drag-number-dy' },
      { key: 'mascot', xId: 'drag-mascot-dx', yId: 'drag-mascot-dy' },
      { key: 'msg', xId: 'drag-msg-dx', yId: 'drag-msg-dy' },
      { key: 'branch', xId: 'drag-branch-dx', yId: 'drag-branch-dy' }
    ];

    fieldMapping.forEach(({ key, xId, yId }) => {
      const xInput = document.getElementById(xId);
      const yInput = document.getElementById(yId);

      // (A) Khi Store đổi -> Tự động ghi lại vào input DOM để code cũ đọc được
      effect(() => {
        const dx = elements[key].dx.get();
        const dy = elements[key].dy.get();

        if (isInternalSync) return;

        if (xInput && parseFloat(xInput.value) !== dx) {
          xInput.value = dx;
        }
        if (yInput && parseFloat(yInput.value) !== dy) {
          yInput.value = dy;
        }
      });

      // (B) Khi code cũ ghi vào input DOM hoặc dispatch sự kiện -> Cập nhật ngược vào Store
      const onDOMInput = () => {
        if (isInternalSync) return;
        const dx = xInput ? parseFloat(xInput.value) || 0 : 0;
        const dy = yInput ? parseFloat(yInput.value) || 0 : 0;
        actions.setElementOffset(key, dx, dy);
      };

      if (xInput) {
        xInput.addEventListener('input', onDOMInput);
        xInput.addEventListener('change', onDOMInput);
      }
      if (yInput) {
        yInput.addEventListener('input', onDOMInput);
        yInput.addEventListener('change', onDOMInput);
      }
    });

    console.log('✅ [TicketStore] Legacy DOM Adapter đã kích hoạt thành công (Two-way sync sẵn sàng).');
  }

  // Tự động kích hoạt adapter khi DOM sẵn sàng
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLegacyDOMAdapter);
  } else {
    initLegacyDOMAdapter();
  }

  // Xuất ra toàn cục
  global.ticketStore = {
    templateId,
    elements,
    studio,
    actions,
    initLegacyDOMAdapter
  };

})(typeof window !== 'undefined' ? window : this);
