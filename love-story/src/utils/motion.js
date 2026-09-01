/**
 * Preset animation dùng chung (Framer Motion) — tránh lặp code.
 *
 * Cách dùng:
 *   <motion.div {...fadeUp()}>…</motion.div>
 *   <motion.div {...fadeUp(0.15)}>…</motion.div>
 */

/** Trượt lên + mờ dần khi vào viewport */
export function fadeUp(delay = 0) {
  return {
    initial: { opacity: 0, y: 32 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.2 },
    transition: { duration: 0.7, delay, ease: "easeOut" },
  };
}

/** Phóng to nhẹ khi vào viewport */
export function popIn(delay = 0) {
  return {
    initial: { opacity: 0, scale: 0.85 },
    whileInView: { opacity: 1, scale: 1 },
    viewport: { once: true, amount: 0.2 },
    transition: { duration: 0.6, delay, ease: [0.34, 1.56, 0.64, 1] },
  };
}

/** Hiện dần đơn giản */
export function fadeIn(delay = 0) {
  return {
    initial: { opacity: 0 },
    whileInView: { opacity: 1 },
    viewport: { once: true, amount: 0.2 },
    transition: { duration: 0.9, delay },
  };
}
