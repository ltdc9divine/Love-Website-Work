import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, MailOpen, Undo2 } from "lucide-react";
import SectionTitle from "./SectionTitle";

/**
 * LOVE LETTER 💌 — phong bì thư có animation mở:
 *   closed → (flap lật + dấu niêm phong tan) → thư trồi lên → thư mở toàn phần.
 * Nội dung lấy từ couple.loveLetter (content xuống dòng bằng \n).
 */
export default function LoveLetter({ couple: c }) {
  const [stage, setStage] = useState("closed"); // closed | opening | open
  const letter = c.loveLetter;

  /* opening → open sau khi flap lật xong */
  useEffect(() => {
    if (stage !== "opening") return;
    const t = setTimeout(() => setStage("open"), 1000);
    return () => clearTimeout(t);
  }, [stage]);

  const isOpen = stage === "open";

  return (
    <section id="letter" className="scroll-mt-10 px-5 py-20 md:py-28">
      <SectionTitle kicker="Một lá thư nhỏ" title={letter.title} />

      {/* ── Phong bì ── */}
      <div className="mx-auto w-[290px] sm:w-[330px]" style={{ perspective: "1000px" }}>
        <div className="relative aspect-[10/7]">
          {/* Hạ tầng phong bì */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blush via-candy to-berry shadow-soft" />

          {/* Lá thư nhô ra khi mở */}
          <motion.div
            animate={isOpen ? { y: -86, scale: 1.02 } : { y: 0, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 160, damping: 18, delay: isOpen ? 0.55 : 0 }}
            className="absolute inset-x-4 top-3 bottom-4 z-10 rounded-lg bg-white shadow-md"
          >
            <div className="flex h-full flex-col items-center justify-center gap-1.5 px-8">
              <span className="font-script text-2xl text-wine">{c.name2} à...</span>
              {[90, 72, 80, 55].map((w, i) => (
                <span key={i} className="h-1.5 rounded-full bg-petal" style={{ width: `${w}%` }} />
              ))}
            </div>
          </motion.div>

          {/* Mặt trước phong bì (che nửa dưới lá thư) */}
          <div
            className="absolute inset-0 z-20 rounded-2xl bg-gradient-to-br from-candy to-berry shadow-card"
            style={{ clipPath: "polygon(0 18%, 50% 55%, 100% 18%, 100% 100%, 0 100%)" }}
          />

          {/* Nắp phong bì — lật lên khi mở */}
          <motion.div
            animate={stage === "closed" ? { rotateX: 0 } : { rotateX: -180 }}
            transition={{ duration: 0.8, ease: [0.65, 0, 0.35, 1] }}
            style={{ transformOrigin: "top", transformStyle: "preserve-3d" }}
            className={`absolute inset-x-0 top-0 h-[58%] bg-gradient-to-b from-berry to-candy ${
              isOpen ? "z-0" : "z-30"
            }`}
          >
            <div
              className="h-full w-full bg-gradient-to-b from-berry to-candy"
              style={{ clipPath: "polygon(0 0, 100% 0, 50% 100%)" }}
            />
          </motion.div>

          {/* Dấu niêm phong trái tim */}
          <motion.div
            animate={stage === "closed" ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
            transition={{ duration: 0.45, delay: stage === "closed" ? 0.9 : 0.1 }}
            className="absolute left-1/2 top-[54%] z-40 grid h-12 w-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-wine text-white shadow-glow"
          >
            <Heart size={20} strokeWidth={0} fill="currentColor" className="animate-beat" />
          </motion.div>
        </div>
      </div>
      <LetterActions stage={stage} letter={letter} setStage={setStage} />
      <LetterBody isOpen={isOpen} letter={letter} />
    </section>
  );

/* ── Nút mở thư / gấp lại ── */
function LetterActions({ stage, letter, setStage }) {
  const isOpen = stage === "open";
  return (
    <div className="mt-8 text-center">
      {!isOpen ? (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.94 }}
          onClick={() => setStage("opening")}
          className="btn-primary animate-pulse-soft"
        >
          <MailOpen size={18} /> {letter.button}
        </motion.button>
      ) : (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.6 }}
          onClick={() => setStage("closed")}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-cocoa/50 transition-colors hover:text-wine"
        >
          <Undo2 size={14} /> Gấp thư lại
        </motion.button>
      )}
    </div>
  );
}

/* ── Lá thư mở toàn phần, chữ hiện dần từng dòng ── */
function LetterBody({ isOpen, letter }) {
  const lines = (letter.content ?? "").split("\n");

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 70, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.96 }}
          transition={{ type: "spring", stiffness: 120, damping: 20, delay: 0.35 }}
          className="paper-lines mx-auto mt-9 max-w-xl rounded-[2rem] border border-white/80 bg-white/85 p-7 shadow-soft backdrop-blur-xl sm:p-11"
        >
          {lines.map((line, i) => {
            /* Dòng đầu: tên gọi — chữ script lớn */
            if (i === 0)
              return (
                <motion.p
                  key={i}
                  initial={{ opacity: 0, x: -14 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.9 + i * 0.22 }}
                  className="mb-5 font-script text-4xl text-wine"
                >
                  {line}
                </motion.p>
              );
            /* Dòng trống → khoảng cách */
            if (line.trim() === "") return <div key={i} className="h-3" />;
            /* Dòng chữ thường */
            return (
              <motion.p
                key={i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 + i * 0.22, duration: 0.5 }}
                className="font-display text-[17px] leading-relaxed text-cocoa sm:text-lg"
              >
                {line}
              </motion.p>
            );
          })}

          {/* Chữ ký */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 + lines.length * 0.18 }}
            className="mt-8 text-right"
          >
            <p className="text-sm italic text-cocoa/60">{letter.signature}</p>
            <p className="font-script text-3xl text-berry">{letter.signatureName}</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

}
