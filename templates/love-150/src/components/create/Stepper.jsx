/**
 * STEPPER — thanh tiến trình nhẹ: 1.Thông tin · 2.Ảnh · 3.Câu chuyện · 4.Xem trước.
 * Tự highlight section đang xem (IntersectionObserver), click để cuộn tới.
 */
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

const STEPS = [
  { id: "step-info", label: "Thông tin" },
  { id: "step-photos", label: "Ảnh" },
  { id: "step-story", label: "Câu chuyện" },
  { id: "step-preview", label: "Xem trước" },
];

export default function Stepper() {
  const [active, setActive] = useState(0);
  const clicking = useRef(false);

  useEffect(() => {
    const sections = STEPS.map((s) => document.getElementById(s.id)).filter(Boolean);
    if (!sections.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (clicking.current) return;
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const idx = STEPS.findIndex((s) => s.id === e.target.id);
            if (idx >= 0) setActive(idx);
          }
        });
      },
      { rootMargin: "-40% 0px -55% 0px" }
    );
    sections.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const go = (i) => {
    setActive(i);
    clicking.current = true;
    document.getElementById(STEPS[i].id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setTimeout(() => (clicking.current = false), 900);
  };

  return (
    <nav aria-label="Các bước tạo website" className="flex justify-center">
      <ol className="no-scrollbar flex max-w-full items-center gap-1.5 overflow-x-auto rounded-full border border-white/70 bg-white/60 p-1.5 shadow-soft backdrop-blur-xl sm:gap-2">
        {STEPS.map((s, i) => {
          const isActive = i === active;
          return (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => go(i)}
                className={`relative flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-2 text-xs font-semibold transition-colors sm:px-4 sm:text-[13px] ${
                  isActive ? "text-white" : "text-cocoa/60 hover:text-wine"
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="stepper-active"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    className="absolute inset-0 rounded-full bg-gradient-to-r from-berry to-lilac shadow-glow"
                  />
                )}
                <span className="relative z-10">{i + 1}</span>
                <span className="relative z-10">{s.label}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}