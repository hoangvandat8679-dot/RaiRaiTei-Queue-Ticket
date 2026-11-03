# Nguyên Tắc Thiết Kế Mobile-First & Tối Ưu PC (Chiến Lược Người Dùng 90% Mobile)

> ⚠️ **ĐỊNH HƯỚNG CỐT LÕI TỪ NGƯỜI DÙNG:**  
> **90% người dùng truy cập công cụ này bằng điện thoại di động (iPhone / Android) ngay tại cửa hàng hoặc hiện trường.**  
> Mọi thay đổi về kiến trúc, CSS, giao diện hay tính năng **bắt buộc phải ưu tiên trải nghiệm trên màn hình cảm ứng điện thoại trước (Mobile-First)**, đồng thời đảm bảo hiển thị hoàn hảo trên màn hình lớn máy tính (PC Desktop).

---

## 1. Các Trụ Cột Tối Ưu Cho Mobile (90% Traffic)

```text
 ┌────────────────────────────────────────────────────────┐
 │           CHIẾN LƯỢC MOBILE-FIRST STUDIO              │
 ├────────────────────────────────────────────────────────┤
 │ 📱 1. Vùng ngón cái (Thumb-Zone Friendly Bottom Bar)   │
 │ 👆 2. Touch Target >= 44×44px, không chạm nhầm        │
 │ 🚀 3. Kéo thả Touch mượt mà, touch-action: none        │
 │ 📐 4. Chiều cao động 100dvh (chống nhảy giật Safari)   │
 │ 🛡️ 5. Fallback Offline/Mạng yếu (Zero Blinking)        │
 └────────────────────────────────────────────────────────┘
```

### 1.1. Vùng Thao Tác Ngón Cái (Thumb-Zone Navigation)
- Trên điện thoại, người dùng cầm một tay và thao tác chủ yếu bằng ngón tay cái.
- **Thanh Bottom Category Bar (`#mobile-category-bar`)** phải luôn ghim ở `bottom: 0`, cao `64px`, các tab (Mẫu, Kích thước, Đổi ngôn ngữ, In vé) có diện tích bấm lớn và phản hồi xúc giác/màu sắc rõ rệt (`#cbfb45` neon).
- Hộp thoại thiết lập (`#controls-sidebar`) trên điện thoại mở dưới dạng trượt mượt mà (Bottom Sheet / Drawer), có nút quay lại rõ ràng (`#settings-back-btn`).

### 1.2. Kéo Thả Trực Quan Trên Màn Hình Cảm Ứng (Touch Drag Engine)
- **`touch-action: none`:** Bắt buộc áp dụng lên các phần tử có thể kéo thả (`.td-item`, `#preview-number`, `.number-frame`, `#mascot-preview`). Điều này ngăn chặn triệt để trình duyệt điện thoại kích hoạt hành vi cuộn trang hoặc `pull-to-refresh` ngoài ý muốn trong lúc người dùng đang di chuyển số xếp hàng.
- **Pointer Capture:** Tận dụng `setPointerCapture(event.pointerId)` để ngay cả khi ngón tay lướt ra ngoài mép vé, việc di chuyển vẫn bám sát đầu ngón tay không bị đứt đoạn.
- **Smart Snap Haptic/Visual:** Hiển thị vạch căn giữa (`.td-guide`) màu xanh neon nổi bật trên nền tối để người dùng dễ nhìn thấy dù ngón tay đang che một phần màn hình.

### 1.3. Kích Thước Chạm Tiêu Chuẩn (Touch Targets ≥ 44×44px)
- Theo khuyến nghị của Apple Human Interface Guidelines và Google Material Design:
  - Mọi nút bấm icon (Undo, Redo, In, Đổi ngôn ngữ, Đóng modal) phải có vùng chạm tối thiểu **`44×44px`** (hoặc `48×48px`), tránh việc ngón tay to bấm trượt.
  - Các thanh trượt `<input type="range">` phải có nút kéo (thumb) to bản, dễ gạt trên màn hình nhỏ.

### 1.4. Đơn Vị Đo Chiều Cao Di Động Hiện Đại (`100dvh`)
- Tuyệt đối không dùng `100vh` đơn thuần vì thanh địa chỉ (Address Bar) của Safari iOS và Chrome Android co giãn sẽ làm giao diện bị giật hoặc che khuất thanh công cụ bên dưới.
- Luôn sử dụng `height: 100dvh; max-height: 100dvh;` kết hợp `overflow: hidden;` cho khung bao ứng dụng `#app-wrapper`.

### 1.5. Chống Lỗi Hiển Thị Mạng Di Động (Defensive Mobile UI)
- Luôn giữ nguyên CDN Tailwind CSS và gắn thuộc tính phòng vệ inline `style="display: none;"` cho các popup/overlay (như `#print-overlay`, `#export-modal`).
- Khi người dùng ở vùng sóng 4G/5G chập chờn, trang web vẫn hiển thị ngay khung vé hoàn chỉnh mà không bị bung các phần tử ẩn ra ngoài.

---

## 2. Đồng Bộ Tính Năng Hai Chiều (Mobile & PC Parity)

Mọi tính năng có trên phiên bản PC bắt buộc phải có đối ứng tương đương trên Mobile:

| Tính Năng | Hiển Thị Trên PC | Hiển Thị Trên Mobile (90% Users) |
| :--- | :--- | :--- |
| **Undo / Redo** | Cụm nút trên Topbar PC | Cụm nút ghim trên Topbar Mobile |
| **Mẫu vé (Chuẩn & Mùa Xuân)** | Thẻ chọn mẫu ở thanh điều khiển | Tab "テンプレート" trên Bottom Bar di động |
| **In / Lưu PDF** | Nút gradient xanh nổi bật góc phải | Nút Print icon trên Topbar Mobile + nút trong Bottom Sheet |
| **Đổi ngôn ngữ (JP / VN)** | Nút cờ trên Topbar PC | Nút tròn góc trái Topbar Mobile |
| **Xem trước in nhiệt (Thermal Mode)** | Nút "熱転写" trên Topbar PC | Nút chuyển đổi nhanh trong tab Cài đặt |
| **Tải ảnh vé đơn (PNG)** | Hộp thoại xuất file | Nút tải ảnh trực tiếp về thư viện ảnh điện thoại |

---

## 3. Checklist Nghiệm Thu Mobile Bắt Buộc Trước Mỗi Commit

Trước khi nghiệm thu bất kỳ tính năng mới nào:
- [ ] Mở DevTools ở chế độ Responsive (mô phỏng iPhone 12/14/15 Pro: `390×844px` và Android Galaxy: `360×800px`).
- [ ] Thử kéo thả số 22 và khung viền bằng cảm ứng chạm (Touch simulation) xem có mượt không, có bị cuộn trang ngoài ý muốn không.
- [ ] Kiểm tra thanh Bottom Bar có bị thanh điều hướng ảo của điện thoại che mất không.
- [ ] Kiểm tra việc ấn đổi ngôn ngữ và đổi mẫu có tức thì không.
- [ ] Đảm bảo không có bất kỳ spinner hay overlay nào bị bung toàn màn hình.
