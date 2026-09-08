import React from 'react';
import { useImage } from '../api/BootstrapContext';
import { RemoteImage } from './RemoteImage';

interface SanLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
  className?: string;
}

export const SanLogo: React.FC<SanLogoProps> = ({
  size = 'md',
  showSubtitle = true,
  className = '',
}) => {
  const logo = useImage('san-logo');

  const circleSizes = {
    sm: 'w-9 h-9',
    md: 'w-12 h-12',
    lg: 'w-20 h-20',
  };

  const handSizes = {
    sm: 'w-5 h-5',
    md: 'w-7 h-7',
    lg: 'w-11 h-11',
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm font-bold',
    lg: 'text-xl font-black',
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Red Circle with overlapping hands icon / logo image */}
      <div
        className={`${circleSizes[size]} rounded-full shadow-md flex items-center justify-center relative overflow-hidden border border-red-500/20 shrink-0`}
      >
        <RemoteImage
          image={logo}
          alt="Logo SAN"
          className="w-full h-full object-contain"
          priority
        />
      </div>

      {showSubtitle && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-[#0B2E6B] tracking-tight text-lg sm:text-xl">
              SAN
            </span>
            <span className="text-[10px] sm:text-xs font-semibold px-2 py-0.5 bg-sky-100 text-[#0B2E6B] rounded-full border border-sky-200">
              VNPT Home
            </span>
          </div>
          <span className="text-[11px] font-medium text-[#D42A2A] leading-tight">
            Nền tảng chăm sóc sức khỏe
          </span>
        </div>
      )}
    </div>
  );
};
