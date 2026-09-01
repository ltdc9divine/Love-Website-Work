import { useEffect, useState } from "react";
import { parseStart } from "../utils/date";

/**
 * Bộ đếm thời gian yêu realtime — tính từ `startDate` đến hiện tại,
 * cập nhật mỗi giây. Trả về { days, hours, minutes, seconds, totalDays }.
 */
export default function useLoveCounter(startDate) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const diff = Math.max(0, now - parseStart(startDate).getTime());

  return {
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor((diff % 86_400_000) / 3_600_000),
    minutes: Math.floor((diff % 3_600_000) / 60_000),
    seconds: Math.floor((diff % 60_000) / 1000),
    totalDays: Math.floor(diff / 86_400_000),
  };
}
