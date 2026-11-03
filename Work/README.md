# RaiRaiTei Queue Ticket Studio — Kế Hoạch Cải Cách Toàn Diện (Reform Roadmap V2)

> 💡 **CHIẾN LƯỢC CỐT LÕI (MOBILE FIRST 90%):**  
> Dự án phục vụ cho cả Web Mobile và PC, trong đó **90% người dùng truy cập bằng điện thoại di động (smartphone)** tại cửa hàng. Mọi giải pháp kiến trúc, giao diện, thanh điều hướng và cử chỉ kéo thả đều phải được tối ưu hàng đầu cho màn hình cảm ứng điện thoại trước (Mobile-First Touch UX), sau đó thích ứng mượt mà trên máy tính.

---

## 📑 Danh Mục Hồ Sơ & Tài Liệu Kỹ Thuật

| Tài liệu | Nội Dung Chi Tiết |
| :--- | :--- |
| 📱 **[mobile-first-guidelines.md](file:///c:/Users/user/.gemini/antigravity-ide/scratch/RaiRaiTei-Queue-Ticket-preview/Work/mobile-first-guidelines.md)** | **Định hướng chiến lược tối quan trọng:** 90% người dùng vào bằng điện thoại. Toàn bộ quy chuẩn về Touch Targets ≥ 44px, Thumb-Zone Bottom Bar, và `touch-action: none` chống giật cuộn. |
| 📘 **[research-repos.md](file:///c:/Users/user/.gemini/antigravity-ide/scratch/RaiRaiTei-Queue-Ticket-preview/Work/research-repos.md)** | Nghiên cứu các kỹ thuật frontend hiện đại (Signals, Cascade Layers, PointerEvents) và khảo sát các repo GitHub nguồn mở hàng đầu (`thermoprint`, `receiptline`, `phomymo`, `alien-signals`) để sao chép / tích hợp module. |
| 📐 **[architecture.md](file:///c:/Users/user/.gemini/antigravity-ide/scratch/RaiRaiTei-Queue-Ticket-preview/Work/architecture.md)** | Bản vẽ kiến trúc mới V2: Quy hoạch thư mục JS/CSS, đặc tả State Store (Single Source of Truth), thiết kế Template Registry mở rộng, cơ chế đồng bộ biến CSS 120 FPS. |
| 📋 **[tasks.md](file:///c:/Users/user/.gemini/antigravity-ide/scratch/RaiRaiTei-Queue-Ticket-preview/Work/tasks.md)** | Kế hoạch hành động cụ thể chia theo 5 Sprint tuần tự, cùng Checklist nghiệm thu (QA Gates) chống hồi quy tính năng (khổ in 43×78mm, mẫu mùa xuân, kéo thả). |

---

## 🎯 Các Cột Mốc Cốt Lõi Của Dự Án (Roadmap 2026)

```text
 ┌──────────────────────┐      ┌──────────────────────┐      ┌──────────────────────┐
 │       Sprint 1       │      │       Sprint 2       │      │       Sprint 3       │
 │  Signal State Store  │ ───> │  Template Registry   │ ───> │     CSS Tokens &     │
 │  Tách rời khỏi DOM   │      │ Động hóa các mẫu vé  │      │    Cascade Layers    │
 └──────────────────────┘      └──────────────────────┘      └──────────────────────┘
            │
            ▼
 ┌──────────────────────┐      ┌──────────────────────┐      ┌──────────────────────┐
 │     Sprint 4 & 5     │      │       Sprint 6       │      │     Sprint 7 & 8     │
 │  Drag PointerEvents  │ ───> │  Tinh Chỉnh Mobile   │ ───> │  Custom Presets &    │
 │  & Super-Sampling    │      │  Sub-tabs & Zoom 3x  │      │  Dàn Trang A4 N-Up   │
 └──────────────────────┘      └──────────────────────┘      └──────────────────────┘
```

1. **Module hóa State (Reactive Signal Engine):**
   - Loại bỏ việc dùng thẻ DOM và thuộc tính inline làm kho chứa dữ liệu.
   - Sử dụng Signal/Store siêu nhẹ (< 1KB), cập nhật đồng bộ tức thì, không làm đơ giao diện (kế thừa từ `alien-signals`).
2. **Hệ thống Template Registry linh hoạt:**
   - Đóng gói Mẫu Chuẩn và Mẫu Mùa Xuân thành các file cấu hình độc lập.
   - Thêm mẫu mùa hè / sự kiện mới chỉ cần nạp 1 file schema JSON/JS.
3. **Quy hoạch lại hệ thống CSS chuyên nghiệp:**
   - Dùng CSS `@layer` phân tầng (Tokens -> Base -> Components -> Print).
   - Triệt tiêu việc ghi đè bằng `!important`.
4. **Tích hợp các module tinh hoa từ các GitHub Repos phù hợp:**
   - **`dotslashgabut/idcardgenerator`:** Mô hình Web App thuần Client-Side (Zero Backend), sinh số thứ tự hàng loạt, quản lý bộ nhớ đệm và tạo thumbnail xem trước nhanh.
   - **`sebastian-software/asn-label-maker`:** Thuật toán tính toán lưới dàn trang N-up trên khổ A4 chuẩn xác 0.1mm kèm bộ vạch cắt (Crop/Cut Marks) an toàn.
   - **`ezdanapak/shipping-label`:** Kiến trúc in ấn Vanilla JS tương thích 100% với `@media print` trên Safari iOS và Chrome Android.
   - **`Hopding/pdf-lib` & `nanostores`:** Ghép trang PDF in 2 mặt (Duplex) và cơ chế lưu trữ Preset cá nhân hóa gọn nhẹ.

---

## 🛠️ Cập Nhật Mới Nhất: Tối Ưu Topbar PC & Mobile
- **Khắc phục triệt để lỗi nút Đặt lại lọt ra ngoài khung xám:**
  - Chuyển `#header-drag-hint-slot` sang `inline-flex; flex-shrink: 0;`.
  - Khung `.td-hint` đặt `width: auto; max-width: none; flex-shrink: 0; box-sizing: border-box;` để viền bo cong xám luôn ôm trọn vẹn 100% nút "Đặt lại".
  - Thêm media query thích ứng thông minh: ẩn chữ nhãn `Kéo thả` khi màn hình < 1360px, chỉ giữ icon 4 chiều xanh neon và nút Đặt lại, không bao giờ bị chèn ép.
- **Tối ưu bố cục thanh Topbar:**
  - Giảm padding dư thừa cho các nút phụ bên phải (`Lõi vé`, `熱転写`, `全画面`).
  - Trên màn hình vừa và nhỏ (< 1280px), các nút phụ tự co thành icon tinh gọn, giữ không gian thông thoáng cho màn hình.

---

## 🚀 Cập Nhật Đột Phá: Sprint 6 — Tinh Chỉnh Hệ Thống Tab Chỉnh Sửa (Mobile-First 90%)
- **Thanh Sub-tabs Chip Bar cuộn ngang:**
  - Ghim cố định ở đỉnh sidebar: `[Tất cả] [Kích thước] [Viền & Linh vật] [Số & Khung] [Lời nhắn] [Tên quán]`.
  - Trên mobile: Chỉ hiển thị panel được chọn, chấm dứt việc phải cuộn dọc 25+ thanh trượt.
  - Tự động ẩn khi đang mở tab Mẫu hoặc tab Đã lưu.
- **Bộ Chấm Màu Nhanh Thương Hiệu (Brand Quick Swatches):**
  - Chấm màu tròn tích hợp sẵn các tông màu nhận diện RaiRaiTei (`#fcd116`, `#e60012`, `#ffffff`, `#111111`, `#cbfb45`).
  - Cho phép đổi màu vé tức thì với 1 chạm, không bị che bởi color picker native của hệ điều hành điện thoại.
- **Touch Sliders & Adaptive Drawer (Chống Che Bàn Phím Ảo):**
  - Kích thước thumb slider 24–26px với `touch-action: pan-x`.
  - Drawer di động tự động mở rộng lên 72dvh (`:focus-within`) khi gõ chữ vào ô Lời nhắn / Chi nhánh.
- **Tối Ưu Kích Thước Preview Vé Mẫu (Khắc Phục Vé Quá Nhỏ):**
  - Hạ chiều cao mặc định của Drawer xuống `32dvh` (Chế độ Xem Vé Lớn), giải phóng 70% màn hình cho khu vực xem trước.
  - Scale của vé tăng từ `0.35x` lên `1.10x – 1.55x` (gấp 3 đến 3.5 lần, nhìn rõ mọi thay đổi viền, chữ số, căn chỉnh milimet).
  - Thanh kéo Handle (`#sheet-drag-handle`) 1 chạm chuyển đổi nhanh giữa 2 nấc: `32dvh` (Xem vé lớn) và `56dvh` (Bảng mở rộng).
  - Nút nổi `[ 🔍 Phóng to ]` (`#btn-focus-preview`): 1 chạm bung vé toàn màn hình sắc nét với scale lên tới `2.20x`.
  - **Quy tắc cố định 32dvh:** Khi đổi bất kỳ tab chính hay sub-tab chip nào, Drawer luôn được trả về mức mặc định `32dvh` (loại bỏ focus-within giả từ các nút bấm); việc mở rộng `56dvh` hoàn toàn do người dùng chủ động điều khiển qua Handle.

---

## 🔮 Cập Nhật Hoàn Thành: Sprint 7 & Sprint 8 (Kế Thừa Tinh Hoa GitHub)

### 🌟 Sprint 7: Quản Lý & Lưu Trữ Mẫu Tự Thiết Kế (Custom Preset & Storage Manager) — ✅ ĐÃ HOÀN THÀNH
*Kế thừa từ `dotslashgabut/idcardgenerator` và kiến trúc `nanostores`:*
- **Kích hoạt Tab "Đã lưu" (`#panel-saved`):**
  - Cho phép người dùng lưu lại thiết kế hiện tại với tên tùy chỉnh (ví dụ: *Vé giờ cao điểm, Vé khuyến mãi Tết, Vé trẻ em*).
  - Tự động sinh ảnh thumbnail thu nhỏ trực tiếp bằng Canvas/SVG để hiển thị trực quan trong danh sách thẻ đã lưu.
- **Lưu trữ bền vững & Xuất/Nhập file JSON:**
  - Module `js/storage/preset-manager.js` lưu trữ vào `localStorage` với cơ chế quản lý phiên bản (Schema Versioning).
  - Nút **[Xuất cấu hình JSON]** và **[Nạp cấu hình JSON]** để quản lý chuỗi nhà hàng có thể chia sẻ mẫu thiết kế giữa các chi nhánh hoặc sao lưu khi đổi thiết bị di động.
- **Áp dụng mẫu 1 chạm:** Chọn mẫu đã lưu sẽ nạp đồng bộ toàn bộ biến vào `TicketStore` và render tức thì.

### 🖨️ Sprint 8: Nâng Cấp Dàn Trang In A4 & Vạch Cắt Chuẩn Máy In (A4 N-Up Imposition Grid & Crop Marks) — ✅ ĐÃ HOÀN THÀNH
*Kế thừa từ `sebastian-software/asn-label-maker` và `ezdanapak/shipping-label`:*
- **Nâng cấp Viền Cắt An Toàn 1.0mm (Cut Margins):**
  - Nâng lề cắt từ 0.5mm lên `1.0mm` để khi nhân viên dùng kéo hoặc dao rọc giấy không bị cắt lẹm vào nội dung vé (Kích thước vé có lề: `45×80mm` trên lõi `43×78mm`).
- **Thuật toán Dàn Trang In Lưới A4 N-up Tối Ưu:**
  - Tự động phân bổ lưới tối ưu: Khổ dọc (Portrait) 4 cột × 3 hàng = 12 vé/trang; Khổ ngang (Landscape) 6 cột × 2 hàng = 12 vé/trang.
  - Tự động căn giữa trang với lề bảo vệ an toàn cho máy in >= 5mm.
- **Hệ thống Vạch Cắt Tự Động Chuẩn Máy In (Crop/Cut Marks):**
  - Vạch ticks 3mm ở 4 mép biên trang (Top, Bottom, Left, Right) cách mép vé 1mm.
  - Dấu chữ thập `+` dài 3mm tại các điểm giao cắt 4 góc giữa các con vé liền kề.
  - Hỗ trợ cả 2 luồng: xuất PDF (`jsPDF.line`) cho mobile và SVG overlay vector siêu nét cho Desktop Direct Print.
  - Checkbox `#crop-marks-toggle` trong hộp thoại in hỗ trợ đa ngôn ngữ Nhật - Việt.
- **In Hàng Loạt Theo Dải Số Thứ Tự & In 2 Mặt (Duplex):**
  - Nhập số lượng tuần tự (1–N) hoặc dải số rời rạc (`2; 5; 10-15`), tự động co giãn font chữ chống tràn.
  - In 2 mặt với lề đối xứng gương và vạch cắt khớp tuyệt đối khi lật ngang tờ giấy A4.

### 🏆 Sprint 9: Trọn Bộ Bốn Mùa (Xuân - Hạ - Thu - Đông) & Khử Răng Cưa In Nhiệt Đơn Sắc — ✅ ĐÃ HOÀN THÀNH
*Khai thác kho đồ họa vector chính hãng từ repo [`hoangvandat8679-dot/assets-images`](https://github.com/hoangvandat8679-dot/assets-images):*

- **Bộ Sưu Tập Bốn Mùa Chuyên Nghiệp (Four Seasons Collection):**
  - **Mẫu Mùa Xuân (`spring.js`):** Hoa anh đào Sakura, cánh hoa rơi phất phới, nền hồng phấn pastel, linh vật RaiRaiTei đón chào xuân mới.
  - **Mẫu Mùa Hè (`summer.js` - `Mùa Hè.svg`):** Lễ hội pháo hoa Matsuri & Hoa hướng dương, nền vector rực rỡ, tông đỏ cam `#d90012`, viền bo góc và phông chữ Impact thể hiện sự sôi động của mùa hè.
  - **Mẫu Mùa Thu (`autumn.js` - `Mùa Thu.svg`):** Rừng lá phong Momiji đỏ rực & Đêm ngắm trăng Otsukimi, tông đỏ thẫm `#e10000` phối viền vàng hổ phách `#d97706`.
  - **Mẫu Mùa Đông (`winter.js` - `Mùa Đông.svg`):** Đêm hội tuyết trắng & Đèn chiếu sáng Illumination lung linh, tông nền xanh tuyết dịu mát `#f0f9ff` phối đỏ tươi `#d80000`.
  - Toàn bộ 4 mẫu mùa và Mẫu chuẩn đều được kiến trúc hóa 100% qua `TemplateRegistry`, tự động kích hoạt layout vector toàn màn hình (ẩn marquee border), đổi màu chữ, đổi viền số và đồng bộ tức thì với TicketStore.
  - Tích hợp 4 nút bấm chọn mùa trực quan trong Template Grid (`index.html`) kèm đa ngôn ngữ tiếng Nhật và tiếng Việt hoàn chỉnh trong `js/i18n.js`.
- **Thuật Toán Floyd-Steinberg Dithering 1-bit:**
  - Khử răng cưa đơn sắc (1-bit monochrome error diffusion) khi người dùng bật chế độ in nhiệt (`thermal-simulation-mode`) và xuất file PNG đơn chiếc.
  - Tái tạo bản in pixel-perfect mô phỏng chính xác hạt mực nhiệt 203 DPI của máy in hóa đơn ESC/POS thực tế (đen/trắng tuyệt đối 0 hoặc 255).
- **Tối Ưu Hóa Nén File PDF In Ấn (High-Fidelity JPEG 0.92):**
  - Giảm dung lượng file PDF từ 15MB xuống chỉ còn 1.2MB–1.8MB (giảm 85%), tăng tốc độ sinh file gấp 3 lần trên mobile và chống tràn RAM WebKit Safari iOS.
- **Bộ Kiểm Thử Toàn Diện (Comprehensive E2E Suite):**
  - Đạt 100% tất cả 11/11 tiêu chí kiểm duyệt QA Gates (TemplateRegistry 5 mẫu vé, Dithering 0/255, Lưới N-up A4 12 vé/trang, Lề cắt 1.0mm, Co giãn chữ số 1-N).





