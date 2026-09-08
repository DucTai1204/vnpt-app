import React, { useEffect, useMemo, useState } from 'react';
import {
  Banknote,
  Briefcase,
  Calendar,
  Check,
  CheckCircle,
  Clock,
  Info,
  Loader2,
  MapPin,
  Ticket,
  User,
  X,
} from 'lucide-react';
import { useImage, useOptions, useStep } from '../api/BootstrapContext';
import {
  ApiError,
  ApiQuote,
  ApiVoucher,
  getQuote,
  getVouchers,
  QuoteInput,
} from '../api/client';
import { BookingState } from '../types';
import { AppStatus } from './AppStatus';
import { RemoteImage } from './RemoteImage';

interface Step7Props {
  booking: BookingState;
  onUpdatePaymentMethod: (method: string) => void;
  onUpdateVoucher: (voucherCode: string) => void;
  onSubmitOrder: () => Promise<void>;
}

const money = (n: number) => `${n.toLocaleString('vi-VN')} đ`;

/** Backend trả "yyyy-mm-dd HH:mm:ss" — chỉ hiển thị phần giờ:phút. */
const clockOf = (datetime: string) => datetime.slice(11, 16);

export const Step7ConfirmPayment: React.FC<Step7Props> = ({
  booking,
  onUpdatePaymentMethod,
  onUpdateVoucher,
  onSubmitOrder,
}) => {
  const anhXacNhan = useImage('dv-nguoi-gia');
  const step = useStep('step7');
  const paymentOptions = useOptions('phuong_thuc_thanh_toan');
  const genderOptions = useOptions('gioi_tinh');

  const [quote, setQuote] = useState<ApiQuote | null>(null);
  const [vouchers, setVouchers] = useState<ApiVoucher[] | null>(null);
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<ApiError | null>(null);
  const [attempt, setAttempt] = useState(0);

  const dates = useMemo(
    () => (booking.packageCategory === 'daily' ? [booking.selectedDate] : booking.selectedDates),
    [booking.packageCategory, booking.selectedDate, booking.selectedDates],
  );

  const quoteInput: QuoteInput | null = useMemo(() => {
    if (!booking.serviceCode || !booking.packageCode || !booking.startTime) return null;
    if (dates.length === 0 || dates.some((d) => !d)) return null;
    return {
      serviceCode: booking.serviceCode,
      packageCode: booking.packageCode,
      dates,
      startTime: booking.startTime,
      voucherCode: booking.voucher || null,
    };
  }, [booking.serviceCode, booking.packageCode, booking.startTime, booking.voucher, dates]);

  /** [R] Giá luôn lấy từ /bookings/quote — FE không nhân giá × số buổi. */
  useEffect(() => {
    if (!quoteInput) return;
    const controller = new AbortController();
    setError(null);

    getQuote(quoteInput, controller.signal)
      .then(setQuote)
      .catch((err: unknown) => {
        if ((err as Error)?.name === 'AbortError') return;
        setError(
          err instanceof ApiError ? err : new ApiError('INTERNAL_ERROR', 'Không tính được giá'),
        );
      });

    // [R-2.5] Cleanup bắt buộc
    return () => controller.abort();
  }, [quoteInput, attempt]);

  // Danh sách mã khuyến mãi thật, không hardcode
  useEffect(() => {
    if (!booking.serviceCode || !booking.packageCode || dates.length === 0) return;
    const controller = new AbortController();

    getVouchers(
      {
        serviceCode: booking.serviceCode,
        packageCode: booking.packageCode,
        sessionCount: dates.length,
      },
      controller.signal,
    )
      .then(setVouchers)
      .catch(() => {
        // Không có khuyến mãi không phải lỗi chặn luồng đặt đơn
        setVouchers([]);
      });

    return () => controller.abort();
  }, [booking.serviceCode, booking.packageCode, dates.length]);

  // Phương thức thanh toán mặc định do backend đánh dấu
  useEffect(() => {
    if (!booking.paymentMethod && paymentOptions.length > 0) {
      onUpdatePaymentMethod((paymentOptions.find((o) => o.isDefault) ?? paymentOptions[0]).value);
    }
  }, [booking.paymentMethod, paymentOptions, onUpdatePaymentMethod]);

  const paymentLabel =
    paymentOptions.find((o) => o.value === booking.paymentMethod)?.label ?? '—';
  const genderLabel =
    genderOptions.find((o) => o.value === booking.recipientGender)?.label ??
    booking.recipientGender;

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await onSubmitOrder();
    } catch (err) {
      setSubmitError(
        err instanceof ApiError ? err : new ApiError('INTERNAL_ERROR', 'Không gửi được yêu cầu'),
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (error) {
    return (
      <div className="w-full max-w-5xl mx-auto py-10 px-4">
        <AppStatus
          inline
          kind={error.code === 'NO_INTERNET' ? 'offline' : 'error'}
          message={error.message}
          onRetry={() => setAttempt((n) => n + 1)}
        />
      </div>
    );
  }

  const pricing = quote?.pricing;
  const firstSession = quote?.sessions?.[0];

  return (
    <div className="w-full max-w-5xl mx-auto py-6 px-4">
      <div className="bg-white rounded-2xl shadow-xl border border-sky-100 p-6 sm:p-8">
        <h2 className="text-xl font-bold text-[#0B2E6B] mb-6 pb-3 border-b border-stone-200">
          {step?.title ?? 'Xác nhận và thanh toán'}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Left Column: Details */}
          <div className="md:col-span-7 space-y-5">
            {/* Address Card */}
            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 flex items-start gap-3">
              <div className="p-2.5 rounded-full bg-red-50 text-[#D42A2A] shrink-0 mt-0.5">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-[#0B2E6B] text-sm">
                    {booking.bookerName} – {booking.bookerPhone}
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 bg-sky-100 text-[#0B2E6B] rounded-md">
                    Địa chỉ làm việc
                  </span>
                </div>
                <p className="text-xs text-stone-700 leading-relaxed">{booking.address}</p>
              </div>
            </div>

            {/* Booker Card */}
            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-full bg-sky-100 text-[#0B2E6B] shrink-0">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs text-stone-500 font-medium block">
                    Người đặt dịch vụ
                  </span>
                  <span className="text-sm font-bold text-[#0B2E6B]">
                    {booking.bookerName} &bull; {booking.bookerPhone}
                  </span>
                </div>
              </div>
            </div>

            {/* Work Information Card — mọi giá trị lấy từ báo giá của backend */}
            <div className="p-5 bg-stone-50 rounded-2xl border border-stone-200 space-y-4">
              <h3 className="text-sm font-bold text-[#0B2E6B] uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-stone-200">
                <Briefcase className="w-4 h-4 text-[#D42A2A]" />
                <span>Thông tin công việc</span>
              </h3>

              <div className="space-y-3 text-xs">
                <div className="flex items-start gap-3">
                  <Calendar className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-stone-600 block">Ngày làm việc:</span>
                    <span className="font-extrabold text-[#0B2E6B] text-sm">
                      {quote
                        ? quote.package.category === 'theo_thang'
                          ? `${quote.package.label} (${pricing?.sessionCount} buổi)`
                          : (quote.firstServiceDate ?? '—')
                        : '—'}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-stone-600 block">Thời gian làm việc:</span>
                    <span className="font-extrabold text-[#0B2E6B] text-sm">
                      {quote && firstSession
                        ? `${firstSession.durationHours} giờ, ${clockOf(firstSession.startsAt)} đến ${clockOf(firstSession.endsAt)}`
                        : '—'}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Briefcase className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-stone-600 block">Chi tiết công việc:</span>
                    <span className="font-extrabold text-[#D42A2A] text-sm">
                      {quote?.service.title ?? booking.selectedService}
                    </span>
                  </div>
                </div>

                {booking.selectedDiseases.length > 0 && (
                  <div className="flex items-start gap-3 pt-2 border-t border-stone-200">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-stone-600 block">
                        Tiền sử bệnh lý người cần chăm:
                      </span>
                      <span className="text-stone-700">
                        {booking.selectedDiseases.length} bệnh lý ({genderLabel},{' '}
                        {booking.recipientAge} tuổi)
                      </span>
                    </div>
                  </div>
                )}

                {/* Service Illustration Banner */}
                <div className="pt-2 border-t border-stone-200">
                  <RemoteImage
                    image={anhXacNhan}
                    alt="Xác nhận dịch vụ chăm sóc SAN"
                    className="w-full h-32 object-cover rounded-xl"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Payment & Confirmation */}
          <div className="md:col-span-5 space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              {/* Payment Details */}
              <div className="p-5 bg-stone-50 rounded-2xl border border-stone-200 space-y-3">
                <h3 className="text-sm font-bold text-[#0B2E6B] uppercase tracking-wider pb-2 border-b border-stone-200">
                  Chi tiết thanh toán
                </h3>

                {!pricing && (
                  <div className="space-y-2" aria-hidden="true">
                    <div className="h-3 w-full bg-stone-200 rounded animate-pulse" />
                    <div className="h-3 w-2/3 bg-stone-200 rounded animate-pulse" />
                  </div>
                )}

                {pricing && (
                  <>
                    <div className="flex items-center justify-between text-xs text-stone-700">
                      <span>
                        Đơn giá × {pricing.sessionCount} buổi:
                      </span>
                      <span className="font-bold">{money(pricing.subtotalAmount)}</span>
                    </div>

                    {pricing.surchargeAmount > 0 && (
                      <div className="flex items-center justify-between text-xs text-stone-700">
                        <span>Phụ phí:</span>
                        <span className="font-bold">{money(pricing.surchargeAmount)}</span>
                      </div>
                    )}

                    {pricing.discountAmount > 0 && (
                      <div className="flex items-center justify-between text-xs text-emerald-700">
                        <span>Khuyến mãi{quote?.voucher ? ` (${quote.voucher.code})` : ''}:</span>
                        <span className="font-bold">-{money(pricing.discountAmount)}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-sm font-extrabold pt-2 border-t border-stone-200">
                      <span className="text-[#0B2E6B]">Tổng thanh toán:</span>
                      <span className="text-[#D42A2A] text-base">
                        {money(pricing.totalAmount)}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Payment Method Options — nguồn: bộ lựa chọn phuong_thuc_thanh_toan */}
              <div className="p-5 bg-stone-50 rounded-2xl border border-stone-200 space-y-3">
                <h3 className="text-sm font-bold text-[#0B2E6B] uppercase tracking-wider">
                  Phương thức thanh toán
                </h3>

                <div className="space-y-2">
                  {paymentOptions.map((opt) => {
                    const isSelected = booking.paymentMethod === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => onUpdatePaymentMethod(opt.value)}
                        className={`w-full p-3 rounded-xl border flex items-center justify-between transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-white border-[#D42A2A]'
                            : 'bg-white border-stone-200 hover:border-red-300'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <Banknote className="w-4 h-4 text-[#D42A2A]" />
                          <span className="text-xs font-bold text-[#D42A2A]">{opt.label}</span>
                        </span>
                        {isSelected && <Check className="w-4 h-4 text-[#D42A2A]" />}
                      </button>
                    );
                  })}
                </div>

                {/* Voucher option — danh sách thật từ /bookings/vouchers */}
                <button
                  type="button"
                  onClick={() => setShowVoucherModal(true)}
                  className="w-full p-3 bg-white rounded-xl border border-stone-200 flex items-center justify-between cursor-pointer hover:border-red-300 transition-colors"
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <Ticket className="w-4 h-4 text-[#D42A2A] shrink-0" />
                    <span className="text-xs font-bold text-[#D42A2A] truncate">
                      {quote?.voucher ? quote.voucher.name : 'Chọn mã khuyến mãi'}
                    </span>
                  </span>
                  <span className="text-xs text-stone-400 shrink-0">
                    {vouchers ? `${vouchers.length} mã` : '...'}
                  </span>
                </button>
              </div>

              {/* Warning Banner */}
              <div className="p-3.5 bg-pink-50 border border-pink-200 rounded-xl flex items-start gap-2.5 text-xs text-[#D42A2A] font-semibold">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <span>Vui lòng kiểm tra thông tin công việc và thanh toán trước khi xác nhận</span>
              </div>

              {submitError && (
                <div role="alert" className="p-3.5 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-xs text-[#D42A2A] font-semibold">{submitError.message}</p>
                </div>
              )}
            </div>

            {/* Total Line & CTA */}
            <div className="space-y-3 pt-4 border-t border-stone-200">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-stone-600">Tổng thanh toán:</span>
                <span className="text-lg font-black text-[#D42A2A]">
                  {pricing ? money(pricing.totalAmount) : '—'}
                </span>
              </div>

              <button
                onClick={handleSubmit}
                disabled={!pricing || submitting}
                className="w-full py-4 px-6 bg-[#D42A2A] hover:bg-red-700 text-white font-extrabold uppercase tracking-wide text-base rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting && <Loader2 className="w-5 h-5 animate-spin" />}
                <span>{submitting ? 'ĐANG GỬI...' : 'ĐĂNG YÊU CẦU'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Voucher Selection Modal */}
      {showVoucherModal && (
        // [R-2.4] Không dùng backdrop-filter
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="voucher-title"
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 id="voucher-title" className="text-base font-bold text-[#0B2E6B]">
                Chọn mã khuyến mãi
              </h3>
              <button
                type="button"
                onClick={() => setShowVoucherModal(false)}
                aria-label="Đóng"
                className="p-1 rounded-lg hover:bg-stone-100 cursor-pointer"
              >
                <X className="w-4 h-4 text-stone-500" />
              </button>
            </div>

            <div className="space-y-2">
              {vouchers === null && (
                <div className="h-12 rounded-xl bg-stone-100 animate-pulse" aria-hidden="true" />
              )}

              {vouchers?.length === 0 && (
                <p className="text-xs text-stone-500 text-center py-6">
                  Hiện chưa có mã khuyến mãi khả dụng.
                </p>
              )}

              {vouchers?.map((v) => {
                const usable = Boolean(v.usable);
                return (
                  <button
                    key={v.code}
                    type="button"
                    disabled={!usable}
                    onClick={() => {
                      onUpdateVoucher(v.code);
                      setShowVoucherModal(false);
                    }}
                    className={`w-full p-3 border rounded-xl text-left text-xs font-bold flex justify-between items-center gap-3 ${
                      usable
                        ? 'bg-stone-50 hover:bg-sky-50 border-stone-200 text-[#0B2E6B] cursor-pointer'
                        : 'bg-stone-50 border-stone-200 text-stone-400 cursor-not-allowed'
                    }`}
                  >
                    <span className="min-w-0">
                      <span className="block truncate">{v.name}</span>
                      <span className="block text-[10px] font-medium text-stone-500 truncate">
                        {v.code}
                        {!usable && v.reason ? ` — ${v.reason}` : ''}
                      </span>
                    </span>
                    <span className="text-[#D42A2A] shrink-0">-{money(v.discountAmount)}</span>
                  </button>
                );
              })}
            </div>

            {booking.voucher && (
              <button
                type="button"
                onClick={() => {
                  onUpdateVoucher('');
                  setShowVoucherModal(false);
                }}
                className="w-full py-2 bg-stone-200 text-stone-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Bỏ mã khuyến mãi
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
