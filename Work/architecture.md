# Kiến Trúc Quy Hoạch Mới — RaiRaiTei Queue Ticket Studio

> **Phiên bản kiến trúc:** 2.0 (Modular Reactive Architecture)  
> **Nguyên tắc thiết kế:** Độc lập module (Decoupled), Zero Build Step (Native ES Modules), Single Source of Truth (Reactive State Store), và Khả năng mở rộng mẫu không giới hạn (Extensible Template Registry).

---

## 1. So Sánh Kiến Trúc: Hiện Tại vs Mục Tiêu V2

### 1.1. Hiện trạng (Kiến trúc v1 - Tight DOM Coupling)
```text
[DOM Inputs / Sliders] ──(DOM Events)──> [controls.js / templates.js]
                                               │
                                       (gán trực tiếp style)
                                               ▼
                                 [document.body.style.setProperty]
                                               ▲
[ticket-drag.js] ──(ghi vào input ẩn)──────────┘
```
* **Nhược điểm:**
  - DOM vừa là nơi hiển thị, vừa là nơi lưu trữ state chính (thông qua giá trị input và class body).
  - Khó kiểm thử tự động, dễ xảy ra race-condition khi kết hợp Undo/Redo với Presets.
  - Thêm một template mới đòi hỏi phải sửa code cứng trong `templates.js`, `controls.js` và `index.html`.

### 1.2. Mục tiêu V2 (Data-Driven Modular Architecture)
```text
                         ┌───────────────────────┐
                         │   Template Registry   │
                         │ (JSON Schema Presets) │
                         └───────────┬───────────┘
                                     │ Nạp cấu hình mẫu
                                     ▼
┌─────────────────┐       ┌───────────────────────┐       ┌─────────────────┐
│   UI Controls   │ <---> │  Central Signal Store │ <---> │  Ticket Canvas  │
│ (Panels/Inputs) │       │ (Single Source Truth) │       │ (Visual Renderer│
└─────────────────┘       └───────────┬───────────┘       └─────────────────┘
                                      │
                         ┌────────────┴───────────┐
                         │   Subscribers / Sync   │
                         │ ├─ CSS Vars Generator  │
                         │ ├─ Undo/Redo History   │
                         │ ├─ LocalStorage Persist│
                         │ └─ Print / SVG Export  │
                         └────────────────────────┘
```
* **Ưu điểm:**
  - Tách rời 100% logic dữ liệu khỏi thẻ HTML.
  - Canvas Preview chỉ việc lắng nghe State Store để render.
  - Template Registry hoàn toàn độc lập: thêm mẫu Tết, Mùa Hè, Halloween chỉ bằng việc đăng ký file cấu hình JSON/JS.

---

## 2. Quy Hoạch Cây Thư Mục Dự Án (New Project Structure)

```text
RaiRaiTei-Queue-Ticket-preview/
├── index.html                      # Khung trang chính gọn gàng
├── css/
│   ├── tokens/
│   │   ├── colors.css              # Bảng màu Studio, theme Dark/Light & print ink
│   │   ├── typography.css          # Font chữ số lớn, chữ phụ, Nhật Bản / Việt / Anh
│   │   └── dimensions.css          # Kích thước vật lý 43x78mm, viền cắt 0.5mm
│   ├── base/
│   │   ├── reset.css               # Box-sizing, normalize
│   │   └── print.css               # @page 43mm 78mm và CSS rules khi in nhiệt
│   ├── components/
│   │   ├── topbar.css              # Thanh tiêu đề, nút mẫu nhanh, nút in ấn
│   │   ├── studio-layout.css       # Chia cột trái (Controls) - phải (Preview)
│   │   ├── control-panel.css       # Sliders, Accordion, Toggle, Input groups
│   │   ├── ticket-preview.css      # Khung vé, vùng in, linh vật, số xếp hàng
│   │   ├── drag-handles.css        # Khung viền bounding box, nút snap, reset
│   │   └── modal-history.css       # Dialog xem trước và hộp thoại trợ giúp
│   └── main.css                    # Entry import CSS sử dụng @layer
│
├── js/
│   ├── core/
│   │   ├── signal.js               # Reactive Signal engine siêu nhẹ (~80 dòng)
│   │   ├── store.js                # State Store chính của toàn bộ Ticket Studio
│   │   └── event-bus.js            # Dispatch các custom event toàn cục
│   │
│   ├── registry/
│   │   ├── template-registry.js    # Quản lý đăng ký, chuyển đổi mẫu vé
│   │   └── templates/
│   │       ├── standard.js         # Mẫu truyền thống RaiRaiTei
│   │       ├── spring.js           # Mẫu Mùa Xuân (Hoa anh đào, linh vật kimono)
│   │       └── summer.js           # Mẫu Mùa Hè (Dự kiến mở rộng)
│   │
│   ├── engines/
│   │   ├── drag-engine.js          # Xử lý PointerEvents, Snapping, Delta X/Y
│   │   ├── render-sync.js          # Đồng bộ State Store ra CSS Variables và DOM
│   │   ├── history-manager.js      # Undo / Redo Command Pattern
│   │   └── print-exporter.js       # Xuất ảnh PNG siêu nét / Gửi lệnh in ESC-POS
│   │
│   ├── i18n/
│   │   ├── i18n-service.js         # Đổi ngôn ngữ động (JA / VI / EN)
│   │   └── locales/
│   │       ├── ja.json
│   │       ├── vi.json
│   │       └── en.json
│   │
│   └── main.js                     # Bootstrap ứng dụng
└── Work/                           # Tài liệu nghiên cứu, kế hoạch cải cách
```

