import React from 'react';
import { ContentBlock, useContent, useStep } from '../api/BootstrapContext';
import { imageOf, RemoteImage } from './RemoteImage';
import { ScreenHeader } from './ScreenHeader';

interface Step4Props {
  onSelectDaily: () => void;
  onSelectMonthly: () => void;
  onBack: () => void;
}

interface PackageCardProps {
  block: ContentBlock | null;
  onSelect: () => void;
}

/**
 * Thẻ gói — theo thiết kế: ảnh bo tròn ở trên, tiêu đề ĐỎ in hoa canh giữa,
 * mô tả căn trái bên dưới. Không có badge và không có nút riêng: bấm cả thẻ.
 */
const PackageCard: React.FC<PackageCardProps> = ({ block, onSelect }) => {
  if (!block) {
    // Skeleton giữ đúng khung -> không layout shift [R-2.2]
    return (
      <div className="bg-white rounded-3xl border border-hairline p-4" aria-hidden="true">
        <div className="h-64 rounded-2xl bg-stone-200 animate-pulse" />
        <div className="p-4 space-y-3">
          <div className="h-5 w-2/3 mx-auto bg-stone-200 rounded animate-pulse" />
          <div className="h-3 w-full bg-stone-100 rounded animate-pulse" />
          <div className="h-3 w-5/6 bg-stone-100 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onSelect}
      className="text-left bg-white rounded-3xl border border-hairline p-4 shadow-sm hover:shadow-xl hover:border-brand-border transition-all duration-300 cursor-pointer group"
    >
      <div className="rounded-2xl overflow-hidden h-56 sm:h-64">
        <RemoteImage
          image={imageOf(block)}
          alt={block.imageAlt ?? block.title ?? ''}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      </div>

      <div className="px-2 pt-5 pb-2">
        <h2 className="text-xl sm:text-2xl font-extrabold text-title-red uppercase text-center mb-3">
          {block.title}
        </h2>
        <p className="text-sm sm:text-base text-ink leading-relaxed">{block.body}</p>
      </div>
    </button>
  );
};

/**
 * Chọn hình thức đặt lịch — dựng theo "5-man hinh chon ngay - thang 1280 x 800".
 *
 * Nội dung hai thẻ lấy từ `khoi_noi_dung` (step4.the_theo_ngay / the_theo_thang),
 * ảnh lấy từ `tep_hinh_anh` — đổi trong DB là màn này đổi theo.
 */
export const Step4SelectPackage: React.FC<Step4Props> = ({
  onSelectDaily,
  onSelectMonthly,
  onBack,
}) => {
  const step = useStep('step4');
  const theoNgay = useContent('step4', 'step4.the_theo_ngay');
  const theoThang = useContent('step4', 'step4.the_theo_thang');

  return (
    <div className="w-full max-w-6xl mx-auto py-6 px-4">
      <ScreenHeader
        title={step?.title ?? 'Chọn dịch vụ'}
        onBack={onBack}
        showHotline={Boolean(step?.showHotline)}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <PackageCard block={theoNgay} onSelect={onSelectDaily} />
        <PackageCard block={theoThang} onSelect={onSelectMonthly} />
      </div>
    </div>
  );
};
