/**
 * ROUTER NHẸ — không cần react-router-dom (giữ bundle gọn).
 *
 * Các route:
 *   /                  → demo (Minh ❤️ Ngọc)
 *   /demo              → demo
 *   /create            → trang nhập thông tin khách hàng
 *   /preview/:slug     → xem trước website đã tạo (có thanh công cụ)
 *   /minh-ngoc …       → website của từng cặp đôi (slug)
 *
 * Sau này thay bằng react-router hay routing từ server đều được —
 * vì UI không phụ thuộc router, chỉ nhận `data` qua props.
 */
import { useEffect, useState } from "react";

/** Điều hướng + báo cho mọi useRoute() đang lắng nghe cập nhật lại */
export function navigate(to, { replace = false } = {}) {
  if (replace) window.history.replaceState({}, "", to);
  else window.history.pushState({}, "", to);
  window.dispatchEvent(new Event("app:navigate"));
  try {
    window.scrollTo({ top: 0, behavior: "instant" });
  } catch {
    window.scrollTo(0, 0);
  }
}

/** Parse pathname → route object */
export function parsePath(pathname) {
  let segments = [];
  try {
    segments = pathname
      .replace(/^\/+|\/+$/g, "")
      .split("/")
      .filter(Boolean)
      .map((s) => decodeURIComponent(s));
  } catch {
    segments = [];
  }
  const [first, second] = segments;

  if (first === "create") return { name: "create", segments };
  if (first === "preview") {
    const embed =
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("embed") === "1";
    return { name: "preview", slug: second || "draft", embed, segments };
  }
  if (!first || first === "demo")
    return { name: "couple", slug: "minh-ngoc", segments };
  return { name: "couple", slug: first, segments };
}

/** Hook theo dõi URL hiện tại (popstate + navigate() của app) */
export function useRoute() {
  const [route, setRoute] = useState(() => parsePath(window.location.pathname));

  useEffect(() => {
    const update = () => setRoute(parsePath(window.location.pathname));
    window.addEventListener("popstate", update);
    window.addEventListener("app:navigate", update);
    return () => {
      window.removeEventListener("popstate", update);
      window.removeEventListener("app:navigate", update);
    };
  }, []);

  return route;
}