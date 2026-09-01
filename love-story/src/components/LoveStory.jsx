import { motion } from "framer-motion";
import { Heart, Sparkles, Camera, Gift, Plane, Star } from "lucide-react";
import SectionTitle from "./SectionTitle";
import { fadeUp } from "../utils/motion";

const ICONS = [Heart, Camera, Plane, Sparkles, Gift, Star];

/**
 * LOVE STORY — timeline dọc: mobile chạy bên trái, desktop so le hai bên.
 * Dữ liệu từ `couple.timeline` (date, title, description, image).
 */
export default function LoveStory({ couple: c }) {
  const items = c.timeline ?? [];

  return (
    <section id="story" className="relative mx-auto max-w-5xl scroll-mt-10 px-5 py-20 md:py-28">
      <SectionTitle kicker="Our Story" title="Chuyện của chúng mình 💕" />

      <div className="relative">
        {/* Đường timeline */}
        <div className="absolute bottom-4 left-[27px] top-2 w-[3px] -translate-x-1/2 rounded-full bg-gradient-to-b from-candy via-lilac to-transparent md:left-1/2" />

        {items.map((item, i) => {
          const Icon = ICONS[i % ICONS.length];
          const toRight = i % 2 === 1; // so le desktop

          return (
            <div
              key={i}
              className={`relative mb-11 flex items-center last:mb-0 md:mb-16 ${
                toRight ? "md:flex-row-reverse" : "md:flex-row"
              }`}
            >
              {/* Nút tròn trên timeline */}
              <motion.div
                {...fadeUp(0)}
                className="glass absolute left-[27px] top-5 z-10 grid h-14 w-14 -translate-x-1/2 place-items-center rounded-full text-berry shadow-soft md:left-1/2 md:top-1/2 md:-translate-y-1/2"
              >
                <Icon size={22} strokeWidth={1.8} />
              </motion.div>

              {/* Card kỷ niệm */}
              <motion.article
                {...fadeUp(0.08)}
                className="ml-[68px] w-full overflow-hidden rounded-3xl bg-white/70 shadow-card backdrop-blur-xl transition-shadow hover:shadow-soft md:ml-0 md:w-[calc(50%-3.25rem)]"
              >
                <div className="group overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.title}
                    loading="lazy"
                    className="h-44 w-full object-cover transition-transform duration-700 group-hover:scale-105 sm:h-52"
                  />
                </div>
                <div className="p-5 sm:p-6">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-berry to-lilac px-3.5 py-1.5 text-[11px] font-bold tracking-wider text-white">
                    <Heart size={11} strokeWidth={0} fill="currentColor" />
                    {item.date}
                  </span>
                  <h3 className="mt-3.5 font-display text-xl font-bold text-cocoa sm:text-2xl">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-cocoa/70">{item.description}</p>
                </div>
              </motion.article>
            </div>
          );
        })}
      </div>
    </section>
  );
}
