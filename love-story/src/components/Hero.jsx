import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Heart, ChevronDown } from "lucide-react";
import { formatDots } from "../utils/date";

/**
 * HERO — màn hình đầu tiên, thiết kế để quay TikTok:
 * tên hai người chữ script gradient, trái tim đập, parallax khi cuộn.
 */
export default function Hero({ couple: c }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [0, 110]);
  const opacity = useTransform(scrollYProgress, [0, 0.75], [1, 0]);

  const scrollToStory = () =>
    document.getElementById("counter")?.scrollIntoView({ behavior: "smooth" });

  return (
    <section
      ref={ref}
      id="top"
      className="hero-bg relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden px-5 py-16 text-center"
    >
      {/* Trái tim lớn trôi lơ lửng quanh tên */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {Array.from({ length: 6 }).map((_, i) => (
          <span
            key={i}
            className="absolute animate-bob"
            style={{
              left: `${6 + i * 17}%`,
              top: `${10 + (i % 3) * 28}%`,
              animationDelay: `${i * 0.7}s`,
              animationDuration: `${5 + (i % 3)}s`,
            }}
          >
            <Heart
              size={18 + (i % 3) * 12}
              strokeWidth={0}
              fill="currentColor"
              className={["text-candy/50", "text-lilac/50", "text-berry/40"][i % 3]}
            />
          </span>
        ))}
      </div>

      <motion.div style={{ y, opacity }} className="relative z-10 flex flex-col items-center">
        {/* Chip lời nhắn */}
        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="glass rounded-full px-5 py-2 text-xs font-medium text-cocoa/80 shadow-soft sm:text-sm"
        >
          {c.message}
        </motion.p>

        {/* TÊN HAI NGƯỜI */}
        <motion.h1
          initial={{ opacity: 0, scale: 0.88 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.35, ease: "easeOut" }}
          className="mt-7 bg-gradient-to-r from-wine via-berry to-lilac bg-clip-text font-script text-6xl leading-[1.15] text-transparent drop-shadow-[0_4px_18px_rgba(242,92,136,0.35)] sm:text-7xl md:text-8xl"
        >
          {c.name1}{" "}
          <Heart
            className="animate-beat mx-1 inline-block h-9 w-9 align-[-0.12em] text-berry drop-shadow-[0_2px_10px_rgba(242,92,136,0.6)] sm:h-12 sm:w-12"
            fill="currentColor"
            strokeWidth={0}
          />{" "}
          {c.name2}
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.55 }}
          className="mt-5 font-display text-xl italic text-cocoa/75 sm:text-2xl"
        >
          {c.heroSubtitle}
        </motion.p>

        {/* Ngày bắt đầu */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.72 }}
          className="mt-6 inline-flex items-center gap-2.5 rounded-full border border-white/80 bg-white/70 px-5 py-2.5 text-sm font-bold tracking-[0.25em] text-wine shadow-soft backdrop-blur"
        >
          <Heart size={13} strokeWidth={0} fill="currentColor" />
          {formatDots(c.startDate)}
          <Heart size={13} strokeWidth={0} fill="currentColor" />
        </motion.div>

        {/* Nút khám phá */}
        <motion.button
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.92 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.94 }}
          onClick={scrollToStory}
          className="btn-primary group mt-11 animate-pulse-soft"
        >
          Khám phá câu chuyện của chúng ta
          <Heart size={17} strokeWidth={0} fill="currentColor" className="transition-transform group-hover:scale-125" />
        </motion.button>
      </motion.div>

      {/* Chỉ báo cuộn */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4, duration: 0.8 }}
        onClick={scrollToStory}
        aria-label="Cuộn xuống"
        className="glass absolute bottom-7 left-1/2 z-10 -translate-x-1/2 rounded-full p-3 text-berry shadow-soft"
      >
        <motion.span
          animate={{ y: [0, 5, 0] }}
          transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
          className="block"
        >
          <ChevronDown size={20} />
        </motion.span>
      </motion.button>
    </section>
  );
}