---

## 3. Thiết Kế Hệ Thống State Store (Single Source of Truth)

### 3.1. Cấu trúc State Object chuẩn
```javascript
export const initialTicketState = {
  // 1. Kích thước vật lý & Lề an toàn
  dimensions: {
    widthMm: 43.0,
    heightMm: 78.0,
    cutMarginMm: 0.5,
    safeZonePaddingMm: 2.0
  },

  // 2. Mẫu vé đang kích hoạt
  templateId: 'standard', // 'standard' | 'spring' | ...

  // 3. Tọa độ & độ co giãn của các phần tử động
  elements: {
    frame: {
      visible: true,
      dx: 0,
      dy: 0,
      scale: 1.0,
      style: 'season' // 'none' | 'season' | 'solid'
    },
    number: {
      value: '22',
      dx: 0,
      dy: 0,
      scale: 1.0,
      fontSize: 88,
      fontFamily: 'Montserrat',
      fontWeight: 900
    },
    mascot: {
      visible: true,
      dx: 0,
      dy: 0,
      scale: 1.0,
      src: './mascot.png'
    },
    header: {
      branchName: '来来亭 本店',
      dateText: '2026/10/04 23:35',
      dx: 0,
      dy: 0
    },
    message: {
      content: 'ご来店ありがとうございます',
      dx: 0,
      dy: 0
    }
  },

  // 4. Cài đặt hiển thị & Studio
  studio: {
    zoom: 1.0,
    showGuides: true,
    showThermalMonochrome: false,
    snapGridMm: 0.5,
    activeDragElement: null
  }
};
```

---

## 4. Thiết Kế Hệ Thống Template Registry

### 4.1. Chuẩn Schema cho Template (`TemplateDefinition`)
Mỗi mẫu vé là một đối tượng độc lập, cung cấp cấu hình đầy đủ:
```javascript
export const SpringTemplate = {
  id: 'spring',
  name: {
    ja: '春限定桜デザイン',
    vi: 'Mẫu Mùa Xuân Hoa Anh Đào',
    en: 'Spring Blossom Limited'
  },
  assets: {
    frameBg: './assets/templates/spring/frame.svg',
    mascotImg: './assets/templates/spring/mascot-spring.png',
    decorations: ['./assets/templates/spring/sakura-petal.svg']
  },
  // Các giá trị mặc định cho từng phần tử khi kích hoạt mẫu này
  defaults: {
    frame: { dx: 0, dy: 6, scale: 1.05 },
    number: { dx: 0, dy: 14, scale: 1.1, fontSize: 92 },
    mascot: { dx: 0, dy: -4, scale: 0.95 }
  },
  // Các khóa điều khiển (nếu mẫu cố định layout, ngăn kéo lệch quá mức)
  constraints: {
    lockRatio: true,
    maxDragMm: 8.0
  }
};
```

### 4.2. API của `TemplateRegistry`
- `TemplateRegistry.register(templateDefinition)`: Đăng ký mẫu mới vào hệ thống.
- `TemplateRegistry.apply(templateId)`: Kích hoạt mẫu, tự động dispatch action cập nhật Store và khôi phục/áp dụng các tọa độ định sẵn.
- `TemplateRegistry.getAll()`: Trả về danh sách mẫu để render ra thanh chọn nhanh trên Topbar.

---

## 5. Cơ Chế Đồng Bộ Không Trễ (Reactive CSS Variables & DOM Rendering)

Khi có bất kỳ thay đổi nào trong `store.elements.number.dx`:
1. **Signal Listener** nhận trigger.
2. Hàm `renderSync` đẩy biến CSS cục bộ vào thẻ `#ticket-root`:
   ```javascript
   ticketRoot.style.setProperty('--num-dx', `${state.elements.number.dx}mm`);
   ticketRoot.style.setProperty('--num-dy', `${state.elements.number.dy}mm`);
   ticketRoot.style.setProperty('--num-scale', state.elements.number.scale);
   ```
3. Khung nhìn trình duyệt cập nhật mượt mà 120 FPS qua `transform: translate3d(var(--num-dx), var(--num-dy), 0) scale(var(--num-scale))` tận dụng phần cứng GPU (Hardware Accelerated).
4. Các thẻ slider/input tương ứng trên sidebar tự động cập nhật giá trị số mà không cần dispatch lặp lại (ngắt loop đệ quy).
