import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Heart } from "lucide-react";
import SectionTitle from "./SectionTitle";
import { fadeUp } from "../utils/motion";

/** Tỉ lệ ảnh xen kẽ để layout masonry đẹp, không đều tăm tắp */
const ASPECTS = ["aspect-[3/4]", "aspect-square", "aspect-[4/5]", "aspect-[3/4]", "aspect-[4/3]"];

/**
 * PHOTO GALLERY — 1 ảnh lớn nổi bật phía trên + masonry 2-3 cột,
 * click/tap mở lightbox (mượt, có vuốt trái/phải, phím tắt ←/→/Esc).
 */
export default function PhotoGallery({ couple: c }) {
  const photos = c.photos ?? [];
  const [open, setOpen] = useState(-1);

  const close = useCallback(() => setOpen(-1), []);
  const next = useCallback(() => setOpen((v) => (v + 1) % photos.length), [photos.length]);
  const prev = useCallback(
    () => setOpen((v) => (v - 1 + photos.length) % photos.length),
    [photos.length]
  );

  /* Phím tắt + khoá cuộn nền khi mở lightbox */
  useEffect(() => {
    if (open < 0) return;
    document.body.style.overflow = "hidden";
    const onKey = (e) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, close, next, prev]);

  if (photos.length === 0) return null;

  return (
    <section id="gallery" className="scroll-mt-10 px-5 py-20 md:py-28">
      <SectionTitle kicker="Album" title="Những khoảnh khắc của chúng ta 📸" />

      {/* Ảnh lớn nổi bật */}
      <motion.figure {...fadeUp()} className="group relative mx-auto mb-5 max-w-4xl cursor-pointer overflow-hidden rounded-[2rem] shadow-soft">
        <img
          src={photos[0]}
          alt="Kỷ niệm nổi bật"
          loading="lazy"
          onClick={() => setOpen(0)}
          className="aspect-[4/3] w-full object-cover transition-transform duration-700 group-hover:scale-[1.03] sm:aspect-[21/9]"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-berry/35 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        <span className="pointer-events-none absolute bottom-4 right-4 inline-flex items-center gap-1.5 rounded-full bg-white/85 px-3.5 py-1.5 text-xs font-semibold text-wine backdrop-blur">
          <Heart size={12} strokeWidth={0} fill="currentColor" /> Chạm để xem
        </span>
      </motion.figure>

      {/* Masonry 2–3 cột */}
      <div className="mx-auto max-w-4xl columns-2 gap-3.5 md:columns-3 md:gap-5">
        {photos.slice(1).map((p, i) => (
          <motion.button
            key={i}
            {...fadeUp((i % 3) * 0.08)}
            onClick={() => setOpen(i + 1)}
            className="group mb-3.5 block w-full break-inside-avoid cursor-pointer overflow-hidden rounded-3xl shadow-card transition-shadow hover:shadow-soft md:mb-5"
            aria-label={`Xem ảnh ${i + 2}`}
          >
            <img
              src={p}
              alt={`Kỷ niệm ${i + 2}`}
              loading="lazy"
              className={`w-full object-cover transition-transform duration-500 group-hover:scale-105 group-active:scale-95 ${ASPECTS[i % ASPECTS.length]}`}
            />
          </motion.button>
        ))}
      </div>

      {/* LIGHTBOX — xem phần render ở dưới */}
      <Lightbox
        photos={photos}
        open={open}
        close={close}
        next={next}
        prev={prev}
      />
    </section>
  );
}


/* ── Lightbox fullscreen ─────────────────────────────────── */
function Lightbox({ photos, open, close, next, prev }) {
  return (
    <AnimatePresence>
      {open >= 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={close}
          className="fixed inset-0 z-[90] flex items-center justify-center bg-night/95 p-4 backdrop-blur-md"
        >
          {/* Nút đóng */}
          <button
            onClick={close}
            aria-label="Đóng"
            className="glass absolute right-4 top-4 z-10 rounded-full p-2.5 text-white shadow-soft transition-transform hover:scale-110"
          >
            <X size={20} />
          </button>

          {/* Trước / Sau */}
          {photos.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prev(); }}
                aria-label="Ảnh trước"
                className="glass absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full p-2.5 text-white shadow-soft transition-transform hover:scale-110 sm:left-5"
              >
                <ChevronLeft size={22} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); next(); }}
                aria-label="Ảnh sau"
                className="glass absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full p-2.5 text-white shadow-soft transition-transform hover:scale-110 sm:right-5"
              >
                <ChevronRight size={22} />
              </button>
            </>
          )}

          {/* Ảnh — vuốt được trên mobile */}
          <motion.img
            key={open}
            src={photos[open]}
            alt={`Kỷ niệm ${open + 1}`}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.6}
            onDragEnd={(_, info) => {
              if (info.offset.x < -70) next();
              else if (info.offset.x > 70) prev();
            }}
            initial={{ scale: 0.82, opacity: 0, y: 24 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.88, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[82vh] max-w-full cursor-grab rounded-2xl object-contain shadow-2xl active:cursor-grabbing"
          />

          {/* Bộ đếm */}
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-white/15 px-4 py-1.5 text-xs font-semibold tracking-widest text-white backdrop-blur"
          >
            {open + 1} / {photos.length}
          </motion.span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
