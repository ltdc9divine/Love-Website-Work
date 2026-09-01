/**
 * PHOTO UPLOADER — ảnh bìa (1) + ảnh kỷ niệm (tối đa 20).
 * Ảnh được nén bằng canvas (utils/image.js) rồi lưu dạng data URL,
 * nên preview + localStorage hoạt động mà chưa cần server.
 */
import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ImagePlus, Loader2, X } from "lucide-react";
import { readImageFile } from "../../utils/image.js";

const MAX_PHOTOS = 20;

export default function PhotoUploader({ coverImage, onCoverChange, photos, onPhotosChange }) {
  const coverRef = useRef(null);
  const galleryRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState("");

  /* Đọc & nén lần lượt từng file → data URL */
  const handleFiles = async (files, mode) => {
    const list = Array.from(files || []);
    if (!list.length) return;
    setWarn("");
    setBusy(true);
    try {
      const results = [];
      for (const f of list) {
        try {
          results.push(await readImageFile(f));
        } catch {
          setWarn("Có ảnh không đọc được — bạn thử ảnh JPG/PNG nhé ❤️");
        }
      }
      if (mode === "cover") {
        if (results[0]) onCoverChange(results[0]);
      } else if (results.length) {
        const remain = MAX_PHOTOS - photos.length;
        if (remain <= 0) {
          setWarn(`Tối đa ${MAX_PHOTOS} ảnh để website luôn tải nhanh nhé ❤️`);
        } else {
          if (results.length > remain)
            setWarn(`Chỉ thêm được ${remain} ảnh (giới hạn ${MAX_PHOTOS} ảnh) ❤️`);
          onPhotosChange([...photos, ...results.slice(0, remain)]);
        }
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── ẢNH BÌA ── */}
      <div>
        <p className="mb-2 text-sm font-semibold text-cocoa/80">
          Ảnh bìa <span className="font-normal text-cocoa/45">(dùng làm ảnh đại diện khi chia sẻ link)</span>
        </p>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => coverRef.current?.click()}
            className={`grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-2xl border-2 border-dashed border-candy/60 bg-petal/40 text-candy transition hover:scale-105 hover:border-berry ${
              coverImage ? "border-solid" : ""
            }`}
          >
            {coverImage ? (
              <img src={coverImage} alt="Ảnh bìa" className="h-full w-full object-cover" />
            ) : (
              <ImagePlus size={24} />
            )}
          </button>
          <div className="min-w-0 text-sm text-cocoa/60">
            <p className="font-medium text-cocoa/80">{coverImage ? "Đã chọn ảnh bìa 💕" : "Chưa có ảnh bìa"}</p>
            <p className="mt-0.5">Không bắt buộc — website vẫn đẹp nếu bỏ qua.</p>
            {coverImage && (
              <button
                type="button"
                onClick={() => onCoverChange("")}
                className="mt-1.5 text-xs font-semibold text-wine underline-offset-2 hover:underline"
              >
                Gỡ ảnh bìa
              </button>
            )}
          </div>
        </div>
        <input
          ref={coverRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            handleFiles(e.target.files, "cover");
            e.target.value = "";
          }}
        />
      </div>

      {/* ── ẢNH KỶ NIỆM ── */}
      <div>
        <p className="mb-2 text-sm font-semibold text-cocoa/80">
          Ảnh kỷ niệm <span className="font-normal text-cocoa/45">(tối đa {MAX_PHOTOS} ảnh)</span>
        </p>
        <button
          type="button"
          onClick={() => galleryRef.current?.click()}
          className="flex w-full flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-lilac/60 bg-lav/30 px-4 py-8 text-cocoa/50 transition hover:border-berry hover:text-berry"
        >
          {busy ? <Loader2 size={26} className="animate-spin text-berry" /> : <ImagePlus size={26} />}
          <span className="text-sm font-semibold">
            {busy ? "Đang xử lý ảnh..." : "Chọn ảnh từ thiết bị của bạn"}
          </span>
          <span className="text-xs">Có thể chọn nhiều ảnh cùng lúc · JPG/PNG</span>
        </button>
        <input
          ref={galleryRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            handleFiles(e.target.files, "gallery");
            e.target.value = "";
          }}
        />

        {/* Lưới ảnh đã chọn */}
        {photos.length > 0 && (
          <div className="mt-4 grid grid-cols-4 gap-2.5 sm:grid-cols-5">
            <AnimatePresence initial={false}>
              {photos.map((p, i) => (
                <motion.div
                  key={`${i}-${p.length}`}
                  layout
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.6 }}
                  className="relative aspect-square overflow-hidden rounded-2xl shadow-card"
                >
                  <img src={p} alt={`Kỷ niệm ${i + 1}`} className="h-full w-full object-cover" />
                  <button
                    type="button"
                    aria-label={`Xoá ảnh ${i + 1}`}
                    onClick={() => onPhotosChange(photos.filter((_, idx) => idx !== i))}
                    className="absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full bg-night/60 text-white backdrop-blur transition hover:bg-wine"
                  >
                    <X size={13} />
                  </button>
                  {i === 0 && (
                    <span className="absolute bottom-1.5 left-1.5 rounded-full bg-white/85 px-2 py-0.5 text-[10px] font-bold text-wine">
                      Ảnh chính
                    </span>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
        <p className="mt-2.5 text-xs text-cocoa/45">
          {photos.length}/{MAX_PHOTOS} ảnh · Ảnh đầu tiên sẽ là ảnh lớn nhất ở gallery
        </p>
      </div>

      <AnimatePresence>
        {warn && (
          <motion.p
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-2xl bg-petal/70 px-4 py-2.5 text-[13px] font-medium text-wine"
          >
            {warn}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}