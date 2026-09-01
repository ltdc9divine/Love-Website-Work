import { useMemo } from "react";
import { Heart } from "lucide-react";

/**
 * Hiệu ứng nền toàn trang — CHỈ dùng CSS animation (nhẹ, mượt):
 *   · 12 trái tim bay lên chậm
 *   · 10 sparkle lấp lánh
 *   · 3 blob gradient khổng lồ trôi
 * Tổng ~25 phần tử DOM, không dùng canvas/thư viện nặng.
 * Tự ẩn khi người dùng bật "prefers-reduced-motion" (xem index.css).
 */
export default function BackgroundEffects() {
  const hearts = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        id: i,
        left: (i * 83 + 7) % 100, // chia đều nhưng lệch nhau
        size: 12 + ((i * 7) % 18),
        dur: 12 + ((i * 2.3) % 10),
        delay: -((i * 3.1) % 16),
        opacity: 0.35 + ((i * 13) % 40) / 100,
        color: ["text-candy", "text-blush", "text-lilac", "text-berry"][i % 4],
      })),
    []
  );

  const sparkles = useMemo(
    () =>
      Array.from({ length: 10 }, (_, i) => ({
        id: i,
        left: (i * 37 + 11) % 100,
        top: (i * 53 + 9) % 88,
        size: 5 + ((i * 3) % 6),
        dur: 2.4 + ((i * 0.7) % 2.4),
        delay: -(i * 0.9),
      })),
    []
  );

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {/* Blob gradient */}
      <div
        className="fx-blob bg-petal/90"
        style={{ width: "56vw", height: "56vw", top: "-14vw", left: "-12vw", "--dur": "22s", "--dx": "6vw", "--dy": "8vh" }}
      />
      <div
        className="fx-blob bg-lav/80"
        style={{ width: "50vw", height: "50vw", bottom: "-10vw", right: "-14vw", "--dur": "26s", "--dx": "-7vw", "--dy": "-6vh" }}
      />
      <div
        className="fx-blob bg-blush/70"
        style={{ width: "38vw", height: "38vw", top: "38%", left: "55%", "--dur": "19s", "--dx": "-9vw", "--dy": "7vh" }}
      />

      {/* Sparkle */}
      {sparkles.map((s) => (
        <span
          key={s.id}
          className="fx-sparkle"
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: s.size,
            height: s.size,
            "--dur": `${s.dur}s`,
            animationDelay: `${s.delay}s`,
          }}
        />
      ))}

      {/* Trái tim bay lên */}
      {hearts.map((h) => (
        <span
          key={h.id}
          className="fx-heart"
          style={{
            left: `${h.left}%`,
            "--dur": `${h.dur}s`,
            "--peak": h.opacity,
            animationDelay: `${h.delay}s`,
          }}
        >
          <span className="sway" style={{ "--sway-dur": `${2.4 + (h.id % 4) * 0.5}s` }}>
            <Heart size={h.size} strokeWidth={0} fill="currentColor" className={h.color} />
          </span>
        </span>
      ))}
    </div>
  );
}
