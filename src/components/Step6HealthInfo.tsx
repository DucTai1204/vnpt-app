import React, { useEffect, useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { useOptions } from '../api/BootstrapContext';
import { ApiDisease, ApiError, getDiseases } from '../api/client';
import { AppStatus } from './AppStatus';

interface Step6Props {
  /** Giá trị thuộc bộ lựa chọn `gioi_tinh` của backend. */
  gender: string;
  age: number;
  /** Mã bệnh lý (benh_ly.ma). */
  selectedDiseases: string[];
  saveForNext: boolean;
  onUpdateGender: (gender: string) => void;
  onUpdateAge: (age: number) => void;
  onToggleDisease: (diseaseCode: string) => void;
  onUpdateSaveForNext: (save: boolean) => void;
  onNext: () => void;
  onBack: () => void;
}

/**
 * Màn thông tin bệnh sử — dựng theo thiết kế
 * "10-Man hinh thong tin benh su 1280 x 800".
 *
 * Bố cục: 2 thẻ cạnh nhau (giới tính + tuổi | danh sách bệnh 2 cột),
 * thanh dưới cùng có checkbox "Sử dụng cho lần đăng việc sau" và nút Xác nhận.
 */
export const Step6HealthInfo: React.FC<Step6Props> = ({
  gender,
  age,
  selectedDiseases,
  saveForNext,
  onUpdateGender,
  onUpdateAge,
  onToggleDisease,
  onUpdateSaveForNext,
  onNext,
  onBack,
}) => {
  const genderOptions = useOptions('gioi_tinh');

  const [diseases, setDiseases] = useState<ApiDisease[] | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setError(null);

    getDiseases(controller.signal)
      .then(setDiseases)
      .catch((err: unknown) => {
        if ((err as Error)?.name === 'AbortError') return;
        setError(
          err instanceof ApiError
            ? err
            : new ApiError('INTERNAL_ERROR', 'Không tải được danh sách bệnh lý'),
        );
      });

    // [R-2.5] Cleanup bắt buộc
    return () => controller.abort();
  }, [attempt]);

  // Giới tính mặc định lấy từ bộ lựa chọn, không gán cứng
  useEffect(() => {
    if (!gender && genderOptions.length > 0) {
      onUpdateGender((genderOptions.find((o) => o.isDefault) ?? genderOptions[0]).value);
    }
  }, [gender, genderOptions, onUpdateGender]);

  return (
    <div className="w-full max-w-6xl mx-auto py-4 px-4 space-y-4">
      {/* Thiết kế chỉ có nút back, không có tiêu đề */}
      <button
        type="button"
        onClick={onBack}
        aria-label="Quay lại"
        className="w-11 h-11 rounded-full bg-white border border-hairline text-navy flex items-center justify-center hover:bg-brand-surface transition-colors cursor-pointer"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Trái: giới tính + tuổi */}
        <section className="lg:col-span-4 bg-white rounded-2xl border border-hairline p-6">
          <h2 className="text-lg font-bold text-navy leading-snug mb-5">
            Vui lòng cung cấp giới tính người được chăm sóc.
          </h2>

          <div className="flex flex-wrap gap-3 mb-6">
            {genderOptions.map((opt) => {
              const isSelected = gender === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => onUpdateGender(opt.value)}
                  className={`flex-1 min-w-28 h-14 px-4 rounded-xl border flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                    isSelected
                      ? 'border-brand bg-brand-surface'
                      : 'border-hairline bg-white hover:border-brand-border'
                  }`}
                >
                  <span
                    className={`text-base font-bold ${isSelected ? 'text-brand-text' : 'text-navy'}`}
                  >
                    {opt.label}
                  </span>
                  {/* Vòng tròn radio như thiết kế */}
                  <span
                    className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center ${
                      isSelected ? 'border-brand' : 'border-brand-border'
                    }`}
                  >
                    {isSelected && <span className="w-2.5 h-2.5 rounded-full bg-brand" />}
                  </span>
                </button>
              );
            })}
          </div>

          <label htmlFor="age" className="block text-lg font-bold text-navy mb-2">
            Số tuổi
          </label>
          <input
            id="age"
            type="number"
            min={1}
            max={120}
            value={age || ''}
            onChange={(e) => onUpdateAge(parseInt(e.target.value, 10) || 0)}
            placeholder="—"
            className="w-40 h-14 rounded-xl border border-hairline bg-white px-4 text-lg font-bold text-navy focus:outline-none focus:border-brand transition-colors"
          />
        </section>

        {/* Phải: danh sách bệnh lý 2 cột */}
        <section className="lg:col-span-8 bg-white rounded-2xl border border-hairline p-6">
          <h2 className="text-lg font-bold text-navy mb-5">
            Vui lòng chọn những bệnh mà người cần chăm sóc đang mắc phải
          </h2>

          {error && (
            <AppStatus
              inline
              kind={error.code === 'NO_INTERNET' ? 'offline' : 'error'}
              message={error.message}
              onRetry={() => setAttempt((n) => n + 1)}
            />
          )}

          {!error && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
              {diseases === null &&
                Array.from({ length: 8 }, (_, i) => (
                  <div key={i} className="flex gap-3" aria-hidden="true">
                    <div className="w-5 h-5 rounded bg-canvas animate-pulse shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3.5 w-1/2 bg-canvas rounded animate-pulse" />
                      <div className="h-3 w-full bg-canvas rounded animate-pulse" />
                    </div>
                  </div>
                ))}

              {diseases?.length === 0 && (
                <p className="col-span-full text-sm text-muted py-6 text-center">
                  Chưa có danh mục bệnh lý.
                </p>
              )}

              {diseases?.map((item) => {
                const isChecked = selectedDiseases.includes(item.code);
                return (
                  <label key={item.code} className="flex gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => onToggleDisease(item.code)}
                      className="w-5 h-5 mt-0.5 shrink-0 rounded border-2 border-brand-border accent-brand cursor-pointer"
                    />
                    <span>
                      <span className="block text-base font-bold text-navy leading-snug">
                        {item.name}
                      </span>
                      <span className="block text-sm text-muted leading-snug mt-0.5">
                        {item.description}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Thanh dưới: lưu cho lần sau + Xác nhận */}
      <div className="bg-white rounded-2xl border border-hairline p-5 flex flex-col sm:flex-row items-center gap-4">
        <label className="flex-1 flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={saveForNext}
            onChange={(e) => onUpdateSaveForNext(e.target.checked)}
            className="w-5 h-5 rounded border-2 border-brand-border accent-brand cursor-pointer"
          />
          <span className="text-base text-navy">Sử dụng cho lần đăng việc sau.</span>
        </label>

        <button
          type="button"
          onClick={onNext}
          disabled={!age || !gender}
          className="w-full sm:w-80 h-14 rounded-xl bg-brand hover:bg-brand-dark text-white text-lg font-bold transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Xác nhận
        </button>
      </div>
    </div>
  );
};
