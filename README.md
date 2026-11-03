# RaiRaiTei Queue Ticket — Công cụ tạo vé xếp hàng 来来亭 整理券作成ツール

Ứng dụng web tĩnh để **thiết kế và in vé số thứ tự (整理券） bằng giấy** cho quán ramen RaiRaiTei: chỉnh mẫu vé, đánh số, xuất PDF và in hàng loạt trên khổ A4, gồm cả in hai mặt khớp nhau.

- **Bản đang chạy:** https://hoangvandat8679-dot.github.io/RaiRaiTei-Queue-Ticket/
- **Ngôn ngữ giao diện:** tiếng Nhật (mặc định) và tiếng Việt — đổi bằng nút ngôn ngữ trên thanh công cụ.
- **Chi phí vận hành:** không. Trang tĩnh trên GitHub Pages, không máy chủ, không cơ sở dữ liệu.

## Cách dùng nhanh

1. Mở bản đang chạy ở trên (điện thoại hay máy tính đều được).
2. Chọn mẫu: Chuẩn, hoặc mẫu theo mùa — Xuân, Hạ, Thu, Đông.
3. Chỉnh các mục trong bảng điều khiển: kích thước vé (mặc định lõi 43 × 78 mm), nền, viền, mascot, số thứ tự, thông điệp, tên quán. Có thể kéo thả trực tiếp các khối trên vé.
4. Bấm **In / Lưu PDF**: chọn in liên tiếp (từ số 1, số lượng mặc định 30) hoặc chỉ định số; bật/tắt in hai mặt và vạch cắt (crop marks); xem trước tổng số trang A4 (12 vé/trang) rồi xác nhận.

## Lưu trữ — đọc kỹ để không mất mẫu

- **Preset theo tên:** mục "Mẫu đã lưu" cho phép lưu thiết kế theo tên ngay trong trình duyệt (localStorage), kèm xuất/nhập preset ra file.
- **Thiết kế JSON:** nút lưu/tải thiết kế ở bảng điều khiển xuất toàn bộ thiết kế ra file JSON và đọc lại được — đây là cách sao lưu chắc chắn nhất.
- **Giới hạn hiện tại:** thiết kế đang chỉnh **chưa được tự lưu**. Đóng tab mà chưa lưu preset hay xuất JSON là mất phần đang chỉnh. Dữ liệu chỉ nằm trên trình duyệt/máy đang dùng, không đồng bộ giữa các máy.

## Chạy thử ở máy phát triển

```bash
node server.mjs   # mở http://localhost:3000 — chỉ dùng lúc phát triển, không phải máy chủ production
node tests/test-full-integration.mjs
node tests/test-sprint8-cropmarks.mjs
```

## Cấu trúc thư mục

- `index.html` — trang duy nhất của app.
- `css/` — giao diện; `css/tokens/` chứa biến thiết kế (màu, kích thước, phông).
- `js/` — logic: `core/` (store tín hiệu cho kéo thả), `registry/` (định nghĩa 5 mẫu vé), `storage/` (quản lý preset), `export.js` (dàn trang A4, PDF, in hai mặt), `i18n.js` (dịch Nhật/Việt).
- `assets/` — ảnh mascot và artwork các mẫu mùa.
- `Work/` — tài liệu kế hoạch, kiến trúc và danh sách sprint của dự án.

## Ghi chú phát hành

- Mọi thay đổi đều qua kiểm chứng trên bản live sau khi GitHub Pages deploy.

## Dành cho người phát triển

- Chạy local: `node server.mjs` rồi mở http://127.0.0.1:3000 — server này chỉ dùng lúc phát triển (nghe mọi địa chỉ mạng, CORS mở), không phải bản live.
- Chạy test: `npm install` (lần đầu, chỉ để lấy jsdom cho test) rồi `npm test`. Bộ test gồm 2 test tĩnh trên mã nguồn và 1 test hành vi chạy app thật trong jsdom (chọn mẫu, đọc số tùy ý, tính lưới A4).
- Người dùng chủ yếu vào bằng điện thoại (~90%): khi sửa giao diện hoặc luồng in, kiểm tra bản mobile trước (thanh danh mục dưới đáy, nút in mobile đi đường PDF riêng), bản PC sau.
- Quy ước commit: mỗi vé việc một commit nhỏ, thông điệp ghi rõ phạm vi; không commit khi chưa có phép của chủ repo theo giai đoạn đã duyệt.
