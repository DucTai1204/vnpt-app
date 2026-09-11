import React, { useEffect, useMemo, useState } from 'react';
import {
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileText,
  Package,
  ShieldAlert,
  XCircle,
} from 'lucide-react';
import { useSetting, useStep } from '../api/BootstrapContext';
import {
  ApiError,
  ApiMonthlyPlan,
  ApiPackage,
  ApiTimeSlotGroup,
  getMonthlyPlans,
  getPackages,
  getTimeSlots,
} from '../api/client';
import { AddressCard } from './AddressCard';
import { AppStatus } from './AppStatus';
import { CommitmentFooter } from './CommitmentFooter';
import { MonthCalendar } from './MonthCalendar';
import { ScreenHeader } from './ScreenHeader';

interface Step5BProps {
  bookerName: string;
  bookerPhone: string;
  address: string;
  serviceCode: string;
  selectedService: string;
  selectedDuration: string;
  monthlyType: string;
  selectedDates: string[];
  startTime: string;
  notes: string;
  onUpdateDuration: (label: string, packageCode: string) => void;
  onUpdateMonthlyType: (label: string, planCode: string) => void;
  onToggleDate: (dateStr: string) => void;
  onUpdateStartTime: (timeStr: string) => void;
  onUpdateNotes: (notes: string) => void;
  onNext: () => void;
  onChangeAddress: () => void;
  onBack: () => void;
}

/** 3 thẻ thông tin trong thiết kế gói tháng — hiện là mục tĩnh, chưa nối API. */
const INFO_CARDS = [
  { key: 'se_lam', Icon: CheckCircle2, tone: 'text-emerald-500', label: 'Việc Cô SAN sẽ làm' },
  { key: 'khong_lam', Icon: XCircle, tone: 'text-accent', label: 'Việc Cô SAN Không làm' },
  { key: 'su_co', Icon: ShieldAlert, tone: 'text-amber-500', label: 'Có sự cố – SAN không trốn!' },
];

