# Nhật ký thay đổi — RaiRaiTei Queue Ticket

## Bản sau lễ 2026 (lên sóng từ 9/11/2026, sau lễ kỷ niệm)
Hoàn thiện toàn repo theo kế hoạch đã duyệt 3/11/2026 (GĐ1–GĐ4 + thiết kế lại R0–R5). Hành vi người dùng giữ nguyên — đối chiếu bằng snapshot trạng thái + computed style toàn phần và bộ test hành vi 43 mục, tất cả đạt.
- **Dữ liệu bền:** tự lưu bản nháp khi đang chỉnh (khôi phục khi mở lại app, có nút Về mặc định); preset chống tràn bộ nhớ trình duyệt (cảnh báo ở 80%, chặn khi đầy); tệp thiết kế có cổng phiên bản — tệp của app mới hơn được báo rõ thay vì nạp hỏng.
- **In tin cậy:** trang kiểm tra in (thước mm, đường 100 mm, khung vé 43×78, dấu căn hai mặt) cho cả PC và điện thoại; hộp thoại in tự kiểm tra thư viện/ảnh trước khi cho bấm in.
- **Offline:** app chạy được khi mất mạng sau lần mở đầu (Service Worker); có thông báo "Đã có bản mới — Nạp lại" thay vì tự đổi giữa ca.
- **Hiệu năng:** ảnh mẫu theo mùa nhẹ hơn ~79% (Hè 236 KB, Thu 271 KB, Đông 436 KB), ảnh xem trước của thẻ mẫu ~9 KB, không còn tải thư viện/phông/ảnh từ CDN — mọi thứ đóng gói trong repo.
- **Nền móng:** bỏ động cơ mẫu cũ chạy song song; toàn bộ mã là ES Modules (điểm vào js/app.js); export.js tách thành 7 module js/print/; độ lệch kéo thả hợp nhất vào một store duy nhất (bỏ input ẩn hai chiều); CSS mẫu tách riêng css/templates.css; test gom vào tests/, công cụ vào tools/.

## Bản lễ 2026 (3/11/2026) — tag: le-2026-ban-chinh
- Sửa lỗi dải tên quán「安佐南相田店」biến mất ở các mẫu Mùa Hạ, Mùa Thu, Mùa Đông (CSS ép nền dải trong suốt; nay dải dùng đúng màu cấu hình của từng mẫu).
- Thêm README ở gốc repo: giới thiệu app, hướng dẫn in hai mặt, cách lưu preset/thiết kế JSON.
- Bản dự phòng cho lễ: tag `le-2026-ban-du-phong` (bản 16/9/2026).
- Đóng băng từ 12:00 ngày 6/11/2026 tới hết lễ kỷ niệm 7–8/11/2026 (chỉ sửa lỗi chặn in ấn).

## Trước đó
- 3/11/2026: 5 mẫu theo mùa qua Template Registry, kéo thả trực tiếp trên vé, preset theo tên (localStorage), dàn trang A4 N-up kèm vạch cắt, kích thước lõi mặc định 43 × 78 mm.
- 16/9/2026: bản nền của công cụ thiết kế vé (mẫu Mùa Xuân, in hai mặt, lưu/nạp JSON).
