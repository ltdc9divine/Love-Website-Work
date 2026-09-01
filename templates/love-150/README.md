# 💘 Sweet Love — Template Website Tình Yêu (150.000đ)

Món quà kỹ thuật số cho mọi cặp đôi: bộ đếm thời gian bên nhau realtime, timeline
kỷ niệm, album ảnh, thư tình mở phong bì, nhạc nền, hiệu ứng trái tim, mã QR —
và bây giờ là **trang tạo website tự động cho khách**.

> Phong cách **Romantic Premium Cute** — mobile-first, sẵn sàng quay TikTok,
> deploy 1 cú click lên Vercel.

## 🔗 Các đường dẫn

| URL | Dùng để làm gì |
|---|---|
| `/` và `/demo` | Website demo **Minh ❤️ Ngọc** — dùng quay TikTok / giới thiệu |
| `/create` | Khách nhập thông tin → **live preview realtime** |
| `/preview/:slug` | Website cá nhân hóa + nút "Đặt website này — 150.000đ ❤️" |
| `/minh-ngoc` | Vào thẳng website demo bằng slug (chuẩn bị cho URL khách sau này) |

## 🏗 Kiến trúc

```
FORM (/create)  →  COUPLE DATA  →  TEMPLATE (CoupleTemplate150)  →  PREVIEW
```

* **Template UI** (`src/templates/CoupleTemplate150.jsx`) nhận `<CoupleTemplate150 data={coupleData} />`
  — **không chứa bất kỳ dữ liệu Minh/Ngọc nào bên trong**, chỉ đọc `data.*`.
* **coupleData** là object thống nhất: `name1, name2, startDate, photos, timeline,
  memories, loveLetter, final, musicUrl, coverImage, slug, templateId…`
* Form KHÔNG đụng vào UI — nó chỉ tạo `coupleData` qua `createCoupleData()`.
* Dữ liệu khách lưu **localStorage** (chưa cần database). Sau này gắn Supabase/API:
  chỉ thay các hàm trong `src/utils/storage.js` — template và form giữ nguyên.
* Nhiều template sau này (150k / 300k / 500k) đăng ký trong `src/templates/index.js`
  — tất cả dùng chung `coupleData`.

## ✨ Trang /create — "Tạo website tình yêu của hai bạn ❤️"

* **Bên trái**: form 4 bước (Thông tin → Ảnh → Câu chuyện → Xem trước) có thanh
  stepper dính trên đầu. **Bên phải**: live preview — mobile thì form trước, preview sau.
* Preview chạy **chính template gốc** trong iframe (`/preview/draft?embed=1`),
  dữ liệu gửi realtime qua `postMessage` — gõ "Thành" + "Linh" là thấy ngay
  "Thành ❤️ Linh", không cần submit.
* Chưa nhập gì → preview hiển thị demo Minh ❤️ Ngọc (demo mặc định).
* Ảnh upload được **tự nén bằng canvas** (max 1400px) trước khi đưa vào preview.
* Validation mềm (không dùng alert): "Bạn chưa nhập tên người yêu ❤️"…
* Form **tự lưu nháp** vào localStorage mỗi lần gõ — refresh không mất.

## 🏷 Slug tự động

`Minh + Ngọc → minh-ngoc` · `Đạt + Linh → dat-linh` · `Anh Thảo! → anh-thao`
(lowercase, bỏ dấu tiếng Việt, bỏ ký tự đặc biệt, khoảng trắng thành `-`).
Trùng slug sẽ tự thành `minh-ngoc-2`, `minh-ngoc-3…` (hàm `uniqueSlug` — sẵn
cho lúc có database). Nút **"Tạo website của chúng mình ❤️"** → validate → tạo
slug → lưu localStorage → chuyển sang `/preview/:slug` với nút
"← Chỉnh sửa" và "Đặt website này — 150.000đ ❤️" (chưa có thanh toán thật).

## 🚀 Chạy dự án

Cần **Node.js ≥ 18**:

```bash
npm install      # cài dependencies
npm run dev      # chạy local → http://localhost:5173
npm run assets   # tạo lại ảnh + nhạc placeholder (đã có sẵn)
npm run build    # build production → dist/
npm run preview  # xem thử bản build → http://localhost:4173
```

