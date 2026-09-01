import { useCallback, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Heart, X } from "lucide-react";

/** Sinh 26 hạt trái tim bung theo hướng ngẫu nhiên (phân bố tròn đều) */
function makeBurst() {
  return Array.from({ length: 26 }, (_, i) => {
    const angle = (i / 26) * Math.PI * 2 + Math.random() * 0.5;
    const dist = 90 + Math.random() * 150;
    return {
      id: i,
      x: Math.cos(angle) * dist,
      y: Math.sin(angle) * dist - 40,
      rotate: (Math.random() - 0.5) * 240,
      scale: 0.7 + Math.random() * 1.1,
      color: ["#F25C88", "#FF9DBB", "#C9B1F0", "#FFD3E2"][i % 4],
      size: 12 + Math.random() * 14,
    };
  });
}

/**
 * FINAL SURPRISE 💥 — nền tối lãng mạn, dòng chữ phát sáng,
 * nút nhấn bung trái tim + mở modal lời yêu thương.
 */
export default function FinalSurprise({ couple: c }) {
  const f = c.final;
  const [modal, setModal] = useState(false);
  const [burst, setBurst] = useState([]);
  const timer = useRef(null);

  const trigger = useCallback(() => {
    setModal(true);
    setBurst(makeBurst());
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setBurst([]), 1800);
  }, []);

  return (
    <section id="surprise" className="night-bg relative overflow-hidden px-5 py-24 text-center md:py-36">
      {/* Sao lấp lánh */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {Array.from({ length: 14 }).map((_, i) => (
          <span
            key={i}
            className="fx-sparkle"
            style={{
              left: `${(i * 71 + 5) % 100}%`,
              top: `${(i * 43 + 8) % 92}%`,
              width: 4 + (i % 3) * 3,
              height: 4 + (i % 3) * 3,
              "--dur": `${2.6 + (i % 4)}s`,
              animationDelay: `${-i * 0.8}s`,
            }}
          />
        ))}
      </div>

      <motion.p
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.8 }}
        className="font-display text-lg italic text-white/75 sm:text-xl"
      >
        {f.intro}
      </motion.p>

      <motion.h2
        initial={{ opacity: 0, scale: 0.8 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.9, delay: 0.25, ease: [0.34, 1.56, 0.64, 1] }}
        className="relative mx-auto mt-5 max-w-2xl font-script text-6xl leading-tight text-white sm:text-7xl md:text-8xl"
        style={{ textShadow: "0 0 28px rgba(242,92,136,.85), 0 0 70px rgba(201,177,240,.5)" }}
      >
        {f.reveal}
      </motion.h2>

      {/* Vùng nút + hạt bung */}
      <div className="relative mt-12 inline-block">
        {/* Hạt trái tim bung */}
        <div aria-hidden className="pointer-events-none absolute inset-0 grid place-items-center">
          {burst.map((p) => (
            <motion.span
              key={`${p.id}-${burst.length}`}
              initial={{ x: 0, y: 0, scale: 0, opacity: 1, rotate: 0 }}
              animate={{ x: p.x, y: p.y, scale: [0, p.scale, 0.5], opacity: [1, 1, 0], rotate: p.rotate }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="absolute"
            >
              <Heart size={p.size} strokeWidth={0} fill={p.color} />
            </motion.span>
          ))}
        </div>

        <motion.button
          {...{
            initial: { opacity: 0, y: 20 },
            whileInView: { opacity: 1, y: 0 },
            viewport: { once: true },
            transition: { delay: 0.5, duration: 0.7 },
          }}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.93 }}
          onClick={trigger}
          className="btn-primary animate-pulse-soft bg-gradient-to-r from-candy via-berry to-lilac"
        >
          <Heart size={18} strokeWidth={0} fill="currentColor" />
          {f.button}
        </motion.button>
      </div>

      {/* ── MODAL lời yêu thương ── */}
      <AnimatePresence>
        {modal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setModal(false)}
            className="fixed inset-0 z-[95] grid place-items-center bg-night/85 p-5 backdrop-blur-lg"
          >
            <motion.div
              initial={{ scale: 0.7, y: 40, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.85, y: 20, opacity: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-sm rounded-[2rem] border border-white/15 bg-gradient-to-b from-plum/90 to-night/95 p-9 text-center shadow-2xl"
            >
              <button
                onClick={() => setModal(false)}
                aria-label="Đóng"
                className="absolute right-4 top-4 rounded-full p-2 text-white/60 transition-colors hover:text-white"
              >
                <X size={18} />
              </button>

              <Heart
                size={54}
                strokeWidth={0}
                fill="currentColor"
                className="animate-beat mx-auto text-berry drop-shadow-[0_0_22px_rgba(242,92,136,.9)]"
              />

              <p className="mt-6 font-display text-lg italic text-white/80">{f.modalTitle}</p>
              <p
                className="mt-3 font-script text-4xl leading-snug text-white"
                style={{ textShadow: "0 0 24px rgba(242,92,136,.8)" }}
              >
                {f.modalMessage}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
