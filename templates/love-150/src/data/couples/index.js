/**
 * ════════════════════════════════════════════════════════════════
 *  🗂  REGISTRY CẶP ĐÔI — kiến trúc sẵn cho nhiều khách hàng
 * ════════════════════════════════════════════════════════════════
 *
 *  Mỗi cặp đôi = 1 slug riêng:
 *     /minh-ngoc  ·  /nam-linh  ·  /an-khanh …
 *
 *  CÁCH TẠO WEBSITE CHO KHÁCH MỚI:
 *    1. Nhân đôi src/data/couple.js → src/data/couples/ten-couple.js
 *       (hoặc dùng biến môi trường COUPLE_CONFIG khi build)
 *    2. Sửa toàn bộ nội dung trong file đó (không đụng UI)
 *    3. Thêm 1 dòng vào registry bên dưới
 *    4. Deploy → khách truy cập /ten-couple
 *
 *  Khi sau này có database/API, chỉ cần thay hàm `getPairBySlug`
 *  bằng một hàm async fetch — UI không phải viết lại vì chỉ nhận
 *  object `couple` qua props.
 */

import demoCouple from "../couple.js";

/**
 * Object demo (dùng cho "/" và "/minh-ngoc").
 * Sau này có thể thay bằng import từ file riêng từng khách.
 */
const demo = {
  slug: "minh-ngoc",
  config: demoCouple,
};

/** Ghi chú: ví dụ thêm khách mới trong tương lai:
 *
 * import namLinh from "./nam-linh.js";
 * import anKhanh from "./an-khanh.js";
 *
 * const PAIRS = [demo, namLinh, anKhanh];
 */
const PAIRS = [demo];

/** Trả về config cặp đôi theo slug (hoặc demo nếu không tìm thấy). */
export function getPairBySlug(slug) {
  const normalized = (slug || "").toLowerCase().trim();
  const found = PAIRS.find((p) => p.slug === normalized);
  return found || demo;
}

export function hasSlug(slug) {
  const normalized = (slug || "").toLowerCase().trim();
  return PAIRS.some((p) => p.slug === normalized);
}

/** Danh sách slug hợp lệ — dùng để tạo sitemap/link sau này. */
export function getAllSlugs() {
  return PAIRS.map((p) => p.slug);
}