## 💘 Đổi dữ liệu demo (Minh ❤️ Ngọc)

Toàn bộ demo nằm trong **một file duy nhất**: `src/data/defaultCouple.js`
(tên, ngày yêu, 12 ảnh, timeline, thư tình, lời nhắn cuối, nhạc…).
Sửa file này = đổi toàn bộ website demo + nội dung mặc định của /create.

## 📷 Ảnh & 🎵 nhạc

* Ảnh demo: `public/photos/1.svg … 12.svg` — thay bằng ảnh thật rồi cập nhật
  mảng `photos` trong `defaultCouple.js`. Ảnh đầu tiên là ảnh nổi bật của gallery
  + ảnh đại diện khi chia sẻ link. Khuyến nghị ~1080px, < 500KB/ảnh.
* Nhạc demo: `public/music/love.wav` — thay bằng `love.mp3` rồi sửa `musicUrl`.
  Nhạc không tự phát (trình duyệt chặn autoplay); file lỗi → nút nhạc tự ẩn.

## 🧩 Thêm template mới (300k / 500k sau này)

1. Tạo `src/templates/CoupleTemplateXXX.jsx` — cùng contract: nhận props `{ data }`.
2. Thêm vào `TEMPLATES` trong `src/templates/index.js` (kèm tên + giá).
3. `/create` và `/preview` sẽ tự dùng template theo `templateId` trong coupleData.

## 🗃 Khi có database (Supabase/API)

Chỉ cần thay lớp storage — không đụng form/template:

* `src/utils/storage.js` → đổi `getCoupleBySlug` thành fetch API.
* `src/pages/CreatePage.jsx` → thay `saveCouple()` bằng POST API.
* Dynamic route `/:slug` đã sẵn sàng: `App.jsx` resolve slug → coupleData → template.

## ▲ Deploy Vercel

```bash
git init && git add -A && git commit -m "Sweet Love template"  # push lên GitHub
# vercel.com → New Project → chọn repo → Deploy
```

`vercel.json` đã cấu hình catch-all rewrite để `/create`, `/preview/:slug`,
`/:slug` đều hoạt động khi refresh.

## 🗂 Cấu trúc dự án

```
├── index.html                     # SEO + OG + fonts
├── vercel.json                    # catch-all rewrite cho SPA
├── public/                        # favicon, photos/, music/
├── scripts/generate-assets.mjs    # tạo ảnh + nhạc placeholder
└── src/
    ├── main.jsx                   # entry
    ├── App.jsx                    # routing: / · /demo · /create · /preview/:slug · /:slug
    ├── index.css                  # Tailwind theme + hiệu ứng + input-field
    ├── data/
    │   ├── defaultCouple.js       # 💘 DEMO Minh ❤️ Ngọc (sửa file này để đổi demo)
    │   ├── buildCouple.js         # form → coupleData (fallback demo, slug, mẫu trung tính)
    │   └── couples/index.js       # registry slug tĩnh (demo)
    ├── templates/
    │   ├── CoupleTemplate150.jsx  # 💌 TEMPLATE chính — nhận { data }
    │   └── index.js               # registry template (sweet-love 150k)
    ├── pages/
    │   ├── CreatePage.jsx         # /create — form + live preview
    │   └── PreviewPage.jsx        # /preview/:slug — template + toolbar đặt hàng
    ├── components/
    │   ├── BackgroundEffects.jsx  # trái tim bay + sparkle (CSS)
    │   ├── Hero / LoveCounter / LoveStory / PhotoGallery
    │   ├── LoveLetter / MemoryCards / FinalSurprise
    │   ├── MusicPlayer / QRSection / SectionTitle
    │   └── create/                # Stepper · PhotoUploader · RepeaterCards · ui
    ├── hooks/useLoveCounter.js    # đếm ngày/giờ/phút/giây realtime
    └── utils/                     # router · slug · storage · image · date · motion · content
```

## 🧰 Công nghệ

React 19 · Vite · Tailwind CSS v4 · Framer Motion · Lucide React · qrcode.react

---

Made with ❤️ — một template, ngàn câu chuyện tình yêu.
