import { useEffect, useRef, useState } from "react";
import { Disc3, Music } from "lucide-react";

/**
 * MUSIC PLAYER 🎵 — nút tròn cố định góc phải dưới.
 *  · KHÔNG tự phát khi mở trang (tránh bị trình duyệt chặn).
 *  · Đang phát: đĩa xoay + nền gradient. Lỗi file (404): tự ẩn nút.
 */
export default function MusicPlayer({ url }) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [broken, setBroken] = useState(false);

  /* File nhạc lỗi → ẩn nút để không làm khách bối rối */
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onError = () => setBroken(true);
    el.addEventListener("error", onError);
    return () => el.removeEventListener("error", onError);
  }, [url]);

  if (broken) return <audio ref={audioRef} src={url} preload="none" />;

  const toggle = () => {
    const el = audioRef.current;
    if (!el) return;
    if (playing) {
      el.pause();
      setPlaying(false);
    } else {
      el.play()
        .then(() => setPlaying(true))
        .catch(() => setPlaying(false)); // autoplay policy — im lặng
    }
  };

  return (
    <>
      <button
        onClick={toggle}
        aria-label={playing ? "Tắt nhạc" : "Bật nhạc"}
        title={playing ? "Tắt nhạc" : "Bật nhạc"}
        className={`fixed bottom-5 right-5 z-[80] grid h-12 w-12 place-items-center rounded-full shadow-soft transition-all duration-300 active:scale-90 sm:h-14 sm:w-14 ${
          playing
            ? "bg-gradient-to-br from-berry to-lilac text-white shadow-glow"
            : "glass text-wine hover:scale-110"
        }`}
      >
        {playing ? (
          <Disc3 size={24} className="animate-spin-slower" />
        ) : (
          <Music size={22} strokeWidth={2} />
        )}
      </button>

      <audio ref={audioRef} src={url} loop preload="metadata" onEnded={() => setPlaying(false)} />
    </>
  );
}
