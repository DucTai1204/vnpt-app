import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, ClipboardList, Loader2 } from 'lucide-react';
import { useOptions } from '../api/BootstrapContext';
import {
  ApiBookingDetail,
  ApiBookingSummary,
  ApiError,
  getBooking,
  getBookings,
} from '../api/client';
import { AppStatus } from './AppStatus';
import { BookingTimeline } from './BookingTimeline';

const money = (n: number) => `${n.toLocaleString('vi-VN')} đ`;

/** "yyyy-mm-dd" -> "dd/mm/yyyy". Chuỗi rỗng thì trả về gạch ngang. */
const day = (s: string | null | undefined) => {
  if (!s) return '—';
  const [y, m, d] = s.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
};

/**
 * Danh sách đơn của người đang đăng nhập, bấm một đơn thì mở timeline trạng thái.
 *
 * Nhãn trạng thái lấy từ bộ lựa chọn `trang_thai_don` trong DB, không gán cứng.
 */
export const BookingList: React.FC = () => {
  const statuses = useOptions('trang_thai_don');

  const [list, setList] = useState<ApiBookingSummary[] | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [attempt, setAttempt] = useState(0);

  const [openCode, setOpenCode] = useState<string | null>(null);
  const [detail, setDetail] = useState<ApiBookingDetail | null>(null);
  const [detailError, setDetailError] = useState<ApiError | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setError(null);

    getBookings(controller.signal)
      .then(setList)
      .catch((err: unknown) => {
        if ((err as Error)?.name === 'AbortError') return;
        setError(
          err instanceof ApiError ? err : new ApiError('INTERNAL_ERROR', 'Không tải được đơn'),
        );
      });

    // [R-2.5] Cleanup bắt buộc
    return () => controller.abort();
  }, [attempt]);

  useEffect(() => {
    if (!openCode) return;
    const controller = new AbortController();
    setDetail(null);
    setDetailError(null);

    getBooking(openCode, controller.signal)
      .then(setDetail)
      .catch((err: unknown) => {
        if ((err as Error)?.name === 'AbortError') return;
        setDetailError(
          err instanceof ApiError ? err : new ApiError('INTERNAL_ERROR', 'Không tải được đơn'),
        );
      });

    return () => controller.abort();
  }, [openCode]);

  const labelOf = (code: string) => statuses.find((s) => s.value === code)?.label ?? code;

  /* --------------------------- Chi tiết + timeline -------------------------- */
  if (openCode) {
    return (
      <div className="bg-white rounded-2xl border border-hairline p-5 sm:p-6">
        <button
          type="button"
          onClick={() => setOpenCode(null)}
          className="flex items-center gap-2 text-sm font-semibold text-navy hover:text-brand cursor-pointer mb-5"
        >
          <ChevronLeft className="w-5 h-5" />
          <span>Tất cả đơn</span>
        </button>

        {detailError && (
          <AppStatus
            inline
            kind={detailError.code === 'NO_INTERNET' ? 'offline' : 'error'}
            message={detailError.message}
            onRetry={() => setOpenCode(openCode)}
          />
        )}

        {!detail && !detailError && (
          <div className="flex items-center justify-center gap-2 py-10 text-muted">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Đang tải đơn...</span>
          </div>
        )}

        {detail && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <p className="text-xs text-muted">Mã đơn hàng</p>
              <p className="text-xl font-extrabold text-navy">{detail.code}</p>

              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex gap-2">
                  <dt className="text-muted shrink-0 w-32">Dịch vụ</dt>
                  <dd className="font-semibold text-ink">
                    {detail.serviceTitle} — {detail.packageLabel}
                  </dd>
                </div>
                <div className="flex gap-2">
                  <dt className="text-muted shrink-0 w-32">Bắt đầu</dt>
                  <dd className="font-semibold text-ink">
                    {day(detail.firstServiceDate)} lúc {detail.startTime.slice(0, 5)}
                  </dd>
                </div>
                <div className="flex gap-2">
                  <dt className="text-muted shrink-0 w-32">Số buổi</dt>
                  <dd className="font-semibold text-ink">{detail.sessionCount} buổi</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="text-muted shrink-0 w-32">Địa chỉ</dt>
                  <dd className="font-semibold text-ink">{detail.addressText}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="text-muted shrink-0 w-32">Tổng tiền</dt>
                  <dd className="font-extrabold text-accent">{money(detail.totalAmount)}</dd>
                </div>
              </dl>
            </div>

            <div>
              <h3 className="text-base font-bold text-navy mb-4">Tiến trình xử lý</h3>
              <BookingTimeline booking={detail} />
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ------------------------------- Danh sách ------------------------------- */
  if (error) {
    return (
      <AppStatus
        inline
        kind={error.code === 'NO_INTERNET' ? 'offline' : 'error'}
        message={error.message}
        onRetry={() => setAttempt((n) => n + 1)}
      />
    );
  }

  if (list === null) {
    return (
      <div className="bg-white rounded-2xl border border-hairline p-5 space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-20 rounded-xl bg-stone-100 animate-pulse" aria-hidden="true" />
        ))}
      </div>
    );
  }

  if (list.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-hairline p-10 text-center">
        <ClipboardList className="w-8 h-8 text-slate-400 mx-auto mb-3" />
        <p className="font-bold text-navy mb-1">Chưa có đơn nào</p>
        <p className="text-sm text-muted">Đơn bạn đặt sẽ hiện ở đây để theo dõi tiến trình.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {list.map((b) => (
        <button
          key={b.code}
          type="button"
          onClick={() => setOpenCode(b.code)}
          className="w-full text-left bg-white rounded-2xl border border-hairline p-4 sm:p-5 hover:border-brand-border hover:shadow-md transition-all cursor-pointer flex items-center gap-4"
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-extrabold text-navy">{b.code}</span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-brand-surface text-brand-text">
                {labelOf(b.status)}
              </span>
            </div>
            <p className="text-sm text-ink mt-1 truncate">
              {b.serviceTitle} — {b.packageLabel}
            </p>
            <p className="text-xs text-muted mt-0.5">
              {day(b.firstServiceDate)} lúc {b.startTime.slice(0, 5)} · {b.sessionCount} buổi
            </p>
          </div>

          <div className="text-right shrink-0">
            <p className="font-extrabold text-accent">{money(b.totalAmount)}</p>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" />
        </button>
      ))}
    </div>
  );
};
