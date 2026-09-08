import React, { useMemo, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Lịch tháng theo bộ thiết kế SAN.
 *
 * - Cột T2..CN, T7 và CN in màu đỏ.
 * - Ngày đang chọn: hình tròn tô đặc (xanh với ngày thường, đỏ với T7/CN).
 * - Ngày ngoài tháng hiện mờ để giữ đúng lưới 7 cột.
 * - Ngày ngoài khoảng cho phép bị vô hiệu hoá.
 *
 * Không cố định tháng/năm: `minDate`/`maxDate` suy ra từ cấu hình
 * `dat_lich.so_gio_dat_truoc` và `dat_lich.so_thang_toi_da` do backend cấp.
 */

interface MonthCalendarProps {
  /** Ngày đang chọn, ISO yyyy-mm-dd. */
  selected: string[];
  minDate: Date;
  maxDate: Date;
  onPick: (isoDate: string) => void;
  /** Chọn nhiều ngày (gói tháng) -> hiện chú thích "Ngày đã chọn". */
  multiple?: boolean;
  /** Nút phụ bên phải tiêu đề, vd "Tùy chọn lịch". */
  action?: React.ReactNode;
  title?: string;
}

const WEEKDAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

const toIso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

const VN_WEEKDAY = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];

export const MonthCalendar: React.FC<MonthCalendarProps> = ({
  selected,
  minDate,
  maxDate,
  onPick,
  multiple = false,
  action,
  title,
}) => {
  const [cursor, setCursor] = useState(() => new Date(minDate.getFullYear(), minDate.getMonth(), 1));

  const minDay = startOfDay(minDate);
  const maxDay = startOfDay(maxDate);
  const today = startOfDay(new Date());

  const { cells, monthLabel } = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const first = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // getDay(): 0=CN -> đổi sang lưới bắt đầu từ T2
    const leading = (first.getDay() + 6) % 7;

    const list: { date: Date; outside: boolean }[] = [];
    for (let i = leading; i > 0; i -= 1) {
      list.push({ date: new Date(year, month, 1 - i), outside: true });
    }
    for (let d = 1; d <= daysInMonth; d += 1) {
      list.push({ date: new Date(year, month, d), outside: false });
    }
    // Bù cho đủ hàng cuối
    while (list.length % 7 !== 0) {
      const last = list[list.length - 1].date;
      list.push({ date: new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1), outside: true });
    }

    return { cells: list, monthLabel: `Tháng ${month + 1}, ${year}` };
  }, [cursor]);

  const canPrev = cursor > new Date(minDay.getFullYear(), minDay.getMonth(), 1);
  const canNext = cursor < new Date(maxDay.getFullYear(), maxDay.getMonth(), 1);
  const shift = (delta: number) =>
    setCursor((c) => new Date(c.getFullYear(), c.getMonth() + delta, 1));

  return (
    <div>
      {(title || action) && (
        <div className="flex items-center justify-between mb-3">
          {title && (
            <h3 className="flex items-center gap-2.5 text-base font-bold text-navy">
              <CalendarDays className="w-5 h-5 text-brand" />
              <span>{title}</span>
            </h3>
          )}
          {action}
        </div>
      )}

      {/* Điều hướng tháng */}
      <div className="flex items-center justify-between px-1 mb-3">
        <button
          type="button"
          onClick={() => shift(-1)}
          disabled={!canPrev}
          aria-label="Tháng trước"
          className="p-1.5 rounded-lg text-accent hover:bg-accent-surface disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <span className="text-base font-bold text-navy">{monthLabel}</span>

        <button
          type="button"
          onClick={() => shift(1)}
          disabled={!canNext}
          aria-label="Tháng sau"
          className="p-1.5 rounded-lg text-accent hover:bg-accent-surface disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Tên cột: T7 và CN màu đỏ */}
      <div className="grid grid-cols-7 text-center text-sm font-bold mb-2">
        {WEEKDAYS.map((w) => (
          <span key={w} className={w === 'T7' || w === 'CN' ? 'text-accent' : 'text-navy'}>
            {w}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-1.5 text-center">
        {cells.map(({ date, outside }) => {
          const iso = toIso(date);
          const isSelected = selected.includes(iso);
          const isWeekend = date.getDay() === 0 || date.getDay() === 6;
          const disabled = outside || date < minDay || date > maxDay;

          const base =
            'mx-auto w-9 h-9 rounded-full text-sm font-bold flex items-center justify-center transition-colors';

          let tone: string;
          if (isSelected) {
            // Ngày chọn: tròn tô đặc — đỏ nếu là T7/CN, xanh nếu ngày thường
            tone = `${isWeekend ? 'bg-accent' : 'bg-brand'} text-white cursor-pointer`;
          } else if (disabled) {
            tone = 'text-slate-300 cursor-not-allowed';
          } else if (isWeekend) {
            tone = 'text-accent hover:bg-accent-surface cursor-pointer';
          } else {
            tone = 'text-navy hover:bg-brand-surface cursor-pointer';
          }

          return (
            <button
              key={iso}
              type="button"
              disabled={disabled}
              aria-pressed={isSelected}
              aria-label={`${VN_WEEKDAY[date.getDay()]}, ${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`}
              onClick={() => onPick(iso)}
              className={`${base} ${tone}`}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>

      {multiple ? (
        <p className="mt-4 flex items-center gap-2 text-xs font-semibold text-navy">
          <span className="w-2.5 h-2.5 rounded-full bg-brand inline-block" />
          Ngày đã chọn
        </p>
      ) : (
        <div className="mt-4 flex items-center gap-2.5 rounded-xl bg-brand-surface px-4 py-3">
          <CalendarDays className="w-4 h-4 text-brand shrink-0" />
          <span className="text-xs font-semibold text-navy">
            Hôm nay: {VN_WEEKDAY[today.getDay()]},{' '}
            {String(today.getDate()).padStart(2, '0')}/
            {String(today.getMonth() + 1).padStart(2, '0')}/{today.getFullYear()}
          </span>
        </div>
      )}
    </div>
  );
};
