import { useEffect } from "react";
import { MotionConfig, motion, useScroll, useSpring } from "framer-motion";
import BackgroundEffects from "../components/BackgroundEffects.jsx";
import MusicPlayer from "../components/MusicPlayer.jsx";
import Hero from "../components/Hero.jsx";
import LoveCounter from "../components/LoveCounter.jsx";
import LoveStory from "../components/LoveStory.jsx";
import PhotoGallery from "../components/PhotoGallery.jsx";
import LoveLetter from "../components/LoveLetter.jsx";
import MemoryCards from "../components/MemoryCards.jsx";
import FinalSurprise from "../components/FinalSurprise.jsx";
import QRSection from "../components/QRSection.jsx";

/**
 * ════════════════════════════════════════════════════════════════
 *  💌  TEMPLATE "SWEET LOVE" (150.000đ) — CoupleTemplate150
 * ════════════════════════════════════════════════════════════════
 *
 *  Component template độc lập: nhận `data` (coupleData) qua props,
 *  KHÔNG tự biết dữ liệu là Minh hay Ngọc hay ai cả.
 *
 *      <CoupleTemplate150 data={coupleData} />
 *
 *  Được dùng ở 3 nơi với CÙNG một giao diện:
 *    · /demo , /minh-ngoc        → demo mặc định
 *    /preview/:slug              → xem trước website khách (có toolbar)
 *    /:slug (sau này)            → website vĩnh viễn của từng cặp
 *
 *  ⚠️ KHÔNG sửa design/animation/layout trong file này — chỉ nhận data.
 */
export default function CoupleTemplate150({ data }) {
  /* SEO động theo từng cặp đôi */
  useEffect(() => {
    const title = `${data.name1} ❤️ ${data.name2} — Câu chuyện tình yêu`;
    document.title = title;
    const setMeta = (selector, attr, content) => {
      if (!content) return;
      document.querySelector(selector)?.setAttribute(attr, content);
    };
    setMeta('meta[name="description"]', "content", data.message);
    setMeta('meta[property="og:title"]', "content", title);
    setMeta('meta[property="og:description"]', "content", data.message);
    setMeta(
      'meta[property="og:image"]',
      "content",
      data.coverImage ? new URL(data.coverImage, window.location.origin).href : ""
    );
  }, [data]);

  return (
    <MotionConfig reducedMotion="user">
      {/* Hiệu ứng nền toàn trang */}
      <BackgroundEffects />

      {/* Thanh tiến trình cuộn */}
      <ScrollProgress />

      {/* Nút nhạc nền — chỉ hiện khi cặp đôi có nhạc */}
      {data.musicUrl ? <MusicPlayer url={data.musicUrl} /> : null}

      <main className="relative z-10">
        <Hero couple={data} />
        <LoveCounter couple={data} />
        <LoveStory couple={data} />
        <PhotoGallery couple={data} />
        <LoveLetter couple={data} />
        <MemoryCards couple={data} />
        <FinalSurprise couple={data} />
        <QRSection couple={data} />
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