/**
 * SLUG — biến tên cặp đôi thành đường dẫn URL thân thiện.
 *
 *   slugify("Minh", "Ngọc")  → "minh-ngoc"
 *   slugify("Đạt", "Linh")   → "dat-linh"
 *   slugify("Anh Thảo!", "") → "anh-thao"
 *
 * uniqueSlug("minh-ngoc", ["minh-ngoc"]) → "minh-ngoc-2"
 * (chuẩn bị sẵn cho lúc có database: slug trùng thì đánh số thứ tự)
 */

export function slugify(...parts) {
  const raw = parts
    .filter((p) => p && String(p).trim())
    .join(" ")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // bỏ dấu thanh: à á ạ ả ã → a
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s-]/g, " ") // ký tự đặc biệt → khoảng trắng
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return raw || "couple";
}

/** Đảm bảo slug không trùng: minh-ngoc → minh-ngoc-2 → minh-ngoc-3 … */
export function uniqueSlug(base, taken) {
  const set = taken instanceof Set ? taken : new Set(taken || []);
  if (!set.has(base)) return base;
  let i = 2;
  while (set.has(`${base}-${i}`)) i += 1;
  return `${base}-${i}`;
}