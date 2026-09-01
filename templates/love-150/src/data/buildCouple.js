/**
 * BUILD COUPLE — biến dữ liệu khách nhập ở /create thành coupleData
 * hoàn chỉnh đúng "shape" mà template UI cần.
 *
 * Nguyên tắc:
 *  · Khách chưa nhập gì            → trả về nguyên demo Minh ❤️ Ngọc
 *  · Khách bỏ trống trường nào     → dùng nội dung mẫu trung tính (không kèm tên)
 *  · 3 trường bắt buộc (2 tên + ngày) chỉ được validate ở bước "Tạo website"
 *
 * Kiến trúc: FORM → createCoupleData() → TEMPLATE → PREVIEW.
 * Sau này có database: chỉ cần thay nguồn `form` — hàm này giữ nguyên.
 */
import defaultCouple from "./defaultCouple.js";
import { slugify, uniqueSlug } from "../utils/slug.js";
import { formatDots, formatLongVI } from "../utils/date.js";

const MAX_PHOTOS = 20;
const MEMORY_ICONS = ["smile", "heart", "sparkles", "sun", "flower", "star"];

/* Nội dung mẫu trung tính — không kèm tên/gender, dùng khi khách bỏ trống */
const GENERIC_MEMORIES = [
  { title: "Nụ cười mỗi ngày", description: "Điều đầu tiên mình nghĩ đến khi tỉnh giấc.", icon: "smile" },
  { title: "Những tin nhắn buổi đêm", description: "Chuyện chưa kể đã cười, chuyện buồn tự tan.", icon: "heart" },
  { title: "Những chuyến đi cùng nhau", description: "Đi đâu cũng vui, miễn là có nhau.", icon: "sun" },
  { title: "Quán quen của hai đứa", description: "Món quen, chỗ quen, và người quen.", icon: "flower" },
  { title: "Bài hát của hai đứa", description: "Bật lên là thấy ngay hình bóng nhau.", icon: "sparkles" },
  { title: "Tương lai phía trước", description: "Mọi kế hoạch đều có tên của nhau.", icon: "star" },
];

const clean = (v) => (v ?? "").toString().trim();
const rowHasContent = (r = {}) => Boolean(clean(r.date) || clean(r.title) || clean(r.description));

/** Form rỗng — trạng thái ban đầu của trang /create */
export const EMPTY_FORM = {
  name1: "",
  name2: "",
  startDate: "",
  heroSubtitle: "",
  message: "",
  musicUrl: "",
  coverImage: "",
  photos: [],
  timeline: [{ date: "", title: "", description: "" }],
  memories: [],
  letterTitle: "",
  letterContent: "",
  finalMessage: "",
};

/** coupleData → form (khi bấm "← Chỉnh sửa" từ trang preview) */
export function coupleToForm(c) {
  return {
    name1: c?.name1 || "",
    name2: c?.name2 || "",
    startDate: c?.startDate || "",
    heroSubtitle: c?.heroSubtitle === defaultCouple.heroSubtitle ? "" : c?.heroSubtitle || "",
    message: c?.message || "",
    musicUrl: c?.musicUrl || "",
    coverImage: c?.coverImage || "",
    photos: Array.isArray(c?.photos) ? [...c.photos] : [],
    timeline: (c?.timeline || []).map(({ date, title, description }) => ({
      date: date || "",
      title: title || "",
      description: description || "",
    })),
    memories: (c?.memories || []).map(({ title, description }) => ({
      title: title || "",
      description: description || "",
    })),
    letterTitle: c?.loveLetter?.title || "",
    letterContent: c?.loveLetter?.content || "",
    finalMessage: c?.final?.modalMessage || "",
  };
}

/** Lá thư mẫu trung tính (dùng khi khách không viết thư) */
function genericLetter(name2) {
  return [
    `${name2} à,`,
    "",
    "Cảm ơn cậu vì đã xuất hiện trong cuộc đời tớ.",
    "",
    "Cảm ơn những ngày vui, những lần giận hờn,",
    "và cả những khoảnh khắc rất bình thường",
    "nhưng khi có cậu bên cạnh lại trở nên đặc biệt.",
    "",
    "Tớ không biết tương lai sẽ như thế nào,",
    "nhưng tớ chỉ mong ngày mai, tháng sau, năm sau",
    "vẫn được đi cùng cậu.",
    "",
    "Yêu cậu nhiều ❤️",
  ].join("\n");
}

