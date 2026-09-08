import React from 'react';
import { ChevronLeft, Headphones } from 'lucide-react';
import { useSetting } from '../api/BootstrapContext';

/**
 * Thanh tiêu đề dùng chung cho các bước trong luồng đặt lịch.
 *
 * Theo bộ thiết kế: nút back tròn viền mảnh bên trái, tiêu đề đậm màu navy,
 * pill "Tư vấn & hỗ trợ / <hotline>" bên phải. Hotline lấy từ /bootstrap.
 */
interface ScreenHeaderProps {
  title: string;
  onBack?: () => void;
  /** Ẩn pill hotline ở màn không cần (vd bệnh sử). */
  showHotline?: boolean;
}

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  title,
  onBack,
  showHotline = true,
}) => {
  const hotline = useSetting('app.hotline', '');

  return (
    <div className="flex items-center justify-between gap-3 mb-4">
      <div className="flex items-center gap-3 min-w-0">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            aria-label="Quay lại"
            className="w-11 h-11 shrink-0 rounded-full bg-white border border-hairline text-navy flex items-center justify-center hover:bg-brand-surface transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
        <h1 className="text-xl sm:text-2xl font-extrabold text-navy truncate">{title}</h1>
      </div>

      {showHotline && hotline && (
        <a
          href={`tel:${hotline}`}
          className="shrink-0 flex items-center gap-2.5 px-4 py-2 rounded-full bg-white border border-hairline hover:border-brand-border transition-colors"
        >
          <Headphones className="w-5 h-5 text-brand shrink-0" />
          <span className="leading-tight text-right">
            <span className="block text-[10px] text-muted">Tư vấn &amp; hỗ trợ</span>
            <span className="block text-sm font-bold text-navy">{hotline}</span>
          </span>
        </a>
      )}
    </div>
  );
};
