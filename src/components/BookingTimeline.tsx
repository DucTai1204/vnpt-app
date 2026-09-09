import React from 'react';
import {
  Activity,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Headset,
  UserCheck,
  XCircle,
} from 'lucide-react';
import { useOptions } from '../api/BootstrapContext';
import { ApiBookingDetail } from '../api/client';

/** Icon do DB chỉ định (lua_chon.icon của nhóm `trang_thai_don`). */
const ICONS: Record<string, React.ElementType> = {
  ClipboardCheck,
  Headset,
  UserCheck,
  Activity,
  CheckCircle2,
  XCircle,
};

/** Backend trả "yyyy-mm-dd HH:mm:ss" -> "HH:mm, dd/mm/yyyy". */
const moment = (s: string | null | undefined) => {
  if (!s) return '';
  const [d, t] = s.split(' ');
  const [y, m, day] = (d ?? '').split('-');
  return `${(t ?? '').slice(0, 5)}, ${day}/${m}/${y}`;
};

interface Props {
  booking: ApiBookingDetail;
}

/**
 * Timeline trạng thái đơn.
 *
 * Các bước và nhãn lấy từ bộ lựa chọn `trang_thai_don` trong DB, sắp theo
 * `thu_tu` — thêm hoặc đổi tên một trạng thái chỉ cần sửa DB. Trạng thái
 * `da_huy` để `thu_tu = 99` vì nó nằm NGOÀI luồng chính, không phải bước cuối.
 *
 * Bước đã đi qua tô xanh lá, bước chưa tới để xám. Mốc thời gian lấy từ
 * `statusHistory` của backend, không tự suy ra ở FE.
 */
export const BookingTimeline: React.FC<Props> = ({ booking }) => {
  const allStatuses = useOptions('trang_thai_don');

  // Luồng chính: bỏ 'da_huy' ra, nó được xử lý riêng bên dưới
  const flow = allStatuses.filter((o) => o.value !== 'da_huy');
  const cancelled = booking.status === 'da_huy';

  const currentIndex = flow.findIndex((o) => o.value === booking.status);

  /** Thời điểm đơn CHUYỂN SANG trạng thái này, nếu đã từng xảy ra. */
  const reachedAt = (status: string): string | null => {
    if (status === 'khoi_tao') {
      // Mốc tạo đơn: lịch sử có thể chưa ghi bước đầu, dùng ngày tạo đơn
      const first = booking.statusHistory.find((h) => h.toStatus === 'khoi_tao');
      return first?.createdAt ?? booking.createdAt;
    }
    return booking.statusHistory.find((h) => h.toStatus === status)?.createdAt ?? null;
  };

  /** Tên cộng tác viên, lấy từ buổi làm việc đầu tiên đã có người nhận. */
  const caregiver = booking.sessions.find((s) => s.caregiverName)?.caregiverName ?? null;

  if (cancelled) {
    const opt = allStatuses.find((o) => o.value === 'da_huy');
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-accent-surface p-4">
        <XCircle className="w-6 h-6 text-accent shrink-0" />
        <div>
          <p className="font-bold text-accent">{opt?.label ?? 'Đã huỷ'}</p>
          <p className="text-sm text-muted mt-0.5">{opt?.description ?? ''}</p>
          <p className="text-xs text-muted mt-1">{moment(reachedAt('da_huy'))}</p>
        </div>
      </div>
    );
  }

  return (
    <ol className="relative">
      {flow.map((opt, i) => {
        const done = currentIndex >= 0 && i <= currentIndex;
        const at = reachedAt(opt.value);
        const Icon = ICONS[opt.icon ?? ''] ?? ClipboardCheck;
        const last = i === flow.length - 1;

        return (
          <li key={opt.value} className="relative flex gap-4 pb-6 last:pb-0">
            {/* Đường nối giữa các mốc; xanh nếu bước SAU đã đi qua */}
            {!last && (
              <span
                aria-hidden="true"
                className={`absolute left-5 top-11 bottom-0 w-0.5 ${
                  currentIndex > i ? 'bg-emerald-500' : 'bg-hairline'
                }`}
              />
            )}

            <span
              className={`relative z-10 w-10 h-10 shrink-0 rounded-full flex items-center justify-center border-2 ${
                done
                  ? 'bg-emerald-500 border-emerald-500 text-white'
                  : 'bg-white border-hairline text-slate-400'
              }`}
            >
              {done ? <Check className="w-5 h-5" strokeWidth={3} /> : <Icon className="w-5 h-5" />}
            </span>

            <div className="pt-1 min-w-0">
              <p className={`font-bold ${done ? 'text-navy' : 'text-slate-400'}`}>{opt.label}</p>
              {opt.description && (
                <p className={`text-sm mt-0.5 ${done ? 'text-muted' : 'text-slate-400'}`}>
                  {opt.description}
                </p>
              )}
              {at && <p className="text-xs text-muted mt-1">{moment(at)}</p>}

              {/* Có người nhận rồi thì nêu tên ngay tại bước phân công */}
              {opt.value === 'da_phan_cong' && done && caregiver && (
                <p className="text-sm font-semibold text-brand-text mt-1">
                  Cộng tác viên: {caregiver}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
};
