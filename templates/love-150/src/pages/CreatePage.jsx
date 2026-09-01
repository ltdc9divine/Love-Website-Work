/**
 * TRANG /create — "Tạo website tình yêu của hai bạn ❤️"
 *
 * Layout: BÊN TRÁI form · BÊN PHẢI live preview (desktop) — mobile: form ↓ preview.
 * Preview dùng CHÍNH template CoupleTemplate150 chạy trong iframe
 * (/preview/draft?embed=1), dữ liệu gửi realtime qua postMessage.
 *
 * Kiến trúc: FORM (state cục bộ) → createCoupleData() → TEMPLATE → PREVIEW.
 * Form KHÔNG phụ thuộc UI template — sau này thay state bằng API/database
 * chỉ cần đưa dữ liệu vào createCoupleData là xong.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  BookHeart,
  Heart,
  Images,
  MessageCircleHeart,
  Milestone,
  Music2,
  Sparkles,
  Users,
} from "lucide-react";
import BackgroundEffects from "../components/BackgroundEffects.jsx";
import Stepper from "../components/create/Stepper.jsx";
import PhotoUploader from "../components/create/PhotoUploader.jsx";
import { TimelineEditor, MemoriesEditor } from "../components/create/RepeaterCards.jsx";
import { Chip, Field, SectionCard, TextArea, TextInput } from "../components/create/ui.jsx";
import { EMPTY_FORM, createCoupleData, coupleToForm } from "../data/buildCouple.js";
import { formatLongVI } from "../utils/date.js";
import {
  getCoupleBySlug,
  listSavedSlugs,
  loadDraft,
  saveCouple,
  saveDraft,
} from "../utils/storage.js";
import { getAllSlugs } from "../data/couples/index.js";
import { navigate } from "../utils/router.js";

const PREVIEW_SRC = "/preview/draft?embed=1";

export default function CreatePage() {
  /* Form khởi tạo: ?edit=slug → nạp website đã tạo; không thì nạp draft đang dở */
  const [form, setForm] = useState(() => {
    try {
      const edit = new URLSearchParams(window.location.search).get("edit");
      if (edit) {
        const saved = getCoupleBySlug(edit);
        if (saved) return coupleToForm(saved);
      }
    } catch {
      /* bỏ qua */
    }
    return loadDraft() || EMPTY_FORM;
  });
  const [errors, setErrors] = useState({});
  const [draftNote, setDraftNote] = useState("");
  const [creating, setCreating] = useState(false);

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  /* coupleData cho preview — tính lại realtime theo từng cú gõ */
  const built = useMemo(() => createCoupleData(form, { unique: false }), [form]);

  /* Tự lưu nháp vào localStorage (không mất khi refresh) */
  useEffect(() => {
    const t = setTimeout(() => {
      const res = saveDraft(form);
      setDraftNote(res.ok ? "saved" : res.reason || "unavailable");
    }, 600);
    return () => clearTimeout(t);
  }, [form]);

  /* Gửi dữ liệu vào các iframe preview (desktop + mobile) realtime */
  const framesRef = useRef([]);
  const postToFrames = useCallback(
    (data) =>
      framesRef.current.forEach(
        (f) => f?.contentWindow?.postMessage({ type: "LOVE_COUPLE_DATA", couple: data }, "*")
      ),
    []
  );
  useEffect(() => {
    const t = setTimeout(() => postToFrames(built), 250);
    return () => clearTimeout(t);
  }, [built, postToFrames]);
  const onFrameLoad = useCallback(() => postToFrames(built), [built, postToFrames]);

  /* Gán ref cho từng iframe (0 = desktop, 1 = mobile) */
  const setFrameRef = useCallback(
    (idx) => (el) => {
      framesRef.current[idx] = el;
    },
    []
  );

  /* document.title riêng của trang tạo website */
  useEffect(() => {
    document.title = "Tạo website tình yêu của hai bạn ❤️";
  }, []);

  /* VALIDATION — lỗi mềm, không dùng alert */
  const validate = () => {
    const errs = {};
    if (!form.name1.trim()) errs.name1 = "Bạn chưa nhập tên của bạn ❤️";
    if (!form.name2.trim()) errs.name2 = "Bạn chưa nhập tên người yêu ❤️";
    if (!form.startDate) errs.startDate = "Bạn chưa chọn ngày bắt đầu yêu ❤️";
    return errs;
  };

  /* NÚT "Tạo website của chúng mình ❤️" */
  const handleCreate = () => {
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length) {
      document
        .getElementById(`field-${Object.keys(errs)[0]}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setCreating(true);
    const taken = new Set([...getAllSlugs(), ...listSavedSlugs()]);
    const couple = createCoupleData(form, { unique: true, takenSlugs: taken });
    saveCouple(couple);
    navigate(`/preview/${couple.slug}`);
  };

  /* ── GIAO DIỆN ─────────────────────────────────────────── */
  return (
    <div className="relative min-h-dvh">
      <BackgroundEffects />
      <div className="relative z-10 mx-auto w-full max-w-[1500px] px-4 pb-28 pt-8 sm:px-6 lg:px-10">
        {/* Header */}
        <header className="text-center">
          <Chip className="mb-4">✨ Sweet Love — 150.000đ</Chip>
          <h1 className="font-display text-3xl font-bold text-cocoa sm:text-4xl lg:text-5xl">
            Tạo website tình yêu
            <br className="hidden sm:block" /> của hai bạn{" "}
            <span className="inline-block animate-beat align-middle text-berry">❤️</span>
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm text-cocoa/55 sm:text-base">
            Điền vài dòng, thêm ảnh — website demo bên phải sẽ biến thành câu chuyện của
            riêng hai bạn, từng giây một 🥰
          </p>
          <div className="mt-5">
            <Stepper />
          </div>
        </header>

        <div className="mt-10 grid items-start gap-8 lg:grid-cols-[1fr_minmax(380px,44%)] xl:grid-cols-[1fr_minmax(440px,46%)]">
          {/* ═══ CỘT TRÁI: FORM ═══ */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleCreate();
            }}
            className="space-y-6"
            noValidate
          >
            {/* 1. THÔNG TIN CƠ BẢN */}
            <SectionCard
              id="step-info"
              step={1}
              icon={Users}
              title="Thông tin của hai bạn"
              hint="Ba dòng này là bắt buộc — phần còn lại có thể bỏ trống, mình sẽ điền nội dung mẫu giúp bạn."
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <div id="field-name1">
                  <Field label="Tên của bạn" required error={errors.name1}>
                    <TextInput
                      placeholder="vd: Thành"
                      value={form.name1}
                      onChange={(e) => set("name1")(e.target.value)}
                    />
                  </Field>
                </div>
                <div id="field-name2">
                  <Field label="Tên người yêu" required error={errors.name2}>
                    <TextInput
                      placeholder="vd: Linh"
                      value={form.name2}
                      onChange={(e) => set("name2")(e.target.value)}
                    />
                  </Field>
                </div>
                <div id="field-startDate" className="sm:col-span-2">
                  <Field label="Ngày bắt đầu yêu" required error={errors.startDate}>
                    <TextInput
                      type="date"
                      value={form.startDate}
                      onChange={(e) => set("startDate")(e.target.value)}
                    />
                  </Field>
                </div>
                <div className="sm:col-span-2">
                  <Field label="Câu nhỏ dưới tên (không bắt buộc)">
                    <TextInput
                      placeholder={`vd: Yêu nhau từ ${
                        built.startDate ? formatLongVI(built.startDate) : "một ngày đẹp trời"
                      }`}
                      maxLength={60}
                      value={form.heroSubtitle}
                      onChange={(e) => set("heroSubtitle")(e.target.value)}
                    />
                  </Field>
                </div>
              </div>
              <p className="mt-4 rounded-2xl bg-lav/40 px-4 py-3 text-[13px] text-cocoa/60">
                🔗 Link website của hai bạn sẽ là:{" "}
                <span className="font-bold text-wine">/{built.slug}</span>
              </p>
            </SectionCard>

            {/* 2. ẢNH */}
            <SectionCard
              id="step-photos"
              step={2}
              icon={Images}
              title="Ảnh của hai bạn"
              hint="Ảnh nằm ngay trên máy bạn — bản demo này chưa tải ảnh lên server nào."
            >
              <PhotoUploader
                coverImage={form.coverImage}
                onCoverChange={set("coverImage")}
                photos={form.photos}
                onPhotosChange={set("photos")}
              />
            </SectionCard>

            {/* 3. CÂU CHUYỆN */}
            <SectionCard
              id="step-story"
              step={3}
              icon={BookHeart}
              title="Câu chuyện của hai bạn"
              hint="Kể những cột mốc đáng nhớ và những điều dễ thương về người ấy."
            >
              <div className="space-y-8">
                <div>
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-cocoa/50">
                    <Milestone className="h-4 w-4 text-berry" /> Timeline kỷ niệm
                  </h3>
                  <TimelineEditor items={form.timeline} onChange={(v) => set("timeline")(v)} />
                </div>
                <div>
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-cocoa/50">
                    <Sparkles className="h-4 w-4 text-berry" /> Những điều dễ thương
                  </h3>
                  <MemoriesEditor items={form.memories} onChange={(v) => set("memories")(v)} />
                </div>
              </div>
            </SectionCard>

            {/* 4. ĐIỀU MUỐN NÓI + LỜI NHẮN CUỐI + NHẠC */}
            <SectionCard
              id="step-letter"
              icon={MessageCircleHeart}
              title="Điều bạn muốn nói"
              hint="Lá thư tình và lời nhắn cuối trang — hai thứ khiến người ấy rơi nước mắt 💧"
            >
              <div className="space-y-5">
                <Field label="Tiêu đề lá thư">
                  <TextInput
                    placeholder="vd: Gửi người con gái anh thương"
                    maxLength={80}
                    value={form.letterTitle}
                    onChange={(e) => set("letterTitle")(e.target.value)}
                  />
                </Field>
                <Field
                  label="Nội dung lá thư"
                  hint="Xuống dòng bình thường — thư sẽ hiện y như bạn viết."
                >
                  <TextArea
                    rows={7}
                    placeholder="Viết từ trái tim..."
                    value={form.letterContent}
                    onChange={(e) => set("letterContent")(e.target.value)}
                  />
                </Field>
                <Field label="Lời nhắn cuối trang (phần bất ngờ cuối)">
                  <TextArea
                    rows={2}
                    maxLength={140}
                    placeholder="vd: Anh yêu em rất nhiều ❤️"
                    value={form.finalMessage}
                    onChange={(e) => set("finalMessage")(e.target.value)}
                  />
                </Field>
                <Field
                  label={
                    <span className="flex items-center gap-1.5">
                      <Music2 size={15} className="text-berry" /> Nhạc nền (URL bài hát)
                    </span>
                  }
                  hint="Dán link file .mp3/.wav. Để trống sẽ dùng nhạc demo."
                >
                  <TextInput
                    placeholder="https://.../bai-hat-cua-chung-minh.mp3"
                    value={form.musicUrl}
                    onChange={(e) => set("musicUrl")(e.target.value)}
                  />
                </Field>
              </div>
            </SectionCard>

            {/* NÚT TẠO WEBSITE */}
            <div className="rounded-[2rem] border border-white/70 bg-white/60 p-6 text-center shadow-card backdrop-blur-xl sm:p-8">
              <p className="font-script text-2xl text-berry">Let&apos;s create something special</p>
              <motion.button
                type="submit"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                className="btn-primary mt-4 w-full sm:w-auto"
              >
                <Heart size={18} strokeWidth={0} fill="currentColor" />
                {creating ? "Đang tạo..." : "Tạo website của chúng mình ❤️"}
              </motion.button>
              <p className="mt-3 text-xs text-cocoa/45">
                {draftNote === "saved" && "💾 Đang tự lưu nháp trên máy bạn — refresh cũng không mất"}
                {draftNote === "photos-dropped" && "💾 Đã lưu nháp (bỏ ảnh để tiết kiệm bộ nhớ)"}
                {draftNote === "unavailable" && "⚠️ Trình duyệt chặn lưu trữ — bạn copy nội dung lại nhé"}
              </p>
            </div>
          </form>

          {/* ═══ CỘT PHẢI: LIVE PREVIEW (desktop) ═══ */}
          <aside id="step-preview" className="scroll-mt-28 lg:sticky lg:top-6">
            <div className="mb-3 flex items-center justify-between px-1">
              <p className="flex items-center gap-2 text-sm font-bold text-cocoa/70">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-berry opacity-60" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-berry" />
                </span>
                Xem trước trực tiếp
              </p>
              <span className="text-xs text-cocoa/45">cập nhật từng chữ bạn gõ ✨</span>
            </div>
            <div className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-white/40 p-2.5 shadow-card backdrop-blur-xl">
              <iframe
                ref={setFrameRef(0)}
                title="Xem trước website tình yêu"
                src={PREVIEW_SRC}
                onLoad={onFrameLoad}
                className="h-[70vh] min-h-[520px] w-full rounded-[1.6rem] border-0 bg-cream"
              />
            </div>
          </aside>
        </div>

        {/* ═══ PREVIEW MOBILE — nằm dưới form ═══ */}
        <section className="mt-12 lg:hidden">
          <div className="mb-3 px-1">
            <p className="flex items-center gap-2 text-sm font-bold text-cocoa/70">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-berry opacity-60" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-berry" />
              </span>
              Website của hai bạn
            </p>
          </div>
          <div className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/40 p-2.5 shadow-card backdrop-blur-xl">
            <iframe
              ref={setFrameRef(1)}
              title="Xem trước trên điện thoại"
              src={PREVIEW_SRC}
              onLoad={onFrameLoad}
              loading="lazy"
              className="h-[75vh] min-h-[480px] w-full rounded-[1.6rem] border-0 bg-cream"
            />
          </div>
        </section>

        {/* Nút tạo nổi trên mobile */}
        <div className="fixed inset-x-0 bottom-4 z-[80] flex justify-center px-4 lg:hidden">
          <motion.button
            type="button"
            whileTap={{ scale: 0.95 }}
            onClick={handleCreate}
            className="btn-primary rounded-full shadow-2xl"
          >
            <Heart size={17} strokeWidth={0} fill="currentColor" /> Tạo website của chúng mình ❤️
          </motion.button>
        </div>
      </div>
    </div>
  );
}