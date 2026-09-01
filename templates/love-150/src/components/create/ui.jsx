/**
 * UI DÙNG CHUNG cho trang /create — cùng ngôn ngữ thiết kế với template
 * (glass card, gradient berry→lilac, font display/script).
 */
import { AnimatePresence, motion } from "framer-motion";

/** Card section lớn trong form */
export function SectionCard({ id, icon: Icon, step, title, hint, children }) {
  return (
    <section id={id} className="scroll-mt-28 rounded-[2rem] border border-white/70 bg-white/60 p-6 shadow-card backdrop-blur-xl sm:p-8">
      <div className="mb-6 flex items-start gap-4">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-berry to-lilac text-white shadow-glow">
          {Icon && <Icon size={22} />}
        </span>
        <div className="min-w-0">
          <h2 className="font-display text-xl font-bold text-cocoa sm:text-2xl">
            {step && <span className="mr-2 text-berry">{step}.</span>}
            {title}
          </h2>
          {hint && <p className="mt-1 text-sm text-cocoa/55">{hint}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

/** Label + control + gợi ý + lỗi mềm (không dùng alert) */
export function Field({ label, required = false, hint, error, children }) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center gap-1 text-sm font-semibold text-cocoa/80">
        {label}
        {required && <span className="text-berry">*</span>}
      </span>
      {hint && <span className="mb-2 block text-xs text-cocoa/45">{hint}</span>}
      {children}
      <AnimatePresence>
        {error && (
          <motion.span
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-1.5 block text-[13px] font-medium text-wine"
          >
            {error}
          </motion.span>
        )}
      </AnimatePresence>
    </label>
  );
}

export const inputCls =
  "input-field";

export function TextInput(props) {
  return <input {...props} className={`${inputCls} ${props.className || ""}`} />;
}

export function TextArea(props) {
  return (
    <textarea
      rows={4}
      {...props}
      className={`${inputCls} resize-y leading-relaxed ${props.className || ""}`}
    />
  );
}

/** Chip hiển thị trạng thái nhỏ */
export function Chip({ children, className = "" }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-white/80 bg-white/70 px-3.5 py-1.5 text-xs font-semibold text-wine shadow-sm ${className}`}
    >
      {children}
    </span>
  );
}