import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Check, Copy, Heart, Info, PartyPopper, X } from "lucide-react";
import CoupleTemplate150 from "../templates/CoupleTemplate150.jsx";
import defaultCouple from "../data/defaultCouple.js";
import { createCoupleData } from "../data/buildCouple.js";
import { getCoupleBySlug, loadDraft } from "../utils/storage.js";
import { getPairBySlug, hasSlug } from "../data/couples/index.js";
import { navigate } from "../utils/router.js";

/** Tìm coupleData theo slug: localStorage → draft → registry → demo */
function resolveCouple(slug) {
  const saved = getCoupleBySlug(slug);
  if (saved) return { data: saved, found: true };
  if (slug === "draft") {
    const draft = loadDraft();
    return {
      data: draft ? createCoupleData(draft, { unique: false }) : defaultCouple,
      found: Boolean(draft),
    };
  }
  if (hasSlug(slug)) return { data: getPairBySlug(slug).config, found: true };
  return { data: defaultCouple, found: false };
}

/**
 * TRANG /preview/:slug — xem trước website cá nhân hoá.
 *  · Standalone: hiện thanh nổi "← Chỉnh sửa" + "Đặt website này ❤️".
 *  · Embed (?embed=1 — iframe trong /create): nhận dữ liệu realtime qua
 *    postMessage, KHÔNG hiện toolbar, dùng đúng template gốc.
 * Chưa có thanh toán thật — chỉ nút đặt hàng placeholder (yêu cầu #14).
 */
export default function PreviewPage({ slug }) {
  const embed = useMemo(
    () => new URLSearchParams(window.location.search).get("embed") === "1",
    []
  );
  const [state, setState] = useState(() => resolveCouple(embed ? "draft" : slug));

  /* Embed: lắng nghe form gửi dữ liệu mới mỗi lần gõ */
  useEffect(() => {
    if (!embed) return;
    const onMessage = (e) => {
      const d = e.data;
      if (d && d.type === "LOVE_COUPLE_DATA" && d.couple) {
        setState({ data: d.couple, found: true });
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [embed]);

  /* Standalone: đổi slug (điều hướng) → nạp lại dữ liệu */
  useEffect(() => {
    if (!embed) setState(resolveCouple(slug));
  }, [slug, embed]);

  const [showOrder, setShowOrder] = useState(false);
  const [copied, setCopied] = useState(false);
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* bỏ qua */
    }
  };

  return (
    <>
      <CoupleTemplate150 data={state.data} />

      {!embed && (
        <>
          {/* Báo nhẹ khi slug chưa có dữ liệu (đang xem demo) */}
          <AnimatePresence>
            {!state.found && (
              <motion.div
                initial={{ opacity: 0, y: -16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="fixed left-1/2 top-4 z-[88] flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/70 bg-white/80 px-4 py-2 text-xs font-semibold text-cocoa/70 shadow-card backdrop-blur"
              >
                <Info size={14} className="shrink-0 text-berry" />
                Chưa có website nào ở link này — đang xem bản demo mặc định ❤️
              </motion.div>
            )}
          </AnimatePresence>

          {/* Thanh công cụ nổi dưới đáy */}
          <motion.div
            initial={{ y: 90, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, type: "spring", stiffness: 220, damping: 26 }}
            className="fixed inset-x-0 bottom-4 z-[88] flex justify-center px-4 pb-[env(safe-area-inset-bottom)]"
          >
            <div className="glass flex w-full max-w-xl items-center gap-1 rounded-full p-2 shadow-soft">
              <button
                onClick={() => navigate(`/create?edit=${slug}`)}
                className="flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-semibold text-cocoa/70 transition hover:text-wine"
              >
                <ArrowLeft size={16} /> Chỉnh sửa
              </button>
              <button
                onClick={() => setShowOrder(true)}
                className="ml-auto flex items-center gap-1.5 rounded-full bg-gradient-to-r from-berry to-lilac px-5 py-2.5 text-sm font-semibold text-white shadow-glow transition-transform hover:scale-[1.03] active:scale-95"
              >
                <Heart size={15} strokeWidth={0} fill="currentColor" />
                Đặt website này
                <span className="hidden sm:inline">— 150.000đ ❤️</span>
              </button>
            </div>
          </motion.div>

          {/* Modal đặt website — placeholder, chưa kết nối thanh toán */}
          <AnimatePresence>
            {showOrder && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowOrder(false)}
                className="fixed inset-0 z-[95] grid place-items-center bg-night/60 p-5 backdrop-blur-lg"
              >
                <motion.div
                  initial={{ scale: 0.8, y: 30, opacity: 0 }}
                  animate={{ scale: 1, y: 0, opacity: 1 }}
                  exit={{ scale: 0.9, y: 20, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 220, damping: 22 }}
                  onClick={(e) => e.stopPropagation()}
                  className="relative w-full max-w-md rounded-[2rem] border border-white/70 bg-cream p-8 text-center shadow-2xl"
                >
                  <button
                    onClick={() => setShowOrder(false)}
                    aria-label="Đóng"
                    className="absolute right-4 top-4 rounded-full p-2 text-cocoa/40 transition hover:text-wine"
                  >
                    <X size={18} />
                  </button>

                  <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-berry to-lilac text-white shadow-glow">
                    <PartyPopper size={26} />
                  </span>

                  <h3 className="mt-5 font-display text-2xl font-bold text-cocoa">
                    Website của hai bạn đã sẵn sàng! 🎉
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-cocoa/65">
                    Link riêng{" "}
                    <span className="font-bold text-wine">/{state.data.slug}</span> sẽ được
                    kích hoạt <span className="font-semibold">vĩnh viễn</span> sau khi đặt.
                    Gía gói Sweet Love:{" "}
                    <span className="font-bold text-wine">150.000đ</span> ❤️
                  </p>
                  <p className="mt-2 text-xs text-cocoa/45">
                    (Bản demo chưa kết nối thanh toán — bước tiếp theo sẽ gắn Zalo Pay/Momo/chuyển khoản)
                  </p>

                  <button onClick={copyLink} className="btn-primary mt-6 w-full">
                    {copied ? <Check size={17} /> : <Copy size={17} />}
                    {copied ? "Đã sao chép link!" : "Sao chép link xem trước"}
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </>
  );
}