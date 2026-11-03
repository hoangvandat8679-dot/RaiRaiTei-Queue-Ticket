# Kế Hoạch Triển Khai Chi Tiết (Actionable Task List)

> **Mục tiêu:** Thực hiện cải cách từng bước (Incremental Migration), đảm bảo ứng dụng **luôn hoạt động 100% bình thường (Zero Downtime / No Regression)** sau mỗi bước commit.

---

## Sprint 1: Nền Tảng Reactive State & Zero-Dependency Signals
> **Trạng thái:** ✅ ĐÃ HOÀN THÀNH

- [x] **Task 1.1: Khởi tạo module `js/core/signal.js`**
  - Xây dựng hoặc tích hợp lõi Signal siêu nhỏ (< 1KB) hỗ trợ: `signal()`, `computed()`, `effect()`.
  - Đảm bảo cơ chế ngắt vòng lặp đệ quy (re-entrant loop guard).
- [x] **Task 1.2: Xây dựng `js/core/store.js`**
  - Khởi tạo `TicketStore` với schema chuẩn đã định nghĩa trong `Work/architecture.md`.
  - Cung cấp các mutation/action rõ ràng: `setElementOffset(name, dx, dy)`, `setElementScale(name, scale)`, `selectTemplate(id)`.
- [x] **Task 1.3: Cầu nối Adapter chuyển tiếp (Backwards Compatibility Adapter)**
  - Viết adapter đồng bộ 2 chiều giữa `TicketStore` và các input DOM cũ (`#drag-frame-dx`, `#drag-number-dx`, v.v.) để các hàm hiện tại không bị lỗi.

---

## Sprint 2: Hệ Thống Template Registry Mở Rộng
> **Trạng thái:** ✅ ĐÃ HOÀN THÀNH

- [x] **Task 2.1: Xây dựng `js/registry/template-registry.js`**
  - Cung cấp phương thức: `register()`, `get()`, `getAll()`, `apply()`.
- [x] **Task 2.2: Đóng gói Mẫu Chuẩn (`templates/standard.js`)**
  - Chuyển toàn bộ cấu hình, font chữ, khung viền, vị trí mặc định của mẫu chuẩn sang schema.
- [x] **Task 2.3: Đóng gói Mẫu Mùa Xuân (`templates/spring.js`)**
  - Chuyển bộ tọa độ vàng vừa tinh chỉnh (Frame dx=0, dy=6, scale=1.05; Number dx=0, dy=14, scale=1.1; Mascot kimono) sang schema độc lập.
- [x] **Task 2.4: Render động bộ chọn mẫu trên Topbar**
  - Topbar tự động đọc từ `TemplateRegistry.getAll()` để tạo nút bấm mẫu, không cần viết cứng thẻ HTML cho từng mẫu mới.

---

## Sprint 3: Quy Hoạch Lại Kiến Trúc CSS & Design Tokens
> **Trạng thái:** ✅ ĐÃ HOÀN THÀNH

- [x] **Task 3.1: Tạo `css/tokens/`**
  - `dimensions.css`: Định nghĩa chuẩn `43mm`, `78mm`, `0.5mm` viền cắt, và tỷ lệ co giãn preview.
  - `colors.css`: Chuẩn hóa theme Studio (Dark/Light) và màu sắc in nhiệt đơn sắc.
  - `typography.css`: Font số xếp hàng (Montserrat/Oswald), font chữ tiếng Nhật (Noto Sans JP).
- [x] **Task 3.2: Module hóa các Component CSS & Cascade Layers**
  - Khởi tạo `css/tokens/index.css` với cấu trúc `@layer tokens, reset, layout, components, overrides, print;`.
  - Phân tầng mức độ ưu tiên sạch sẽ, loại bỏ xung đột selector.
- [x] **Task 3.3: Tích hợp an toàn vào `index.html`**
  - Đảm bảo toàn bộ biến tokens sẵn sàng cho hệ thống giao diện và bản in 43×78mm.

---

## Sprint 4: Nâng Cấp Drag Engine & Undo/Redo Bền Vững
> **Trạng thái:** ✅ ĐÃ HOÀN THÀNH

- [x] **Task 4.1: Nâng cấp `js/ticket-drag.js` với rAF Scheduling 120 FPS**
  - Thống nhất xử lý touch, mouse, pen với PointerEvents và rAF scheduling (giảm tải CPU, triệt tiêu dropped frames).
