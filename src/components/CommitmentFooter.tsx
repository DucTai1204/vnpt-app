import React from 'react';
import { Award, BadgeCheck, HeartHandshake, ShieldCheck, UserCheck } from 'lucide-react';

/**
 * Dải cam kết cuối trang, có ở mọi màn trong bộ thiết kế.
 * Nội dung cố định theo bộ nhận diện SAN nên để ngay trong component.
 */
const ITEMS = [
  { Icon: ShieldCheck, lines: ['Kiểm duyệt lý lịch', 'kỹ càng'], tone: 'text-navy' },
  { Icon: UserCheck, lines: ['Được đào tạo', 'bài bản'], tone: 'text-accent' },
  { Icon: HeartHandshake, lines: ['Tận tâm &', 'yêu thương'], tone: 'text-accent' },
  { Icon: Award, lines: ['Không phát sinh', 'phụ phí'], tone: 'text-accent' },
];

export const CommitmentFooter: React.FC = () => (
  <div className="bg-white rounded-2xl border border-hairline px-5 py-4">
    <div className="flex flex-wrap items-center gap-y-4">
      <div className="flex items-center gap-3 pr-6 basis-full sm:basis-auto sm:flex-1">
        <BadgeCheck className="w-7 h-7 text-navy shrink-0" />
        <span className="leading-tight">
          <span className="block text-sm font-bold text-navy">SAN cam kết</span>
          <span className="block text-[11px] text-muted">
            An tâm - Tận tâm - Uy tín - Chuyên nghiệp
          </span>
        </span>
      </div>

      {ITEMS.map(({ Icon, lines, tone }) => (
        <div
          key={lines.join(' ')}
          className="flex items-center gap-2.5 flex-1 basis-1/2 sm:basis-auto sm:border-l border-hairline sm:pl-5"
        >
          <Icon className={`w-6 h-6 shrink-0 ${tone}`} />
          <span className="text-[11px] font-semibold text-navy leading-tight">
            {lines.map((l) => (
              <span key={l} className="block">
                {l}
              </span>
            ))}
          </span>
        </div>
      ))}
    </div>
  </div>
);
