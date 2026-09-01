# Lưu Bút Platform

Đây là lớp platform tĩnh cho hệ thống bán website kỷ niệm. Homepage đọc danh sách template từ `templateRegistry` trong `platform.js`, tạo detail preview, sinh form theo schema của template, lưu draft localStorage và chạy mock order/payment/publishing để kiểm thử flow.

## Chạy

Mở `index.html` trực tiếp bằng trình duyệt hoặc dùng Live Server trong VS Code. Không cần React, package, database hay backend cho bản UI development này.

## Kiến trúc

- `index.html`: homepage, preview dialog, builder dialog và order dialog.
- `platform.css`: giao diện platform, responsive mobile-first.
- `platform.js`: template registry, category filter, form engine, draft storage và mock order flow.
- `templates/love-50-01/`: template standalone, không chứa payment/order logic.
- `templates/love-150/`: sản phẩm riêng, không bị platform này sửa đổi.

Thêm template mới bằng cách thêm object vào `templateRegistry` với `id`, `name`, `category`, `price`, `description`, `demoUrl`, `enabled`, `features` và `schema`. Homepage sẽ tự render card. `schema` là nguồn để form engine sinh các field riêng cho từng template.

## Flow development hiện tại

`Homepage → Xem mẫu → Tạo ngay → Form theo schema → Preview → Create Order (PENDING/DRAFT) → DEV: Mock xác nhận PAID → PUBLISHED → publicSlug/publicUrl + QR website`

Nút mock payment được gắn nhãn rõ ràng và không phải thanh toán thật. Không triển khai flow này cho production.

## Kiến trúc production cần nối sau này

Giữ platform UI tách khỏi payment/publishing service. Backend nên có các bảng `customers`, `templates`, `orders`, `payments`, `websites`; lấy `price` từ registry/database server-side, không tin amount từ client. Payment adapter cần nhận webhook, xác minh amount/order/transaction và idempotent trước khi gọi generation job. Object storage dùng cho ảnh/nhạc; database lưu metadata; public route `/p/:slug` đọc website đã `PUBLISHED` và trả 404 hoặc trạng thái chờ nếu cần.

Một deployment Vercel/serverless không nên tạo folder/repository cho từng khách. Thay vào đó, route public dùng `slug + templateId + customerData` từ database/object storage. Public website QR và QR nội dung kỷ niệm là hai loại dữ liệu khác nhau.

## Lưu ý localStorage

localStorage chỉ dành cho draft/preview và mock order trong bản development. Ảnh/nhạc production cần upload qua backend signed URL lên object storage. Không đặt API key, webhook secret, database credential hoặc thông tin thanh toán thật trong frontend.