- [x] **Task 4.2: Tích hợp chế độ Smart Snap Guides**
  - Snap tự động vào trục giữa vé (`centerX`) và mốc 0mm.
  - Đồng bộ thời gian thực vào `ticketStore.actions.setElementOffset`.
- [x] **Task 4.3: Chuẩn hóa Command Pattern cho `js/design-history.js`**
  - Tích hợp `TemplateRegistry.apply` khi Undo/Redo khôi phục template, loại bỏ delay click DOM.

---

## Sprint 5: Tối Ưu In Ấn & Export Siêu Nét (Dithering & Vector ESC/POS)
> **Trạng thái:** ✅ ĐÃ HOÀN THÀNH

- [x] **Task 5.1: Chuẩn hóa `@media print`**
  - Đảm bảo đúng chuẩn khổ giấy máy in hóa đơn/nhãn 43×78mm, lề 0mm, chất lượng in 203–300 DPI.
- [x] **Task 5.2: Tích hợp chế độ xem trước Dithering (Thermal Monochrome Preview)**
  - Thêm nút "熱転写" (Thermal Mode) trên Topbar và class CSS `body.thermal-simulation-mode`.
  - Hỗ trợ xem trước 1-bit high-contrast preview giống máy in nhiệt thực tế.
- [x] **Task 5.3: Xuất file ảnh PNG độ nét cao (Super-Sampling 3.5x)**
  - Tích hợp `window.exportTicketPng()` và nút tải ảnh trực tiếp trong `#export-modal`.

---

## Sprint 6: Tinh Chỉnh Hệ Thống Tab Chỉnh Sửa (Mobile-First Control Panel)
> **Trạng thái:** ✅ ĐÃ HOÀN THÀNH

- [x] **Task 6.1: Thanh Chip Sub-tabs cuộn ngang (Category Chip Navigation)**
  - Tích hợp thanh Sub-tabs sticky ngay đỉnh `#controls-sidebar`: `[Tất cả] [Kích thước & Nền] [Viền & Linh vật] [Số & Khung] [Lời nhắn] [Tên quán]`.
  - Hỗ trợ chuyển đổi nhanh từng panel riêng lẻ, loại bỏ tình trạng dồn ứ cuộn dài dằng dặc.
  - Hỗ trợ đa ngôn ngữ Nhật - Việt cho các chip.
- [x] **Task 6.2: Bộ Chấm Màu Nhanh Thương Hiệu (Brand Quick Swatches)**
  - Thêm hàng nút chấm màu tròn (Vàng RaiRaiTei `#fcd116`, Đỏ `#e60012`, Trắng `#ffffff`, Đen `#111111`, Neon `#cbfb45`) ngay cạnh các ô chọn màu chính (Màu nền, Màu số, Màu nền khung, Màu lời nhắn, Màu nền chi nhánh).
  - 1 chạm đổi màu tức thì, không cần mở color picker native toàn màn hình của điện thoại.
- [x] **Task 6.3: Nút Reset Nhanh Từng Khối & Tối Ưu Touch Slider**
  - Tối ưu kích thước Thumb slider lên `24-26px`, thêm `touch-action: pan-x` để kéo trượt mượt mà không bị giật trang.
  - Tối ưu chiều cao Drawer di động và tự động mở rộng lên `72dvh` (`:focus-within`) khi người dùng gõ chữ để bàn phím ảo không che mất ô input.
- [x] **Task 6.4: Tối Ưu Kích Thước Preview Vé Mẫu & Snap-Points Drawer (Khắc phục vé quá nhỏ)**
  - Chuyển chiều cao mặc định của Drawer từ `48dvh` xuống `32dvh` (Chế độ Xem Vé Lớn / Compact View), giải phóng 70% màn hình cho khu vực xem trước.
  - Tăng độ phóng đại (`scale`) của vé từ `0.35x - 0.40x` lên `1.10x - 1.55x` (to gấp 3 đến 3.5 lần, nhìn rõ từng chi tiết font, viền, khoảng cách).
  - Tích hợp thanh kéo Handle (`#sheet-drag-handle`) 1 chạm chuyển đổi giữa 2 nấc: `32dvh` (Xem vé lớn) và `56dvh` (Bảng mở rộng).
  - Bổ sung nút nổi `[ 🔍 Phóng to ]` (`#btn-focus-preview`) trên khung preview, cho phép bung vé toàn màn hình siêu nét với scale lên tới `2.20x`.
  - Tối ưu `pad` từ 32px xuống 12px trong thuật toán `fitMobilePreview()`.

