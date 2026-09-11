import React, { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Check, ChevronRight, Clock, Heart, XCircle, CheckCircle2 } from 'lucide-react';
import { useSetting, useStep } from '../api/BootstrapContext';
import { ApiError, ApiPackage, ApiTimeSlotGroup, getPackages, getTimeSlots } from '../api/client';
import { DurationOption } from '../types';
import { AddressCard } from './AddressCard';
import { AppStatus } from './AppStatus';
import { CommitmentFooter } from './CommitmentFooter';
import { MonthCalendar } from './MonthCalendar';
import { ScreenHeader } from './ScreenHeader';

interface Step5AProps {
  bookerName: string;
  bookerPhone: string;
  address: string;
  serviceCode: string;
  selectedDuration: string;
  selectedDate: string;
  startTime: string;
  onUpdateDuration: (opt: DurationOption) => void;
  onUpdateDate: (dateStr: string) => void;
  onUpdateStartTime: (timeStr: string) => void;
  onNext: () => void;
  onChangeAddress: () => void;
  onBack: () => void;
}

/** 3 thẻ "Tùy chọn" trong thiết kế — hiện là mục thông tin, chưa nối API. */
const OPTION_CARDS = [
  { key: 'yeu_thich', Icon: Heart, tone: 'text-pink-500', label: 'Ưu tiên nhân viên\nyêu thích', badge: 'San Now' },
  { key: 'se_lam', Icon: CheckCircle2, tone: 'text-emerald-500', label: 'Việc Có SAN\nsẽ làm', badge: null },
  { key: 'khong_lam', Icon: XCircle, tone: 'text-accent', label: 'Việc Có SAN\nkhông làm', badge: null },
];

