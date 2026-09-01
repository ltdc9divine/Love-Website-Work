# 💘 Love Story Website

Website kỷ niệm tình yêu **cá nhân hóa cho từng cặp đôi** — món quà kỹ thuật số để
tặng người yêu: bộ đếm thời gian bên nhau realtime, timeline kỷ niệm, album ảnh,
thư tình mở phong bì, nhạc nền, hiệu ứng trái tim và mã QR lưu giữ trang.

> Thiết kế theo phong cách **Romantic Premium Cute** — mobile-first, sẵn sàng quay
> TikTok, deploy 1 cú click lên Vercel.

## ✨ Tính năng

| | |
|---|---|
| 🏠 Hero màn hình đầu | Tên hai người chữ script gradient, tim đập, parallax |
| ⏱ Love Counter | Đếm **ngày · giờ · phút · giây** realtime từ ngày yêu |
| 📖 Timeline | 5+ mốc kỷ niệm, animation khi cuộn, so le 2 bên |
| 🖼 Gallery | 10–20 ảnh dạng masonry, lightbox có vuốt/phím tắt |
| 💌 Love Letter | Phong bì lật nắp, tim niêm phong, thư hiện từng dòng |
| 💗 Memory Cards | 6 thẻ "Những điều anh yêu ở em" |
| 💥 Final Surprise | Nền đêm sao, nút bung trái tim + modal lời yêu thương |
| 🎵 Nhạc nền | Nút bật/tắt góc màn hình, không tự phát (tránh bị chặn) |
| 📱 QR Code | Tạo QR của chính trang web + tải PNG |
| ⚡ Performance | CSS-only background effects, `prefers-reduced-motion` |

## 🚀 1. Cài đặt & chạy local

Cần **Node.js ≥ 18**. Chạy:

```bash
npm install      # cài dependencies
npm run dev      # chạy local → http://localhost:5173
```

Tạo ảnh placeholder + nhạc demo (đã có sẵn, chỉ cần khi muốn tạo lại):

```bash
npm run assets
```

## 💘 2. Thay thông tin cặp đôi (QUAN TRỌNG NHẤT)

**Toàn bộ nội dung nằm trong 1 file duy nhất:**

```
src/data/couple.js
```

Mở file và sửa:

```js
const couple = {
  slug: "minh-ngoc",              // URL riêng: /minh-ngoc
  name1: "Minh",                  // tên bạn nam
  name2: "Ngọc",                  // tên bạn nữ
  startDate: "2025-02-14",        // ngày bắt đầu yêu (YYYY-MM-DD)
  heroSubtitle: "365 ngày bên nhau",
  message: "Cảm ơn em đã xuất hiện trong cuộc đời anh ❤️",
  musicUrl: "/music/love.wav",    // bài hát nền
  photos: ["/photos/1.jpg", ...], // danh sách ảnh
  timeline: [ ... ],              // các mốc kỷ niệm
  memories: [ ... ],              // 6 điều anh yêu ở em
  loveLetter: { ... },            // nội dung thư (\n = xuống dòng)
  final: { ... },                 // phần bất ngờ cuối
  qr: { ... },                    // card QR
};
```


## 📷 3. Thay ảnh

1. Copy ảnh của khách vào `public/photos/` (đặt tên `1.jpg`, `2.jpg`, …)
2. Sửa mảng `photos` và `timeline[].image` trong `src/data/couple.js`:

```js
photos: ["/photos/1.jpg", "/photos/2.jpg", ...],
timeline: [{ date: "14.02.2025", ..., image: "/photos/1.jpg" }, ...],
```

Khuyến nghị: ảnh dọc hoặc vuông, ~1080px, mỗi ảnh < 500KB để load nhanh trên 4G.
Ảnh đầu tiên trong mảng `photos` sẽ là **ảnh lớn nổi bật** của gallery + ảnh đại
diện khi chia sẻ link (og:image).

## 🎵 4. Thay nhạc

1. Copy bài hát vào `public/music/` (ví dụ `love.mp3`)
2. Sửa `musicUrl` trong config:

