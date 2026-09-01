/**
 * REPEATER CARDS — editor dạng thẻ cho Timeline & Memory cards.
 * Người dùng thêm/xoá hàng tuỳ ý; hàng trống sẽ tự bị bỏ qua khi tạo website.
 */
import { AnimatePresence, motion } from "framer-motion";
import { Plus, Trash2 } from "lucide-react";
import { TextInput, TextArea, inputCls } from "./ui.jsx";

/* ── TIMELINE: date / title / description ────────────────── */
export function TimelineEditor({ items, onChange }) {
  const update = (i, key, value) =>
    onChange(items.map((row, idx) => (idx === i ? { ...row, [key]: value } : row)));
  const remove = (i) => onChange(items.filter((_, idx) => idx !== i));
  const add = () => onChange([...items, { date: "", title: "", description: "" }]);

  return (
    <div className="space-y-4">
      <AnimatePresence initial={false}>
        {items.map((row, i) => (
          <motion.div
            key={i}
            layout
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative rounded-3xl border border-lav bg-lav/25 p-4 sm:p-5"
          >
            <div className="grid gap-3 sm:grid-cols-[130px_1fr]">
              <TextInput
                placeholder="14.02.2025"
                aria-label="Ngày cột mốc"
                value={row.date}
                onChange={(e) => update(i, "date", e.target.value)}
              />
              <TextInput
                placeholder="Tiêu đề cột mốc (vd: Lần đầu cầm tay)"
                aria-label="Tiêu đề cột mốc"
                value={row.title}
                onChange={(e) => update(i, "title", e.target.value)}
              />
            </div>
            <TextArea
              rows={2}
              className="mt-3"
              placeholder="Kể ngắn gọn về kỷ niệm này..."
              aria-label="Nội dung cột mốc"
              value={row.description}
              onChange={(e) => update(i, "description", e.target.value)}
            />
            {items.length > 1 && (
              <button
                type="button"
                aria-label="Xoá cột mốc"
                onClick={() => remove(i)}
                className="absolute -right-2 -top-2 grid h-8 w-8 place-items-center rounded-full bg-white text-cocoa/40 shadow-card transition hover:bg-wine hover:text-white"
              >
                <Trash2 size={14} />
              </button>
            )}
          </motion.div>
        ))}
      </AnimatePresence>

      <AddButton onClick={add} label="Thêm cột mốc" />
      <p className="text-xs text-cocoa/45">
        Để trống các hàng không dùng · Ảnh cho từng mốc sẽ tự lấy từ gallery của hai bạn
      </p>
    </div>
  );
}

/* ── MEMORIES: title / description ───────────────────────── */
export function MemoriesEditor({ items, onChange }) {
  const update = (i, key, value) =>
    onChange(items.map((row, idx) => (idx === i ? { ...row, [key]: value } : row)));
  const remove = (i) => onChange(items.filter((_, idx) => idx !== i));
  const add = () => onChange([...items, { title: "", description: "" }]);

  return (
    <div className="space-y-4">
      <AnimatePresence initial={false}>
        {items.map((row, i) => (
          <motion.div
            key={i}
            layout
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative rounded-3xl border border-petal bg-petal/25 p-4 sm:p-5"
          >
            <TextInput
              placeholder="Tiêu đề (vd: Nụ cười của ấy)"
              aria-label="Tiêu đề thẻ kỷ niệm"
              value={row.title}
              onChange={(e) => update(i, "title", e.target.value)}
            />
            <TextArea
              rows={2}
              className="mt-3"
              placeholder="Mô tả ngắn..."
              aria-label="Mô tả thẻ kỷ niệm"
              value={row.description}
              onChange={(e) => update(i, "description", e.target.value)}
            />
            <button
              type="button"
              aria-label="Xoá thẻ"
              onClick={() => remove(i)}
              className="absolute -right-2 -top-2 grid h-8 w-8 place-items-center rounded-full bg-white text-cocoa/40 shadow-card transition hover:bg-wine hover:text-white"
            >
              <Trash2 size={14} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>

      <AddButton onClick={add} label="Thêm điều dễ thương" />
      <p className="text-xs text-cocoa/45">Để trống nếu muốn dùng bộ nội dung mẫu có sẵn</p>
    </div>
  );
}

function AddButton({ onClick, label }) {
  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-dashed border-candy/50 bg-white/50 px-4 py-3 text-sm font-semibold text-berry transition hover:border-berry hover:bg-petal/40"
    >
      <Plus size={17} /> {label}
    </motion.button>
  );
}