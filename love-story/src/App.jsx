import { useEffect, useMemo } from "react";
import { MotionConfig, motion, useScroll, useSpring } from "framer-motion";
import { getPairBySlug } from "./data/couples/index.js";
import BackgroundEffects from "./components/BackgroundEffects";
import MusicPlayer from "./components/MusicPlayer";
import Hero from "./components/Hero";
import LoveCounter from "./components/LoveCounter";
import LoveStory from "./components/LoveStory";
import PhotoGallery from "./components/PhotoGallery";
import LoveLetter from "./components/LoveLetter";
import MemoryCards from "./components/MemoryCards";
import FinalSurprise from "./components/FinalSurprise";
import QRSection from "./components/QRSection";

/**
 * APP — lấy cặp đôi theo slug trên URL:
 *   /              → demo (minh-ngoc)
 *   /minh-ngoc     → demo
 *   /khach-khac    → cặp đôi đăng ký trong src/data/couples/index.js
 * UI chỉ nhận object `couple` nên sau này đổi sang API/database không
 * phải viết lại giao diện.
 */
export default function App() {
  const couple = useMemo(() => {
    const slug = window.location.pathname.replace(/^\/+|\/+$/g, "").split("/")[0];
    return getPairBySlug(slug).config;
  }, []);

  /* SEO động theo từng cặp đôi */
  useEffect(() => {
    const title = `${couple.name1} ❤️ ${couple.name2} — Câu chuyện tình yêu`;
    document.title = title;
    const setMeta = (selector, attr, content) => {
      const el = document.querySelector(selector);
      if (el) el.setAttribute(attr, content);
    };
    setMeta('meta[name="description"]', "content", couple.message);
    setMeta('meta[property="og:title"]', "content", title);
    setMeta('meta[property="og:description"]', "content", couple.message);
  }, [couple]);

  return (
    <MotionConfig reducedMotion="user">
      {/* Hiệu ứng nền toàn trang */}
      <BackgroundEffects />

      {/* Thanh tiến trình cuộn */}
      <ScrollProgress />

      {/* Nút nhạc nền */}
      <MusicPlayer url={couple.musicUrl} />

      <main className="relative z-10">
        <Hero couple={couple} />
        <LoveCounter couple={couple} />
        <LoveStory couple={couple} />
        <PhotoGallery couple={couple} />
        <LoveLetter couple={couple} />
        <MemoryCards couple={couple} />
        <FinalSurprise couple={couple} />
        <QRSection couple={couple} />
      </main>
    </MotionConfig>
  );
}

/* Thanh gradient mỏng phản ánh tiến độ cuộn trang */
function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 26, mass: 0.4 });
  return (
    <motion.div
      style={{ scaleX }}
      className="fixed inset-x-0 top-0 z-[85] h-1 origin-left bg-gradient-to-r from-candy via-berry to-lilac"
    />
  );
}
