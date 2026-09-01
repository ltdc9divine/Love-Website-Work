/**
 * CONTENT — cho phép từng cặp đôi đổi CHỮ TIÊU ĐỀ các section
 * mà không đụng vào code (mặc định giữ nguyên giao diện demo).
 *
 * couple.sectionTitles = { counter, story, gallery, memories }
 */
export function sectionTitle(couple, key, fallback) {
  return couple?.sectionTitles?.[key] || fallback;
}