```js
musicUrl: "/music/love.mp3",
```

Nhạc **không tự phát** (trình duyệt chặn autoplay) — người xem bấm nút 🎵 góc
phải để bật. Nếu file nhạc lỗi/404, nút nhạc tự ẩn.

## 🏗 5. Build

```bash
npm run build     # tạo thư mục dist/
npm run preview   # xem thử bản build → http://localhost:4173
```

## ▲ 6. Deploy Vercel

**Cách 1 — qua Git (khuyên dùng):**

```bash
git init && git add -A && git commit -m "Love Story: minh-ngoc"
# Push lên GitHub, rồi vào vercel.com → New Project → chọn repo → Deploy
```

**Cách 2 — Vercel CLI:**

```bash
npm i -g vercel
vercel --prod
```

File `vercel.json` đã cấu hình sẵn rewrite để URL dạng `/minh-ngoc` hoạt động.

## 👥 7. Tạo phiên bản cho khách mới (bán nhiều cặp đôi)

Kiến trúc đã chuẩn bị sẵn registry theo slug trong `src/data/couples/index.js`:

1. Nhân đôi `src/data/couple.js` → `src/data/couples/nam-linh.js`, sửa toàn bộ
   nội dung (đổi cả `slug: "nam-linh"`)
2. Đăng ký trong `src/data/couples/index.js`:

```js
import namLinh from "./nam-linh.js";
const PAIRS = [demo, { slug: "nam-linh", config: namLinh }];
```

3. Deploy → khách truy cập `https://ten-mien.vercel.app/nam-linh`

Muốn **1 domain riêng cho 1 khách**: deploy repo đó thành project Vercel mới,
chỉnh `src/data/couple.js` rồi lấy domain khách tự mua gắn vào.

Sau này khi có database/API, chỉ cần thay hàm `getPairBySlug` bằng hàm fetch —
**UI không phải viết lại** vì mọi component chỉ nhận object `couple` qua props.

## 🗂 Cấu trúc dự án

```
├── index.html                  # SEO + Open Graph + fonts
├── vercel.json                 # rewrite /:slug cho SPA
├── public/
│   ├── favicon.svg
│   ├── photos/                 # ảnh kỷ niệm (12 placeholder)
│   └── music/                  # nhạc nền (demo love.wav)
├── scripts/
│   └── generate-assets.mjs     # tạo ảnh + nhạc placeholder (npm run assets)
└── src/
    ├── main.jsx
    ├── App.jsx                 # chọn cặp đôi theo slug + render sections
    ├── index.css               # Tailwind theme + hiệu ứng CSS
    ├── data/
    │   ├── couple.js           # 💘 CONFIG CẶP ĐÔI — sửa file này cho từng khách
    │   └── couples/index.js    # registry nhiều khách theo slug
    ├── hooks/
    │   └── useLoveCounter.js   # đếm ngày/giờ/phút/giây realtime
    ├── utils/                  # date + animation presets
    └── components/
        ├── BackgroundEffects.jsx   # trái tim bay + sparkle + blob (CSS)
        ├── Hero.jsx                # màn hình đầu
        ├── LoveCounter.jsx         # bộ đếm thời gian
        ├── LoveStory.jsx           # timeline kỷ niệm
        ├── PhotoGallery.jsx        # gallery + lightbox
        ├── LoveLetter.jsx          # phong bì mở thư
        ├── MemoryCards.jsx         # 6 điều anh yêu ở em
        ├── FinalSurprise.jsx       # bất ngờ cuối + modal
        ├── MusicPlayer.jsx         # nút nhạc nền
        └── QRSection.jsx           # tạo + tải QR
```

## 🧰 Công nghệ

React 19 · Vite · Tailwind CSS v4 · Framer Motion · Lucide React · qrcode.react

---

Made with ❤️ — mỗi website là một món quà, không phải một template.

Không cần đụng vào bất kỳ component nào — đổi config là đổi toàn bộ website.
