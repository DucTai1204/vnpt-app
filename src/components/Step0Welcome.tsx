import React from 'react';
import { ArrowRight } from 'lucide-react';
import { useAuth } from '../api/AuthContext';
import { useContent, useImage } from '../api/BootstrapContext';
import { RemoteImage } from './RemoteImage';

interface Step0Props {
  onLogin: () => void;
  onRegister: () => void;
}

/**
 * Màn chào.
 *
 * Hai nút LUÔN hiện và luôn bấm được, không phụ thuộc vào ảnh banner:
 * ảnh chỉ là phần nhìn, thao tác nằm ở nút thật bên dưới. Trước đây nút được
 * làm trong suốt để chồng lên nút vẽ sẵn trong ảnh thiết kế — cách đó hỏng
 * ngay khi banner đổi sang ảnh không có nút, khiến màn hình không thao tác được.
 *
 * Chữ (tiêu đề, slogan, nhãn nút) lấy từ khoi_noi_dung qua /bootstrap.
 */
export const Step0Welcome: React.FC<Step0Props> = ({ onLogin, onRegister }) => {
  const banner = useImage('banner-welcome');
  const hero = useContent('step0', 'step0.hero');
  const { hasBridge, error, retrySso } = useAuth();

  return (
    <div className="w-full max-w-5xl mx-auto my-6 sm:my-10 px-4">
      <div className="overflow-hidden rounded-2xl shadow-xl border border-sky-100 bg-white">
        <RemoteImage
          image={banner}
          alt={banner?.alt ?? hero?.title ?? 'SAN - Trẻ cậy cha, già cậy SAN'}
          className="w-full h-auto block"
          priority
        />

        <div className="p-6 sm:p-8 space-y-5">
          {(hero?.title || hero?.subtitle || hero?.body) && (
            <div className="space-y-1.5">
              <h1 className="text-xl sm:text-2xl font-black text-[#0B2E6B] leading-tight">
                {hero?.title}
              </h1>
              <p className="text-sm font-bold text-[#D42A2A]">{hero?.subtitle}</p>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">{hero?.body}</p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={onLogin}
              className="px-8 py-3.5 bg-[#0B2A6B] hover:bg-[#082052] text-white font-bold text-sm sm:text-base rounded-xl shadow-lg flex items-center justify-center gap-2.5 transition-colors cursor-pointer"
            >
              <span>{hero?.ctaLabel ?? 'Đăng nhập'}</span>
              <ArrowRight className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={onRegister}
              className="px-8 py-3.5 bg-sky-100 hover:bg-sky-200 text-[#0B2A6B] font-bold text-sm sm:text-base rounded-xl border border-sky-200 transition-colors cursor-pointer"
            >
              Đăng ký
            </button>
          </div>

          {/* [R-4] SSO hỏng thì cho thử lại ngay tại màn đầu */}
          {error && hasBridge && (
            <div className="rounded-xl border border-amber-300 bg-amber-50 p-3">
              <p className="text-xs font-semibold text-amber-900 mb-2">{error.message}</p>
              <button
                type="button"
                onClick={retrySso}
                className="text-xs font-bold text-[#0B2E6B] underline cursor-pointer"
              >
                Thử kết nối lại
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
