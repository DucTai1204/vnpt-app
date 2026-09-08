import React, { useEffect } from 'react';
import { User, Phone, MapPin, Map, Check } from 'lucide-react';
import { useOptions, useStep } from '../api/BootstrapContext';

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
}

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
}) => {
  const step = useStep('step3');
  const locationOptions = useOptions('loai_dia_diem');

  // Mặc định do backend đánh dấu, FE không gán cứng 'Nhà riêng'
  useEffect(() => {
    if (!locationType && locationOptions.length > 0) {
      onUpdateLocationType((locationOptions.find((o) => o.isDefault) ?? locationOptions[0]).value);
    }
  }, [locationType, locationOptions, onUpdateLocationType]);

  return (
    <div className="w-full max-w-4xl mx-auto py-6 px-4">
      <div className="bg-white rounded-2xl shadow-xl border border-sky-100 p-6 sm:p-8">
        <h2 className="text-xl font-bold text-[#0B2E6B] mb-6 flex items-center gap-2 pb-3 border-b border-stone-200">
          <MapPin className="w-5 h-5 text-[#D42A2A]" />
          <span>{step?.title ?? 'Cập nhật địa chỉ'}</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Left Column: Thông tin người đặt */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-[#0B2E6B] uppercase tracking-wider pb-1 border-b border-stone-100">
              Thông tin người đặt
            </h3>

            {/* Booker Name */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Họ và tên người đặt
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={bookerName}
                  onChange={(e) => onUpdateName(e.target.value)}
                  placeholder="Nhập tên người đặt"
                  className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm font-medium text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#0B2E6B] focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Booker Phone */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Số điện thoại liên hệ
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  value={bookerPhone}
                  onChange={(e) => onUpdatePhone(e.target.value)}
                  placeholder="Nhập số điện thoại"
                  className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm font-medium text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#0B2E6B] focus:bg-white transition-all"
                />
              </div>
            </div>
          </div>

          {/* Right Column: Địa chỉ người cần chăm */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-1 border-b border-stone-100">
              <h3 className="text-sm font-bold text-[#0B2E6B] uppercase tracking-wider">
                Địa chỉ người cần chăm
              </h3>
              <button
                type="button"
                onClick={() => alert('Đã mở vị trí bản đồ giả lập')}
                className="text-xs font-bold text-[#0B2E6B] hover:text-[#D42A2A] flex items-center gap-1 cursor-pointer"
              >
                <Map className="w-3.5 h-3.5" />
                <span>Chọn trên bản đồ</span>
              </button>
            </div>

            {/* Address Textarea */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Địa chỉ chi tiết (Số nhà, đường, phường/xã, quận/huyện)
              </label>
              <textarea
                rows={3}
                value={address}
                onChange={(e) => onUpdateAddress(e.target.value)}
                placeholder="Nhập địa chỉ đầy đủ"
                className="w-full p-3 bg-stone-50 border border-stone-300 rounded-xl text-sm font-medium text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#0B2E6B] focus:bg-white transition-all resize-none"
              />
            </div>

            {/* Location Type Pills */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-2">
                Địa điểm
              </label>
              <div className="flex items-center gap-2">
                {locationOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    aria-pressed={locationType === opt.value}
                    onClick={() => onUpdateLocationType(opt.value)}
                    className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                      locationType === opt.value
                        ? 'bg-sky-50 text-[#0B2E6B] border-2 border-[#0B2E6B] shadow-xs'
                        : 'bg-stone-100 text-stone-600 border border-stone-200 hover:bg-stone-200'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Default Address Checkbox */}
            <div className="pt-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-stone-700">
                <input
                  type="checkbox"
                  checked={isDefaultAddress}
                  onChange={(e) => onUpdateDefault(e.target.checked)}
                  className="w-4 h-4 rounded-md accent-emerald-600 cursor-pointer"
                />
                <span className="flex items-center gap-1 text-emerald-800 font-bold">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  Đặt làm địa chỉ mặc định
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* CTA Navy Button */}
        <button
          onClick={onNext}
          disabled={!address.trim() || !bookerName.trim() || !bookerPhone.trim()}
          className="w-full py-3.5 px-6 bg-[#0B2E6B] hover:bg-[#082252] text-white font-bold rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Lưu &amp; Tiếp tục
        </button>
      </div>
    </div>
  );
};
