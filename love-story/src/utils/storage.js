/**
 * STORAGE — lưu tạm dữ liệu khách hàng bằng localStorage (chưa cần database).
 *
 * Kiến trúc: FORM → COUPLE DATA → TEMPLATE → PREVIEW.
 * Sau này thay localStorage bằng API/Supabase: chỉ cần đổi 5 hàm dưới đây,
 * form & template không phải sửa gì.
 *
 *   lovewebsite.draft     → form đang nhập (tự lưu mỗi lần gõ)
 *   lovewebsite.couples   → { slug: coupleData } các website đã "Tạo"
 *   lovewebsite.lastSlug  → slug tạo lần gần nhất
 */

const K_DRAFT = "lovewebsite.draft";
const K_COUPLES = "lovewebsite.couples";
const K_LAST = "lovewebsite.lastSlug";

function safeGet(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function safeSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false; // hết quota hoặc trình duyệt chặn storage
  }
}

/* ── Draft (form đang nhập) ─────────────────────────────── */

export function loadDraft() {
  return safeGet(K_DRAFT, null);
}

/** Lưu draft; nếu hết quota do ảnh nhiều → lưu lại bản bỏ ảnh. */
export function saveDraft(form) {
  if (safeSet(K_DRAFT, form)) return { ok: true };
  const slim = { ...form, photos: [], coverImage: "" };
  if (safeSet(K_DRAFT, slim)) return { ok: false, reason: "photos-dropped" };
  return { ok: false, reason: "unavailable" };
}

export function clearDraft() {
  try {
    localStorage.removeItem(K_DRAFT);
  } catch {
    /* bỏ qua */
  }
}

/* ── Các website đã tạo ─────────────────────────────────── */

export function getCoupleBySlug(slug) {
  if (!slug) return null;
  return safeGet(K_COUPLES, {})[slug] || null;
}

export function saveCouple(couple) {
  const map = safeGet(K_COUPLES, {});
  map[couple.slug] = couple;
  if (!safeSet(K_COUPLES, map)) {
    // Hết quota (ảnh data URL lớn) → lưu bản không ảnh để vẫn giữ link/slug
    map[couple.slug] = { ...couple, photos: [] };
    safeSet(K_COUPLES, map);
  }
  try {
    localStorage.setItem(K_LAST, couple.slug);
  } catch {
    /* bỏ qua */
  }
}

/** Các slug đã tồn tại trên máy này — dùng để tránh trùng khi tạo mới */
export function listSavedSlugs() {
  return Object.keys(safeGet(K_COUPLES, {}));
}

export function getLastSlug() {
  try {
    return localStorage.getItem(K_LAST);
  } catch {
    return null;
  }
}