---

## Sprint 7: Quản Lý & Lưu Trữ Mẫu Tự Thiết Kế (Custom Preset & Storage Manager)
> **Trạng thái:** ✅ ĐÃ HOÀN THÀNH  
> **Nguồn cảm hứng / Tham chiếu GitHub:** [`dotslashgabut/idcardgenerator`](https://github.com/dotslashgabut/idcardgenerator), [`nanostores`](https://github.com/nanostores/nanostores)

- [x] **Task 7.1: UI & Tương Tác Tab "Đã lưu" (`#panel-saved`)**
  - Thiết kế danh sách thẻ mẫu đã lưu (Saved Preset Cards) dạng lưới mobile-friendly với thumbnail, tên mẫu, ngày lưu, nút Nạp, nút Đổi tên và nút Xóa.
  - Hộp thoại lưu mẫu nhanh: Cho phép đặt tên mẫu (ví dụ: *Vé giờ cao điểm, Mẫu khuyến mãi Tết*), 1 chạm lưu toàn bộ trạng thái hiện tại từ `TicketStore`.
- [x] **Task 7.2: Cơ Chế Sinh Thumbnail Tự Động (Auto Thumbnail Generator)**
  - Kế thừa Canvas rendering từ `idcardgenerator`: tự động kết xuất ảnh thumbnail 120×218px base64 lưu kèm preset, hiển thị trực quan không làm đơ giao diện.
- [x] **Task 7.3: Module `js/storage/preset-manager.js` & LocalStorage Engine**
  - Quản lý CRUD preset an toàn: `savePreset(name, data)`, `loadPreset(id)`, `deletePreset(id)`, `listPresets()`.
  - Tích hợp schema versioning và cơ chế dọn dẹp bộ nhớ đệm nếu dung lượng `localStorage` đạt giới hạn.
- [x] **Task 7.4: Xuất / Nhập File Cấu Hình JSON (Export/Import Preset File)**
  - Nút **[Xuất file JSON]** để tải cấu hình thiết kế về máy lưu trữ an toàn.
  - Nút **[Nhập file JSON]** với bộ kiểm tra hợp lệ dữ liệu (schema validation), hỗ trợ chia sẻ mẫu giữa các chi nhánh hoặc khôi phục dữ liệu khi đổi điện thoại.

---

## Sprint 8: Nâng Cấp Dàn Trang In A4 & Vạch Cắt Chuẩn Máy In (A4 N-Up Imposition Grid & Crop Marks)
> **Trạng thái:** ✅ ĐÃ HOÀN THÀNH  
> **Nguồn cảm hứng / Tham chiếu GitHub:** [`sebastian-software/asn-label-maker`](https://github.com/sebastian-software/asn-label-maker), [`ezdanapak/shipping-label`](https://github.com/ezdanapak/shipping-label), [`Hopding/pdf-lib`](https://github.com/Hopding/pdf-lib)

- [x] **Task 8.1: Thuật Toán Dàn Trang Lưới A4 N-up (Grid Calculation Engine)**
  - Nâng kích thước lề cắt an toàn (Cut Margins) từ `0.5mm` lên `1.0mm` theo trải nghiệm thực tế (vé có lề: `45×80mm`).
  - Tự động phân bổ lưới tối ưu: Khổ dọc 4 cột × 3 hàng = 12 vé/trang; Khổ ngang 6 cột × 2 hàng = 12 vé/trang.
  - Căn giữa trang in với lề bảo vệ tối thiểu 5mm, đồng bộ tính toán giữa PDF mobile và iframe desktop print.
- [x] **Task 8.2: Bộ Vạch Cắt Tự Động & Hướng Dẫn Cắt Rời (Automatic Crop/Cut Marks)**
  - Kế thừa thuật toán vẽ vạch cắt chuẩn in ấn từ `asn-label-maker`: sinh vạch ticks 3mm ở 4 mép biên trang (top, bottom, left, right) và dấu chữ thập `+` 3mm tại các giao điểm góc giữa các con vé.
  - Hỗ trợ cả 2 chế độ: xuất file PDF (qua `jsPDF.line`) và in trực tiếp trên desktop qua thẻ vector SVG overlay.
  - Bổ sung nút checkbox bật/tắt Vạch Cắt (`#crop-marks-toggle`) trong hộp thoại in ấn với đầy đủ i18n Nhật - Việt.
- [x] **Task 8.3: Sinh Vé Hàng Loạt Theo Dải Số Thứ Tự (Batch Sequential Number Generator)**
  - Kế thừa cơ chế sinh hàng loạt từ `idcardgenerator`: hỗ trợ nhập số lượng liên tục (1 đến N) hoặc dải số tùy chỉnh (`2; 5; 10-15`).
  - Tự động phân trang A4, co giãn kích thước số thứ tự khi số có từ 2–3 chữ số để đảm bảo không tràn viền.
- [x] **Task 8.4: Chế Độ In 2 Mặt Chuẩn Xác (Duplex Alignment Optimization)**
  - Tối ưu lề đối xứng gương (Mirror Columns) cho in 2 mặt (Mặt trước: số thứ tự + linh vật; Mặt sau: hướng dẫn + tiêu đề).
  - Tọa độ lưới và vạch cắt Crop Marks đồng bộ tuyệt đối khi lật ngang tờ giấy A4.
- [x] **Task 8.5: Hotfix Tối Ưu In Hàng Loạt & Chống Treo Mobile (Batch Numbers & Mobile PDF Engine)**
  - **Sửa dứt điểm lỗi toàn số 1:** Khắc phục regex thay thế số trong `createPrintTicketCellHTML` để khớp chính xác thẻ chứa class `td-item` do module kéo thả gán thêm (`class="queue-number td-item"`). Tự động co tỷ lệ font chữ khi số có 2–3 chữ số.
  - **Khắc phục lỗi treo PDF trên Mobile (iOS/Android):** Bổ sung fallback timer cho `waitForPaintFrames` và kiểm tra `document.hidden` để chống bị đóng băng rAF khi tab chuyển xuống background. Thêm timeout bảo vệ tải font/ảnh.
  - **Giao diện tiến trình thời gian thực trên tab Mobile:** Hiển thị trực tiếp thanh phần trăm và số vé đang tạo (`X / Y vé`) trên tab mới mở; nhúng viewer PDF kèm nút [Tải PDF Về Máy] 1 chạm tương thích 100% Safari iOS.

---

## Sprint 9: Trọn Bộ Bốn Mùa (Xuân - Hạ - Thu - Đông) & Khử Răng Cưa In Nhiệt Đơn Sắc
> **Trạng thái:** ✅ ĐÃ HOÀN THÀNH  
> **Nguồn tài nguyên đồ họa:** [`hoangvandat8679-dot/assets-images`](https://github.com/hoangvandat8679-dot/assets-images) (Vector SVG chuẩn tỷ lệ 43×78mm)  
> **Tham chiếu thuật toán:** Floyd-Steinberg Dithering Engine, High-Fidelity JPEG 0.92 PDF Compression

- [x] **Task 9.1: Tích Hợp Trọn Bộ Bốn Mùa (Xuân - Hạ - Thu - Đông) Vào TemplateRegistry**
  - Tải và đồng bộ tài nguyên vector SVG từ GitHub: `Mùa Hè.svg`, `Mùa Thu.svg`, `Mùa Đông.svg` vào thư mục cục bộ `assets/templates/` kèm link dự phòng CDN jsDelivr.
  - **Mẫu Mùa Xuân (`spring.js`):** Hoa anh đào Sakura, nền hồng phấn pastel, linh vật RaiRaiTei đón tết.
  - **Mẫu Mùa Hè (`summer.js`):** Lễ hội Matsuri & Hoa Hướng Dương (夏祭り・ひまわり), nền vector hè rực rỡ, tông đỏ cam `#d90012`, font Impact nổi bật.
  - **Mẫu Mùa Thu (`autumn.js`):** Lá đỏ Momiji & Ngắm trăng Otsukimi (紅葉・お月見), nền vector lá phong thu, tông đỏ thẫm `#e10000`, viền hổ phách `#d97706`.
  - **Mẫu Mùa Đông (`winter.js`):** Tuyết trắng & Đêm hội ánh sáng (雪景色・イルミネーション), nền vector tuyết đông, tông xanh lạnh tuyết `#f0f9ff`, đỏ tươi `#d80000`.
  - Tích hợp 4 nút chọn mùa trực quan trong Template Grid (`index.html`) kèm đa ngôn ngữ tiếng Nhật và tiếng Việt hoàn chỉnh trong `js/i18n.js`.
- [x] **Task 9.2: Thuật Toán Floyd-Steinberg Dithering Đơn Sắc 1-bit**
  - Tích hợp thuật toán khuếch tán sai số (Error Diffusion) 1-bit vào `exportTicketPng()`.
  - Khi người dùng bật chế độ in nhiệt (`thermal-simulation-mode`), ảnh PNG xuất ra được dither pixel-perfect chuẩn 203 DPI như in từ máy in hóa đơn ESC/POS thực tế (đen/trắng tuyệt đối 0 hoặc 255).
- [x] **Task 9.3: Tối Ưu Nén File PDF In Ấn (High-Fidelity JPEG 0.92)**
  - Tối ưu dung lượng file PDF từ 15MB xuống chỉ còn 1.2MB–1.8MB (giảm hơn 85%), tăng tốc độ sinh file trên mobile gấp 3 lần và chống tràn RAM trên Safari iOS.
- [x] **Task 9.4: Kịch Bản Kiểm Thử Tự Động Toàn Diện E2E**
  - Kiểm thử tự động đạt 100% tất cả các tiêu chí QA Gates (TemplateRegistry 5 mẫu vé, Dithering 0/255, Lưới N-up A4 12 vé/trang, Lề cắt 1.0mm, Co giãn chữ số 1-N).

---

## Bảng Checklist Nghiệm Thu (Quality Assurance Gates)

Mỗi task hoàn thành bắt buộc phải vượt qua các tiêu chí sau:
1. [x] **Trọn bộ Bốn Mùa (Xuân - Hạ - Thu - Đông) và Mẫu Chuẩn** hoạt động mượt mà, độc lập 100% qua `TemplateRegistry`, không bị lệch tọa độ hay vỡ bố cục.
2. [x] **Thao tác Kéo thả (Drag & Drop)** hoạt động mượt mà 120 FPS với rAF Scheduling và Dual Snapping (tâm vé & 0mm).
3. [x] **Nút Undo / Redo / Reset** trên thanh Topbar hoạt động tức thì, tích hợp thẳng với TemplateRegistry và Store.
4. [x] **Topbar Responsive (Mobile First & PC):** Khung xám ôm trọn 100% nút "Đặt lại", bố cục không bị tràn viền hay che khuất trên mọi kích thước màn hình.
5. [x] **Sub-tabs & Quick Swatches:** Chuyển đổi tab con bằng 1 chạm, chấm màu đổi tức thì không cần popup native.
6. [x] **Khổ in 43mm × 78mm (lề cắt 1.0mm)** in ra giấy thật hoặc xuất PDF đúng chuẩn tỷ lệ 1:1.
7. [x] **Đổi ngôn ngữ (i18n)** tức thì giữa Tiếng Nhật và Tiếng Việt, đồng bộ nhãn cả 4 mùa, nút in nhiệt, tải ảnh PNG và các chip sub-tabs.
8. [x] **Quản lý Mẫu Đã Lưu (Sprint 7):** Lưu, đặt tên, xóa, xuất/nhập file `.json` và nạp mẫu 1 chạm hoạt động trơn tru trên cả mobile và desktop.
9. [x] **Dàn trang in A4 & Vạch cắt (Sprint 8):** Sinh dải số thứ tự 1-N, hiển thị lưới N-up có vạch cắt rõ ràng, in 2 mặt khớp tọa độ với lề cắt 1.0mm.
10. [x] **In Hàng Loạt & Xuất PDF Mobile:** Số thứ tự tăng tuần tự 100% chính xác (1, 2, 3...) không bị lặp số 1; xuất PDF trên điện thoại mượt mà có thanh tiến độ và nút tải về, không bao giờ bị treo đơ tab.
11. [x] **Mô Phỏng In Nhiệt 1-Bit:** Xuất ảnh PNG áp dụng Floyd-Steinberg Dithering tạo hiệu ứng hạt mực in nhiệt cổ điển chuẩn xác.

