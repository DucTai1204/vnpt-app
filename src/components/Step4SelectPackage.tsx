import React from 'react';
import { Calendar, ChevronRight, Clock } from 'lucide-react';
import { ContentBlock, useContent, useImage, useStep } from '../api/BootstrapContext';
import { ApiImage } from '../api/client';
import { RemoteImage } from './RemoteImage';

interface Step4Props {
  onSelectDaily: () => void;
  onSelectMonthly: () => void;
}

/** Icon badge do DB chỉ định (khoi_noi_dung.icon_badge). */
const BADGE_ICONS: Record<string, React.ElementType> = { Clock, Calendar };

interface PackageCardProps {
  block: ContentBlock | null;
  image: ApiImage | null;
  accent: 'red' | 'navy';
  onSelect: () => void;
}

const PackageCard: React.FC<PackageCardProps> = ({ block, image, accent, onSelect }) => {
  const BadgeIcon = BADGE_ICONS[block?.badgeIcon ?? ''] ?? Clock;
  const badgeBg = accent === 'red' ? 'bg-[#D42A2A]' : 'bg-[#0B2E6B]';
  const titleColor = accent === 'red' ? 'text-[#D42A2A]' : 'text-[#0B2E6B]';
  const hoverBorder = accent === 'red' ? 'hover:border-[#D42A2A]' : 'hover:border-[#0B2E6B]';

  if (!block) {
    // Skeleton giữ đúng khung -> không layout shift [R-2.2]
    return (
      <div
        className="bg-white rounded-2xl overflow-hidden border border-stone-200 shadow-md"
        aria-hidden="true"
      >
        <div className="h-48 bg-stone-200 animate-pulse" />
        <div className="p-6 space-y-3">
          <div className="h-5 w-2/3 bg-stone-200 rounded animate-pulse" />
          <div className="h-3 w-full bg-stone-100 rounded animate-pulse" />
          <div className="h-3 w-5/6 bg-stone-100 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onSelect}
      className={`bg-white rounded-2xl overflow-hidden border border-stone-200 shadow-md hover:shadow-2xl ${hoverBorder} transition-all duration-300 flex flex-col justify-between group cursor-pointer`}
    >
      <div>
        <div className="relative h-48 overflow-hidden bg-sky-100">
          <RemoteImage
            image={image}
            alt={block.imageAlt ?? block.title ?? ''}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          {block.badgeLabel && (
            <div
              className={`absolute top-3 left-3 ${badgeBg} text-white text-[11px] font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-xs`}
            >
              <BadgeIcon className="w-3.5 h-3.5" />
              <span>{block.badgeLabel}</span>
            </div>
          )}
        </div>

        <div className="p-6">
          <h3
            className={`text-lg font-bold ${titleColor} uppercase tracking-wide mb-3 transition-colors`}
          >
            {block.title}
          </h3>
          <p className="text-xs text-stone-600 leading-relaxed">{block.body}</p>
        </div>
      </div>

      <div className="p-6 pt-0">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
          className="w-full py-3 px-5 bg-[#0B2E6B] group-hover:bg-[#D42A2A] text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>{block.ctaLabel}</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export const Step4SelectPackage: React.FC<Step4Props> = ({ onSelectDaily, onSelectMonthly }) => {
  const step = useStep('step4');
  const theoNgay = useContent('step4', 'step4.the_theo_ngay');
  const theoThang = useContent('step4', 'step4.the_theo_thang');
  const goiNgay = useImage('goi-theo-ngay');
  const goiThang = useImage('goi-theo-thang');

  return (
    <div className="w-full max-w-4xl mx-auto py-6 px-4">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-[#0B2E6B] mb-2">
          {step?.title ?? 'Chọn hình thức đặt lịch'}
        </h2>
        <p className="text-xs text-stone-500 max-w-md mx-auto">{step?.subtitle ?? ''}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <PackageCard block={theoNgay} image={goiNgay} accent="red" onSelect={onSelectDaily} />
        <PackageCard block={theoThang} image={goiThang} accent="navy" onSelect={onSelectMonthly} />
      </div>
    </div>
  );
};
