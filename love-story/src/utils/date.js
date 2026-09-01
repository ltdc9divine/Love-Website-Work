/**
 * Hàm xử lý ngày tháng — dùng chung cho toàn site.
 */

/** "2025-02-14" → Date (00:00 giờ local, tránh lệch múi giờ) */
export function parseStart(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d, 0, 0, 0);
}

/** "2025-02-14" → "14.02.2025" */
export function formatDots(iso) {
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
}

/** "2025-02-14" → "14 tháng 2, 2025" */
export function formatLongVI(iso) {
  return parseStart(iso).toLocaleDateString("vi-VN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Số → "07" (pad 2 số cho đồng hồ) */
export function pad2(n) {
  return String(n).padStart(2, "0");
}
