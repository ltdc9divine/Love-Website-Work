/**
 * 🗂  TEMPLATE REGISTRY — danh mục các mẫu website tình yêu.
 *
 * Mỗi template = 1 component nhận `data` (coupleData) giống hệt nhau,
 * nên khách chọn mẫu nào cũng giữ được dữ liệu đã nhập:
 *
 *    templates = { "sweet-love": CoupleTemplate150, "dark-romance": Template300, … }
 *
 * Thêm mẫu mới sau này:
 *    1. Tạo src/templates/CoupleTemplateXXX.jsx (cùng props contract: { data })
 *    2. Thêm 1 dòng vào TEMPLATES bên dưới — /create sẽ tự cho khách chọn.
 */
import CoupleTemplate150 from "./CoupleTemplate150.jsx";

export const TEMPLATES = {
  "sweet-love": {
    id: "sweet-love",
    name: "Sweet Love",
    tagline: "Pastel ngọt ngào — chuẩn quay TikTok",
    price: 150000,
    priceLabel: "150.000đ",
    Component: CoupleTemplate150,
  },
};

export const DEFAULT_TEMPLATE_ID = "sweet-love";

export function getTemplate(id) {
  return TEMPLATES[id] || TEMPLATES[DEFAULT_TEMPLATE_ID];
}