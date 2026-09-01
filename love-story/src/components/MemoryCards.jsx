import { motion } from "framer-motion";
import { Smile, Heart, Sparkles, Sun, Flower2, Star } from "lucide-react";
import SectionTitle from "./SectionTitle";
import { popIn } from "../utils/motion";

/** Map tên icon trong config (string) → component lucide-react */
const ICON_MAP = {
  smile: Smile,
  heart: Heart,
  sparkles: Sparkles,
  sun: Sun,
  flower: Flower2,
  star: Star,
};

/**
 * MEMORY CARDS — "Những điều anh yêu ở em".
 * Thẻ viền gradient, number script font, icon góc, stagger khi cuộn.
 */
export default function MemoryCards({ couple: c }) {
  const memories = c.memories ?? [];

  return (
    <section id="memories" className="scroll-mt-10 px-5 py-20 md:py-28">
      <SectionTitle kicker="Yêu em" title="Những điều anh yêu ở em ❤️" />

      <div className="mx-auto grid max-w-4xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 md:gap-5">
        {memories.map((m, i) => {
          const Icon = ICON_MAP[m.icon] ?? Heart;
          return (
            <motion.div
              key={i}
              {...popIn(i * 0.09)}
              whileHover={{ y: -8, rotate: i % 2 === 0 ? -1 : 1 }}
              className="rounded-[1.75rem] bg-gradient-to-br from-candy/70 via-blush to-lilac/70 p-[2px] shadow-card transition-shadow hover:shadow-soft"
            >
              <div className="relative h-full rounded-[calc(1.75rem-2px)] bg-white/90 p-6 backdrop-blur">
                {/* Số thứ tự */}
                <span className="font-script text-5xl text-berry/70">{i + 1}</span>

                {/* Icon góc phải */}
                <span className="absolute right-5 top-5 grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-petal to-lav text-wine">
                  <Icon size={18} strokeWidth={1.8} />
                </span>

                <h3 className="mt-3 font-display text-lg font-bold text-cocoa sm:text-xl">
                  {m.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-cocoa/65">{m.description}</p>

                {/* Tim bé dưới card */}
                <Heart
                  size={13}
                  strokeWidth={0}
                  fill="currentColor"
                  className="mt-4 text-blush"
                />
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
