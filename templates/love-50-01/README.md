# Love 50-01

Template website tình yêu thương mại 50.000 VNĐ, hoạt động độc lập bằng HTML, CSS và JavaScript thuần. Khách mở link, điền thông tin, chọn ảnh, thêm nhạc hoặc QR tùy chọn, rồi nhận ngay một trang tình yêu hoàn chỉnh.

## Cách chạy

Mở `index.html` trực tiếp bằng trình duyệt hoặc dùng Live Server trong VS Code. QR Code dùng thư viện nhẹ từ CDN và có fallback nếu CDN không tải được. Không cần cài package, database, backend hay API riêng.

## Deploy Vercel

Import repository lên Vercel, chọn **Framework Preset: Other**, để trống Build Command và Output Directory, rồi deploy. Đây là static site nên Vercel sẽ phục vụ trực tiếp `index.html`.

## Khách có thể thay đổi

- Tên hai người, lời nhắn ngắn, lá thư tình và ngày đặc biệt.
- Ảnh đại diện hai người và tối đa 6 ảnh album.
- Nhạc MP3 tùy chọn, có preview trong form và play/pause trong trang kết quả.
- Nội dung QR tùy chọn: URL mạng xã hội, video hoặc đoạn text.

Dữ liệu được xử lý ở trình duyệt. Thông tin form, ảnh dạng Data URL, tùy chọn nhạc và QR được lưu trong `localStorage` để khôi phục sau khi refresh. Ảnh giới hạn 2MB mỗi file, nhạc giới hạn 5MB; nếu vượt quá sẽ hiện cảnh báo thay vì làm trang bị lỗi.

## Nhân bản template

Copy thư mục `love-50-01` thành `love-50-02`, `love-50-03`... rồi thay đổi giao diện trong `style.css`. Có thể đổi nội dung bố cục trong `index.html`, nhưng nên giữ các `id` và tên field hiện có để hệ thống form, lưu dữ liệu, upload và render kết quả tiếp tục hoạt động. Mỗi thư mục là một template độc lập và không cần sửa `love-150`.
