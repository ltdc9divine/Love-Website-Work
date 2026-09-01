import { motion } from "framer-motion";
import { fadeUp } from "../utils/motion";

/**
 * Tiêu đề section dùng chung: kicker nhỏ + tiêu đề serif + gạch gradient.
 * `light` = true khi đặt trên nền tối (FinalSurprise).
 */
export default function SectionTitle({ kicker, title, light = false }) {
  return (
    <motion.div {...fadeUp()} className="mb-10 px-4 text-center md:mb-14">
      {kicker && (
        <p
          className={`text-[11px] font-bold uppercase tracking-[0.3em] sm:text-xs ${
            light ? "text-candy" : "text-berry"
          }`}
        >
          {kicker}
        </p>
      )}
      <h2
        className={`mt-3 font-display text-3xl font-bold leading-tight sm:text-4xl md:text-5xl ${
          light ? "text-white" : "text-cocoa"
        }`}
      >
        {title}
      </h2>
      <div className="mx-auto mt-5 h-1 w-16 rounded-full bg-gradient-to-r from-candy via-berry to-lilac" />
    </motion.div>
  );
}

