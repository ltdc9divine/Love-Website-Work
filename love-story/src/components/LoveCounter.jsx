import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import SectionTitle from "./SectionTitle";
import useLoveCounter from "../hooks/useLoveCounter";
import { fadeUp } from "../utils/motion";
import { formatLongVI, pad2 } from "../utils/date";

/**
 * LOVE COUNTER — đếm thời gian bên nhau realtime (Ngày · Giờ · Phút · Giây).
 * Card kính pastel, số giây nhún nhẹ mỗi lần đổi giá trị.
 */
export default function LoveCounter({ couple: c }) {
  const { days, hours, minutes, seconds } = useLoveCounter(c.startDate);

  const units = [
    { value: days, label: "Ngày" },
    { value: hours, label: "Giờ" },
    { value: minutes, label: "Phút" },
    { value: seconds, label: "Giây" },
  ];

  return (
    <section id="counter" className="relative scroll-mt-10 px-5 py-20 md:py-28">
      <SectionTitle kicker="Love Counter" title="Chúng ta đã bên nhau..." />

      <div className="mx-auto grid max-w-3xl grid-cols-2 gap-3.5 sm:grid-cols-4 sm:gap-5">
        {units.map((u, i) => (
          <motion.div
            key={u.label}
            {...fadeUp(i * 0.1)}
            className="glass relative overflow-hidden rounded-3xl py-7 text-center shadow-card sm:py-9"
          >
            {/* Vệt sáng trang trí góc */}
            <span className="absolute -right-6 -top-6 h-16 w-16 rounded-full bg-gradient-to-br from-candy/40 to-lilac/40 blur-xl" />

            {/* Số — pop nhẹ khi thay đổi */}
            <motion.div
              key={u.value}
              initial={{ scale: 1.15 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 380, damping: 22 }}
              className="font-display text-4xl font-extrabold tabular-nums text-wine sm:text-5xl"
            >
              {pad2(u.value)}
            </motion.div>
            <div className="mt-2 text-[11px] font-bold uppercase tracking-[0.22em] text-cocoa/55 sm:text-xs">
              {u.label}
            </div>
          </motion.div>
        ))}
      </div>

      <motion.p {...fadeUp(0.45)} className="mx-auto mt-9 flex max-w-md flex-wrap items-center justify-center gap-2 text-center text-sm text-cocoa/70 sm:text-base">
        <span>
          Kể từ <span className="font-bold text-wine">{formatLongVI(c.startDate)}</span>
        </span>
        <span className="hidden sm:inline">·</span>
        <span className="font-display italic">mãi mãi bên nhau</span>
        <Heart size={15} strokeWidth={0} fill="currentColor" className="animate-beat text-berry" />
      </motion.p>
    </section>
  );
}
