import React from 'react';
import { ArrowLeft, PhoneCall } from 'lucide-react';
import { useBootstrap, useSetting } from '../api/BootstrapContext';
import { StepId } from '../types';

interface ProgressIndicatorProps {
  currentStep: StepId;
  title?: string;
  onBack?: () => void;
  showHotline?: boolean;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  currentStep,
  title,
  onBack,
  showHotline = false,
}) => {
  const { data } = useBootstrap();
  const hotline = useSetting('app.hotline', '');

  // Số bước và vị trí lấy từ bảng buoc_dat_lich, không đếm cứng trong FE.
  const steps = data?.steps ?? [];
  const flowSteps = steps.filter((s) => s.progressIndex !== null);
  const total = flowSteps.reduce((max, s) => Math.max(max, s.progressIndex ?? 0), 0);
  const current = steps.find((s) => s.code === currentStep)?.progressIndex ?? 0;

  if (!current || !total) return null;

  const percentage = Math.round((current / total) * 100);

  return (
    <div className="w-full bg-white border-b border-sky-100 shadow-xs sticky top-0 z-30 px-4 py-3">
      <div className="max-w-4xl mx-auto flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 rounded-full hover:bg-stone-100 text-[#0B2E6B] transition-colors flex items-center justify-center border border-stone-200 cursor-pointer"
                title="Quay lại"
                aria-label="Quay lại"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}

            <div>
              {title && (
                <h1 className="text-lg font-bold text-[#0B2E6B] leading-tight">{title}</h1>
              )}
              <span className="text-xs font-semibold text-[#D42A2A]">
                Bước {current} trên {total}
              </span>
            </div>
          </div>

          {showHotline && hotline && (
            <a
              href={`tel:${hotline}`}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-[#D42A2A] rounded-full border border-red-200 text-xs font-semibold shadow-2xs hover:bg-red-100 transition-colors"
            >
              <PhoneCall className="w-3.5 h-3.5 text-[#D42A2A]" />
              <span>Tư vấn &amp; hỗ trợ {hotline}</span>
            </a>
          )}
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
          <div
            className="bg-linear-to-r from-[#0B2E6B] to-[#D42A2A] h-full rounded-full transition-transform duration-300 ease-out origin-left"
            style={{ transform: `scaleX(${percentage / 100})`, width: '100%' }}
          />
        </div>
      </div>
    </div>
  );
};