export const Step5ADateTimeDaily: React.FC<Step5AProps> = ({
  bookerName,
  bookerPhone,
  address,
  serviceCode,
  selectedDuration,
  selectedDate,
  startTime,
  onUpdateDuration,
  onUpdateDate,
  onUpdateStartTime,
  onNext,
  onChangeAddress,
  onBack,
}) => {
  const step = useStep('step5a');
  const leadHours = useSetting('dat_lich.so_gio_dat_truoc', 2);
  const maxMonths = useSetting('dat_lich.so_thang_toi_da', 3);

  const [packages, setPackages] = useState<ApiPackage[] | null>(null);
  const [slotGroups, setSlotGroups] = useState<ApiTimeSlotGroup[] | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!serviceCode) return;
    const controller = new AbortController();
    setError(null);

    Promise.all([
      getPackages(serviceCode, 'theo_ngay', controller.signal),
      getTimeSlots(controller.signal),
    ])
      .then(([pkgs, slots]) => {
        setPackages(pkgs);
        setSlotGroups(slots);
      })
      .catch((err: unknown) => {
        if ((err as Error)?.name === 'AbortError') return;
        setError(
          err instanceof ApiError ? err : new ApiError('INTERNAL_ERROR', 'Không tải được bảng giá'),
        );
      });

    // [R-2.5] Cleanup bắt buộc
    return () => controller.abort();
  }, [serviceCode, attempt]);

  // Gói và khung giờ mặc định do backend đánh dấu
  useEffect(() => {
    if (!selectedDuration && packages?.length) {
      const p = packages[0];
      onUpdateDuration({
        code: p.code,
        label: p.label,
        sublabel: p.sublabel ?? '',
        hours: p.durationHours,
        price: p.price,
      });
    }
  }, [packages, selectedDuration, onUpdateDuration]);

  const currentPackage = useMemo(
    () => packages?.find((p) => p.label === selectedDuration) ?? null,
    [packages, selectedDuration],
  );

  /** [R] Không cho đặt sớm hơn `dat_lich.so_gio_dat_truoc` giờ kể từ bây giờ. */
  const earliest = useMemo(() => {
    const d = new Date();
    d.setHours(d.getHours() + Number(leadHours || 0));
    return d;
  }, [leadHours]);

  const maxDate = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + Number(maxMonths || 3));
    return d;
  }, [maxMonths]);

  /** Khung giờ phẳng 4 cột như thiết kế; giờ quá gần hiện mờ và không bấm được. */
  const slots = useMemo(
    () => (slotGroups ?? []).flatMap((g) => g.slots),
    [slotGroups],
  );

  const isSlotTooSoon = (value: string) => {
    if (!selectedDate) return false;
    const [h, m] = value.split(':').map(Number);
    const when = new Date(`${selectedDate}T00:00:00`);
    when.setHours(h, m, 0, 0);
    return when < earliest;
  };

  // Giờ mặc định: khung đầu tiên còn đặt được
  useEffect(() => {
    if (startTime || !slots.length || !selectedDate) return;
    const usable = slots.find((s) => !isSlotTooSoon(s.value));
    if (usable) onUpdateStartTime(usable.value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slots, startTime, selectedDate]);

  // Đổi ngày mà giờ đang chọn thành quá gần -> bỏ chọn để buộc chọn lại
  useEffect(() => {
    if (startTime && isSlotTooSoon(startTime)) onUpdateStartTime('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  if (error) {
    return (
      <div className="w-full max-w-6xl mx-auto py-6 px-4">
        <AppStatus
          inline
          kind={error.code === 'NO_INTERNET' ? 'offline' : 'error'}
          message={error.message}
          onRetry={() => setAttempt((n) => n + 1)}
        />
      </div>
    );
  }

  const ready = Boolean(currentPackage && selectedDate && startTime);

  return (
    <div className="w-full max-w-6xl mx-auto py-4 px-4 space-y-4">
      <ScreenHeader title={step?.title ?? 'Chọn ngày & giờ'} onBack={onBack} />

      <AddressCard
        name={bookerName}
        phone={bookerPhone}
        address={address}
        onEdit={onChangeAddress}
      />

      {/* Chọn thời lượng gói + Tùy chọn */}
      <section className="bg-white rounded-2xl border border-hairline p-5 space-y-5">
        <h2 className="flex items-center gap-2.5 text-base font-bold text-navy">
          <Clock className="w-5 h-5 text-brand" />
          <span>Chọn thời lượng gói</span>
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {packages === null &&
            Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="h-21.5 rounded-xl bg-canvas animate-pulse" aria-hidden="true" />
            ))}

          {packages?.map((opt) => {
            const isSelected = selectedDuration === opt.label;
            return (
              <button
                key={opt.code}
                type="button"
                aria-pressed={isSelected}
                onClick={() =>
                  onUpdateDuration({
                    code: opt.code,
                    label: opt.label,
                    sublabel: opt.sublabel ?? '',
                    hours: opt.durationHours,
                    price: opt.price,
                  })
                }
                className={`rounded-xl px-4 py-4 text-center transition-colors cursor-pointer border ${
                  isSelected
                    ? 'border-brand bg-brand-surface'
                    : 'border-hairline bg-white hover:border-brand-border'
                }`}
              >
                <span
                  className={`block text-base font-bold ${isSelected ? 'text-brand-text' : 'text-navy'}`}
                >
                  {opt.label}
                </span>
                <span className="block text-sm text-navy-soft mt-0.5">{opt.sublabel}</span>
              </button>
            );
          })}
        </div>

        <div>
          <p className="text-xs font-semibold text-muted mb-2">Tùy chọn</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {OPTION_CARDS.map(({ key, Icon, tone, label, badge }) => (
              <div
                key={key}
                className="relative rounded-xl border border-hairline bg-white px-4 py-3 flex items-center gap-3"
              >
                <Icon className={`w-6 h-6 shrink-0 ${tone}`} />
                <span className="flex-1 text-sm font-semibold text-navy leading-tight whitespace-pre-line">
                  {label}
                </span>
                <ChevronRight className="w-4 h-4 text-brand shrink-0" />
                {badge && (
                  <span className="absolute -top-2 right-8 bg-accent text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                    {badge}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Chọn ngày | Chọn giờ */}
      <section className="bg-white rounded-2xl border border-hairline p-5">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
          <div>
            <MonthCalendar
              title="1. Chọn ngày"
              selected={selectedDate ? [selectedDate] : []}
              minDate={earliest}
              maxDate={maxDate}
              onPick={onUpdateDate}
            />
          </div>

          <div className="lg:border-l border-hairline lg:pl-10">
            <h3 className="flex items-center gap-2.5 text-base font-bold text-navy mb-3">
              <Clock className="w-5 h-5 text-accent" />
              <span>2. Chọn giờ bắt đầu</span>
            </h3>

            {slotGroups === null ? (
              <div className="grid grid-cols-4 gap-3" aria-hidden="true">
                {Array.from({ length: 16 }, (_, i) => (
                  <div key={i} className="h-11 rounded-xl bg-canvas animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-3">
                {slots.map((slot) => {
                  const isSelected = startTime === slot.value;
                  const tooSoon = isSlotTooSoon(slot.value);
                  return (
                    <button
                      key={slot.value}
                      type="button"
                      disabled={tooSoon}
                      aria-pressed={isSelected}
                      onClick={() => onUpdateStartTime(slot.value)}
                      className={`h-11 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 border transition-colors ${
                        isSelected
                          ? 'bg-brand border-brand text-white cursor-pointer'
                          : tooSoon
                            ? 'bg-white border-hairline text-slate-300 cursor-not-allowed'
                            : 'bg-white border-hairline text-navy hover:border-brand-border cursor-pointer'
                      }`}
                    >
                      {isSelected && <Check className="w-4 h-4" />}
                      <span>{slot.label}</span>
                    </button>
                  );
                })}
              </div>
            )}

            <p className="mt-4 flex items-start gap-2.5 rounded-xl bg-brand-surface px-4 py-3">
              <Clock className="w-4 h-4 text-accent shrink-0 mt-0.5" />
              <span className="text-xs text-navy">
                Khách hàng chọn thời gian muốn bắt đầu ca làm
              </span>
            </p>
          </div>
        </div>
      </section>

      {/* Tóm tắt */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-hairline px-5 py-4 flex items-center gap-3">
          <CalendarDays className="w-5 h-5 text-brand shrink-0" />
          <span className="min-w-0">
            <span className="block text-xs text-muted">Tóm tắt lựa chọn</span>
            <span className="block text-sm font-bold text-navy truncate">
              {selectedDate && startTime ? `${selectedDate} • ${startTime}` : 'Chưa chọn ngày giờ'}
            </span>
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-hairline px-5 py-4 flex items-center gap-3">
          <Clock className="w-5 h-5 text-brand shrink-0" />
          <span>
            <span className="block text-xs text-muted">Thời lượng gợi ý</span>
            <span className="block text-sm font-bold text-navy">
              {currentPackage ? `${currentPackage.durationHours} tiếng` : '—'}
            </span>
          </span>
        </div>
      </div>

      {/* CTA */}
      <div className="bg-white rounded-2xl border border-hairline p-5 space-y-2">
        <button
          type="button"
          onClick={onNext}
          disabled={!ready}
          className="w-full h-14 rounded-xl bg-brand hover:bg-brand-dark text-white text-lg font-bold transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Tiếp tục
        </button>
        <p className="text-center text-xs text-muted">Bước tiếp theo: Thông tin sức khỏe</p>
      </div>

      <CommitmentFooter />
    </div>
  );
};