/**
 * Tạo coupleData hoàn chỉnh từ form.
 * @param {object} form dữ liệu khách nhập
 * @param {object} opts { unique: boolean, takenSlugs: Set } — unique=true khi
 *                      bấm "Tạo website" (đảm bảo slug chưa tồn tại)
 */
export function createCoupleData(form = {}, opts = {}) {
  const name1 = clean(form.name1);
  const name2 = clean(form.name2);
  const startDate = clean(form.startDate);
  const hasPhotos = Array.isArray(form.photos) && form.photos.length > 0;
  const hasTimeline = Array.isArray(form.timeline) && form.timeline.some(rowHasContent);
  const hasMemories =
    Array.isArray(form.memories) && form.memories.some((m) => clean(m.title) || clean(m.description));
  const hasLetter = Boolean(clean(form.letterTitle) || clean(form.letterContent));
  const hasFinal = Boolean(clean(form.finalMessage));
  const hasOther = Boolean(
    clean(form.heroSubtitle) || clean(form.message) || clean(form.musicUrl) || clean(form.coverImage)
  );

  /* Khách chưa nhập gì → giữ nguyên demo đẹp (yêu cầu #5) */
  const pristine =
    !name1 && !name2 && !startDate && !hasPhotos && !hasTimeline && !hasMemories && !hasLetter && !hasFinal && !hasOther;
  if (pristine) return { ...defaultCouple, templateId: "sweet-love" };

  /* ── Trường bắt buộc: fallback về demo để preview không bao giờ vỡ ── */
  const n1 = name1 || defaultCouple.name1;
  const n2 = name2 || defaultCouple.name2;
  const date = startDate || defaultCouple.startDate;

  /* ── SLUG: minh-ngoc, dat-linh… (trùng thì -2, -3 khi unique=true) ── */
  const base = name1 || name2 ? slugify(name1, name2) : defaultCouple.slug;
  const slug = opts.unique && opts.takenSlugs ? uniqueSlug(base, opts.takenSlugs) : base;

  /* ── ẢNH ── */
  const photos = (hasPhotos ? form.photos : defaultCouple.photos).slice(0, MAX_PHOTOS);
  const photoAt = (i) => photos[i % photos.length];

  /* ── TIMELINE ── */
  const timeline = hasTimeline
    ? form.timeline.filter(rowHasContent).map((row, i) => ({
        date: clean(row.date) || formatDots(date),
        title: clean(row.title) || "Một kỷ niệm đáng nhớ",
        description: clean(row.description),
        image: photoAt(i),
      }))
    : [
        {
          date: formatDots(date),
          title: "Ngày chúng mình bắt đầu",
          description: "Mọi thứ bắt đầu từ đây ❤️",
          image: photoAt(0),
        },
      ];

  /* ── MEMORY CARDS ── */
  const memories = hasMemories
    ? form.memories
        .filter((m) => clean(m.title) || clean(m.description))
        .map((m, i) => ({
          title: clean(m.title) || "Điều dễ thương về cậu",
          description: clean(m.description),
          icon: MEMORY_ICONS[i % MEMORY_ICONS.length],
        }))
    : GENERIC_MEMORIES;

  /* ── THƯ TÌNH ── */
  const loveLetter = {
    title: clean(form.letterTitle) || "Vài điều muốn nói với cậu...",
    button: "Mở thư 💗",
    content: clean(form.letterContent) || genericLetter(n2),
    signature: "Người thương cậu,",
    signatureName: n1,
  };

  /* ── LỜI NHẮN CUỐI ── */
  const finalMessage = clean(form.finalMessage);
  const final = {
    intro: "Và còn một điều nữa...",
    reveal: finalMessage || "Yêu nhau thật nhiều ❤️",
    button: "Nhấn vào đây ❤️",
    modalTitle: "Chỉ muốn nói rằng...",
    modalMessage: finalMessage || "Yêu nhau thật nhiều — hôm nay, ngày mai, và mãi về sau ❤️",
  };

  return {
    slug,
    templateId: "sweet-love",
    name1: n1,
    name2: n2,
    startDate: date,
    heroSubtitle: clean(form.heroSubtitle) || `Yêu nhau từ ${formatLongVI(date)}`,
    message: clean(form.message) || "Câu chuyện nhỏ của hai chúng mình ❤️",
    coverImage: clean(form.coverImage),
    musicUrl: clean(form.musicUrl),
    photos,
    timeline,
    memories,
    loveLetter,
    final,
    qr: { ...defaultCouple.qr },
  };
}