export const Step5BDateTimeMonthly: React.FC<Step5BProps> = ({
  bookerName,
  bookerPhone,
  address,
  serviceCode,
  selectedService,
  selectedDuration,
  monthlyType,
  selectedDates,
  startTime,
  notes,
  onUpdateDuration,
  onUpdateMonthlyType,
  onToggleDate,
  onUpdateStartTime,
  onUpdateNotes,
  onNext,
  onChangeAddress,
  onBack,
}) => {
  const step = useStep('step5b');
  const leadHours = useSetting('dat_lich.so_gio_dat_truoc', 2);
  const maxMonths = useSetting('dat_lich.so_thang_toi_da', 3);

  const [hourPackages, setHourPackages] = useState<ApiPackage[] | null>(null);
  const [plans, setPlans] = useState<ApiMonthlyPlan[] | null>(null);
  const [slotGroups, setSlotGroups] = useState<ApiTimeSlotGroup[] | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!serviceCode) return;
    const controller = new AbortController();
    setError(null);

    Promise.all([
      getPackages(serviceCode, 'theo_ngay', controller.signal),
      getMonthlyPlans(serviceCode, controller.signal),
      getTimeSlots(controller.signal),
    ])
      .then(([pkgs, p, slots]) => {
        setHourPackages(pkgs);
        setPlans(p);
        setSlotGroups(slots);
      })
      .catch((err: unknown) => {
        if ((err as Error)?.name === 'AbortError') return;
        setError(
          err instanceof ApiError ? err : new ApiError('INTERNAL_ERROR', 'Không tải được gói tháng'),
        );
      });

    // [R-2.5] Cleanup bắt buộc
    return () => controller.abort();
  }, [serviceCode, attempt]);

  const currentPlan = useMemo(
    () => plans?.find((p) => p.label === monthlyType) ?? null,
    [plans, monthlyType],
  );

  /**
   * Gói tháng = kỳ hạn (1/2 tháng) × số giờ mỗi buổi. Chọn thời lượng hoặc đổi
   * kỳ hạn đều phải tính lại mã gói thật để gửi lên /bookings.
   */
  const resolvePackageCode = (planLabel: string, hours: number) => {
    const plan = plans?.find((p) => p.label === planLabel);
    return plan?.packages.find((pk) => pk.durationHours === hours)?.code ?? '';
  };

  const selectedHours = useMemo(
    () => hourPackages?.find((p) => p.label === selectedDuration)?.durationHours ?? 0,
    [hourPackages, selectedDuration],
  );

  // Mặc định: thời lượng đầu tiên + kỳ hạn đầu tiên backend trả về
  useEffect(() => {
    if (!selectedDuration && hourPackages?.length) {
      onUpdateDuration(hourPackages[0].label, '');
    }
  }, [hourPackages, selectedDuration, onUpdateDuration]);

  useEffect(() => {
    if (!monthlyType && plans?.length) {
      onUpdateMonthlyType(plans[0].label, '');
    }
  }, [plans, monthlyType, onUpdateMonthlyType]);

  // Đủ cả kỳ hạn và số giờ -> chốt mã gói
  useEffect(() => {
    if (!monthlyType || !selectedHours) return;
    const code = resolvePackageCode(monthlyType, selectedHours);
    if (code) onUpdateMonthlyType(monthlyType, code);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthlyType, selectedHours, plans]);

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

  const slots = useMemo(() => (slotGroups ?? []).flatMap((g) => g.slots), [slotGroups]);

  /** yyyy-mm-dd của hôm nay theo giờ máy — cùng cách tính với `toIso` trong MonthCalendar. */
  const todayIso = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  /**
   * [R] Một khung giờ áp dụng cho MỌI ngày đã chọn của gói tháng. Chỉ cần kiểm
   * so với HÔM NAY: nếu hôm nay nằm trong danh sách ngày đã chọn thì buổi hôm
   * nay phải còn cách hiện tại ít nhất `leadHours`; các ngày tương lai khác
   * không bao giờ bị chặn bởi mốc này nên không cần xét.
   */
  const isSlotTooSoon = (value: string) => {
    if (!selectedDates.includes(todayIso)) return false;
    const [h, m] = value.split(':').map(Number);
    const when = new Date(`${todayIso}T00:00:00`);
    when.setHours(h, m, 0, 0);
    return when < earliest;
  };

  /** Ẩn hẳn khung giờ quá gần thay vì hiện mờ. */
  const visibleSlots = useMemo(
    () => slots.filter((s) => !isSlotTooSoon(s.value)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [slots, selectedDates, earliest, todayIso],
  );

  // Giờ đề xuất do backend đánh dấu (la_mac_dinh) — chỉ tự chọn khi nó THẬT SỰ
  // còn đặt được; không thì để trống buộc khách tự chọn, không đoán thay.
  useEffect(() => {
    if (startTime || !visibleSlots.length) return;
    const def = visibleSlots.find((s) => s.isDefault) ?? null;
    if (def) onUpdateStartTime(def.value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleSlots, startTime, onUpdateStartTime]);

  // Thêm HÔM NAY vào ngày đã chọn mà giờ đang chọn thành quá gần -> bỏ chọn
  useEffect(() => {
    if (startTime && isSlotTooSoon(startTime)) onUpdateStartTime('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDates, earliest]);

  const minSessions = currentPlan?.minSessions ?? 0;
  const enough = selectedDates.length >= minSessions && selectedDates.length > 0;

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

  return (
    <div className="w-full max-w-6xl mx-auto py-4 px-4 space-y-4">
      <ScreenHeader title={step?.title ?? 'Chọn ngày & giờ'} onBack={onBack} />

      <AddressCard
        name={bookerName}
        phone={bookerPhone}
        address={address}
        onEdit={onChangeAddress}
      />

      {/* Chọn thời lượng + Loại gói + 3 thẻ thông tin */}
      <section className="bg-white rounded-2xl border border-hairline p-5 space-y-5">
        <h2 className="flex items-center gap-2.5 text-base font-bold text-navy">
          <Clock className="w-5 h-5 text-brand" />
          <span>Chọn thời lượng</span>
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {hourPackages === null &&
            Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="h-21.5 rounded-xl bg-canvas animate-pulse" aria-hidden="true" />
            ))}

          {hourPackages?.map((opt) => {
            const isSelected = selectedDuration === opt.label;
            return (
              <button
                key={opt.code}
                type="button"
                aria-pressed={isSelected}
                onClick={() =>
                  onUpdateDuration(opt.label, resolvePackageCode(monthlyType, opt.durationHours))
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
          <h3 className="flex items-center gap-2.5 text-base font-bold text-navy mb-3">
            <Package className="w-5 h-5 text-brand" />
            <span>Loại gói</span>
          </h3>

          {plans === null ? (
            <div className="grid grid-cols-2 gap-4" aria-hidden="true">
              <div className="h-12 rounded-xl bg-canvas animate-pulse" />
              <div className="h-12 rounded-xl bg-canvas animate-pulse" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {plans.map((plan) => {
                const isSelected = monthlyType === plan.label;
                return (
                  <button
                    key={plan.durationMonths}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() =>
                      onUpdateMonthlyType(
                        plan.label,
                        resolvePackageCode(plan.label, selectedHours),
                      )
                    }
                    className={`h-12 rounded-xl text-sm font-bold transition-colors cursor-pointer border ${
                      isSelected
                        ? 'border-brand bg-brand-surface text-brand-text'
                        : 'border-hairline bg-white text-navy hover:border-brand-border'
                    }`}
                  >
                    {plan.label}
                    {plan.minSessions ? (
                      <span className="block text-[11px] font-medium text-muted">
                        Tối thiểu {plan.minSessions} buổi
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {INFO_CARDS.map(({ key, Icon, tone, label }) => (
            <div
              key={key}
              className="rounded-xl border border-hairline bg-white px-4 py-3 flex items-center gap-3"
            >
              <Icon className={`w-6 h-6 shrink-0 ${tone}`} />
              <span className="flex-1 text-sm font-semibold text-navy leading-tight">{label}</span>
              <ChevronRight className="w-4 h-4 text-brand shrink-0" />
            </div>
          ))}
        </div>
      </section>

      {/* Chọn ngày làm việc | Chọn giờ + Ghi chú */}
      <section className="bg-white rounded-2xl border border-hairline p-5">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
          <div>
            <MonthCalendar
              title="Chọn ngày làm việc"
              multiple
              selected={selectedDates}
              minDate={earliest}
              maxDate={maxDate}
              onPick={onToggleDate}
            />

            {minSessions > 0 && selectedDates.length < minSessions && (
              <p className="mt-3 text-xs font-semibold text-accent">
                Gói này cần tối thiểu {minSessions} buổi — bạn đang chọn {selectedDates.length}.
              </p>
            )}
          </div>

          <div className="lg:border-l border-hairline lg:pl-10 space-y-5">
            <div>
              <h3 className="flex items-center gap-2.5 text-base font-bold text-navy mb-3">
                <Clock className="w-5 h-5 text-brand" />
                <span>Chọn giờ bắt đầu</span>
              </h3>

              {slotGroups === null ? (
                <div className="grid grid-cols-4 gap-3" aria-hidden="true">
                  {Array.from({ length: 16 }, (_, i) => (
                    <div key={i} className="h-11 rounded-xl bg-canvas animate-pulse" />
                  ))}
                </div>
              ) : visibleSlots.length === 0 ? (
                // Chỉ rơi vào đây khi HÔM NAY nằm trong ngày đã chọn và đã qua
                // hết khung giờ còn nhận trong ngày.
                <p className="text-sm text-muted bg-canvas rounded-xl px-4 py-3">
                  Đã hết khung giờ còn nhận cho hôm nay. Vui lòng bỏ hôm nay khỏi lịch hoặc chọn thêm
                  ngày khác ở mục &quot;Chọn ngày làm việc&quot;.
                </p>
              ) : (
                <div className="grid grid-cols-4 gap-3">
                  {visibleSlots.map((slot) => {
                    const isSelected = startTime === slot.value;
                    return (
                      <button
                        key={slot.value}
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => onUpdateStartTime(slot.value)}
                        className={`h-11 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 border transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-brand border-brand text-white'
                            : 'bg-white border-hairline text-navy hover:border-brand-border'
                        }`}
                      >
                        {isSelected && <Check className="w-4 h-4" />}
                        <span>{slot.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div>
              <label htmlFor="notes" className="flex items-center gap-2.5 text-base font-bold text-navy">
                <FileText className="w-5 h-5 text-brand" />
                <span>
                  Ghi chú<span className="text-accent">*</span>
                </span>
              </label>
              <p className="text-xs text-muted mt-1 mb-2">
                Ghi chú này giúp nhân viên làm việc thuận tiện hơn
              </p>
              <textarea
                id="notes"
                rows={3}
                value={notes}
                onChange={(e) => onUpdateNotes(e.target.value)}
                placeholder="Nhập nội dung"
                className="w-full rounded-xl border border-hairline bg-white px-4 py-3 text-sm text-ink placeholder:text-slate-400 focus:outline-none focus:border-brand transition-colors resize-none"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Tóm tắt loại gói */}
      <div className="bg-white rounded-2xl border border-hairline px-5 py-4 flex items-center gap-4">
        <Package className="w-5 h-5 text-brand shrink-0" />
        <span className="text-sm font-bold text-navy">Loại gói</span>
        <span className="text-sm text-navy-soft">
          {selectedDuration || '…'} / {monthlyType || '…'}
        </span>
        <span className="text-sm text-navy-soft truncate">{selectedService}</span>
      </div>

      {/* CTA */}
      <div className="bg-white rounded-2xl border border-hairline p-5 space-y-2">
        <button
          type="button"
          onClick={onNext}
          disabled={!monthlyType || !startTime || !enough}
          className="w-full h-14 rounded-xl bg-brand hover:bg-brand-dark text-white text-lg font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <span>Tiếp tục</span>
          <ChevronRight className="w-5 h-5" />
        </button>
        <p className="text-center text-xs text-muted">Bước tiếp theo: Thông tin sức khỏe</p>
      </div>

      <CommitmentFooter />
    </div>
  );
};
