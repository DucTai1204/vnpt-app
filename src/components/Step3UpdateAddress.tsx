import React, { useEffect } from 'react';
import { Check, Map } from 'lucide-react';
import { useOptions, useStep } from '../api/BootstrapContext';
import { ScreenHeader } from './ScreenHeader';

interface Step3Props {
  bookerName: string;
  bookerPhone: string;
  address: string;
  /** Giá trị thuộc bộ lựa chọn `loai_dia_diem` của backend. */
  locationType: string;
  isDefaultAddress: boolean;
  onUpdateName: (name: string) => void;
  onUpdatePhone: (phone: string) => void;
  onUpdateAddress: (address: string) => void;
  onUpdateLocationType: (type: string) => void;
  onUpdateDefault: (isDefault: boolean) => void;
  onNext: () => void;
  onBack: () => void;
}

/**
 * Cập nhật địa chỉ — dựng theo "4-man hinh them dia chi 1280 x 800".
 *
 * Bố cục: header back + tiêu đề, dưới là hai thẻ trắng cạnh nhau (thông tin
 * người đặt | địa chỉ người cần chăm), cuối cùng là nút "Lưu" xanh tràn ngang.
 * Thiết kế không có icon trong ô nhập và không có thanh tiến trình.
 */
export const Step3UpdateAddress: React.FC<Step3Props> = ({
  bookerName,
  bookerPhone,
  address,
  locationType,
  isDefaultAddress,
  onUpdateName,
  onUpdatePhone,
  onUpdateAddress,
  onUpdateLocationType,
  onUpdateDefault,
  onNext,
  onBack,
}) => {
  const step = useStep('step3');
  const locationOptions = useOptions('loai_dia_diem');

  // Mặc định do backend đánh dấu, FE không gán cứng 'Nhà riêng'
  useEffect(() => {
    if (!locationType && locationOptions.length > 0) {
      onUpdateLocationType((locationOptions.find((o) => o.isDefault) ?? locationOptions[0]).value);
    }
  }, [locationType, locationOptions, onUpdateLocationType]);

  const inputClass =
    'w-full px-4 py-3 bg-white border border-hairline rounded-xl text-base text-ink ' +
    'placeholder:text-slate-400 focus:outline-none focus:border-brand transition-colors';

  return (
    <div className="w-full max-w-6xl mx-auto py-6 px-4">
      <ScreenHeader
        title={step?.title ?? 'Cập nhật địa chỉ'}
        onBack={onBack}
        showHotline={Boolean(step?.showHotline)}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
        {/* Trái: thông tin người đặt */}
        <div className="bg-white rounded-2xl border border-hairline p-5 sm:p-6 space-y-4">
          <h2 className="text-lg font-bold text-navy">Thông tin người đặt</h2>

          <div>
            <label className="sr-only" htmlFor="booker-name">
              Họ và tên người đặt
            </label>
            <input
              id="booker-name"
              type="text"
              value={bookerName}
              onChange={(e) => onUpdateName(e.target.value)}
              placeholder="Họ và tên người đặt"
              className={inputClass}
            />
          </div>

          <div>
            <label className="sr-only" htmlFor="booker-phone">
              Số điện thoại liên hệ
            </label>
            <input
              id="booker-phone"
              type="tel"
              inputMode="numeric"
              value={bookerPhone}
              onChange={(e) => onUpdatePhone(e.target.value)}
              placeholder="Số điện thoại liên hệ"
              className={inputClass}
            />
          </div>
        </div>

        {/* Phải: địa chỉ người cần chăm */}
        <div className="bg-white rounded-2xl border border-hairline p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h2 className="text-lg font-bold text-navy">Địa chỉ người cần chăm</h2>
            <button
              type="button"
              onClick={() => alert('Đã mở vị trí bản đồ giả lập')}
              className="flex items-center gap-1.5 text-sm font-semibold text-brand-text cursor-pointer hover:underline"
            >
              <Map className="w-4 h-4" />
              <span>Chọn trên bản đồ</span>
            </button>
          </div>

          <div>
            <label className="sr-only" htmlFor="address">
              Địa chỉ chi tiết
            </label>
            <textarea
              id="address"
              rows={2}
              value={address}
              onChange={(e) => onUpdateAddress(e.target.value)}
              placeholder="Số nhà, đường, phường/xã, tỉnh/thành phố"
              className={`${inputClass} resize-none leading-relaxed`}
            />
          </div>

          <div>
            <p className="text-base font-bold text-navy mb-2">Địa điểm</p>
            {/* Nguồn: bộ lựa chọn `loai_dia_diem` của backend, không gán cứng */}
            <div className="grid grid-cols-3 gap-3">
              {locationOptions.map((opt) => {
                const on = locationType === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    aria-pressed={on}
                    onClick={() => onUpdateLocationType(opt.value)}
                    className={`h-12 rounded-xl text-base font-medium transition-colors cursor-pointer border ${
                      on
                        ? 'bg-pill-surface text-pill-on border-brand'
                        : 'bg-white text-ink border-hairline hover:border-brand-border'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer w-fit">
            <span
              className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors ${
                isDefaultAddress ? 'bg-check-green' : 'bg-white border border-hairline'
              }`}
            >
              {isDefaultAddress && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
            </span>
            <input
              type="checkbox"
              checked={isDefaultAddress}
              onChange={(e) => onUpdateDefault(e.target.checked)}
              className="sr-only"
            />
            <span className="text-base text-ink">Địa chỉ mặc định</span>
          </label>
        </div>
      </div>

      <button
        onClick={onNext}
        disabled={!address.trim() || !bookerName.trim() || !bookerPhone.trim()}
        className="w-full h-14 rounded-xl bg-cta-blue hover:bg-cta-blue-dark text-white text-lg font-bold shadow-md transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Lưu
      </button>
    </div>
  );
};
