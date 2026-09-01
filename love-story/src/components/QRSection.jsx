import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { QrCode, Download, Heart } from "lucide-react";
import { fadeUp } from "../utils/motion";

/**
 * QR CODE — card cuối trang: tạo mã QR của URL hiện tại + tải PNG.
 * Thư viện: qrcode.react (nhẹ, không cần network).
 */
export default function QRSection({ couple: c }) {
  const qr = c.qr;
  const [show, setShow] = useState(false);
  const wrapRef = useRef(null);

  const url = typeof window !== "undefined" ? window.location.href : "";

  /** QR SVG → canvas → PNG tải về máy */
  const downloadPng = () => {
    const svg = wrapRef.current?.querySelector("svg");
    if (!svg) return;
    const data = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    img.onload = () => {
      const size = 512;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(img, 40, 40, size - 80, size - 80);
      canvas.toBlob((blob) => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `${c.slug || "love-story"}-qr.png`;
        a.click();
        URL.revokeObjectURL(a.href);
      }, "image/png");
    };
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(data);
  };

  return (
    <section id="qr" className="px-5 pb-10 pt-16 md:pt-24">
      <motion.div
        {...fadeUp()}
        className="glass mx-auto max-w-md rounded-[2rem] p-8 text-center shadow-soft"
      >
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-berry to-lilac text-white shadow-glow">
          <QrCode size={26} />
        </div>

        <h3 className="mt-5 font-display text-2xl font-bold text-cocoa">{qr.title}</h3>
        <p className="mt-2 text-sm text-cocoa/60">{qr.subtitle}</p>

        <AnimatePresence mode="wait">
          {!show ? (
            <motion.button
              key="btn-create"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              whileTap={{ scale: 0.94 }}
              onClick={() => setShow(true)}
              className="btn-primary mt-7"
            >
              <QrCode size={17} /> {qr.button}
            </motion.button>
          ) : (
            <motion.div
              key="qr-result"
              initial={{ opacity: 0, scale: 0.6, rotate: -6 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 220, damping: 18 }}
              className="mt-7"
            >
              <div
                ref={wrapRef}
                className="mx-auto inline-block rounded-2xl bg-white p-4 shadow-card"
              >
                <QRCodeSVG value={url} size={176} fgColor="#59304A" bgColor="#FFFFFF" level="M" />
              </div>

              <button
                onClick={downloadPng}
                className="btn-primary mt-5 w-full"
              >
                <Download size={17} /> {qr.download}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="mt-6 flex items-center justify-center gap-1.5 text-xs text-cocoa/45">
          Quét mã để mở lại trang này bất cứ lúc nào
          <Heart size={11} strokeWidth={0} fill="currentColor" className="text-berry" />
        </p>
      </motion.div>

      {/* Footer nhỏ */}
      <p className="mt-12 text-center text-xs text-cocoa/40">
        Được tạo với <span className="text-berry">❤</span> — món quà dành riêng cho {c.name1} &amp; {c.name2}
      </p>
    </section>
  );
}
