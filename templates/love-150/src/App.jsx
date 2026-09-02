import { useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Analytics } from "@vercel/analytics/react";
import { useRoute } from "./utils/router.js";
import { getPairBySlug } from "./data/couples/index.js";
import CreatePage from "./pages/CreatePage.jsx";
import PreviewPage from "./pages/PreviewPage.jsx";
import CoupleTemplate150 from "./templates/CoupleTemplate150.jsx";
import { getTemplate } from "./templates/index.js";

/**
 * APP ROUTER (nhẹ, không cần react-router-dom)
 *
 *   /                  → DEMO "Minh ❤️ Ngọc" (CoupleTemplate150 + defaultCouple)
 *   /demo              → như trên (link thay thế để quay TikTok)
 *   /create            → form tạo website + live preview
 *   /preview/:slug     → xem trước website khách (toolbar Chỉnh sửa / Đặt hàng)
 *   /:slug             → website của từng cặp (hiện tại: minh-ngoc;
 *                        sau này nạp thêm từ database tại đây)
 *
 * Kiến trúc: ROUTE → COUPLE DATA → TEMPLATE({ data }) → UI.
 */
export default function App() {
  const route = useRoute();

  /* Dữ liệu demo — dùng cho route gốc */
  const demoData = useMemo(() => getPairBySlug(route.slug || "minh-ngoc").config, [route.slug]);

  /* Template theo templateId của dữ liệu (chuẩn bị cho Template300/500) */
  const Template = getTemplate(demoData.templateId).Component;

  let page = null;
  let key = "demo";

  if (route.name === "create") {
    page = <CreatePage />;
    key = "create";
  } else if (route.name === "preview") {
    page = <PreviewPage slug={route.slug} />;
    key = `preview-${route.slug}`;
  } else {
    page = <Template data={demoData} />;
    key = `couple-${route.slug}`;
  }

  return (
    <>
      <AnimatePresence mode="wait">
        <motion.div
          key={key}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          {page}
        </motion.div>
      </AnimatePresence>
      <Analytics />
    </>
  );
}
