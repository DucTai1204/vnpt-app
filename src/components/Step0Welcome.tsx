import React, { useEffect, useState } from 'react';
import { useAuth } from '../api/AuthContext';
import { useContent, useImage } from '../api/BootstrapContext';
import { ApiService, getServices } from '../api/client';
import { RemoteImage } from './RemoteImage';
import { SanLogo } from './SanLogo';

interface Step0Props {
  onLogin: () => void;
  onRegister: () => void;
}

/**
 * Màn chào — dựng theo "1-man hinh chao 1 1280 x 800".
 *
 * Tràn kín màn hình: không thẻ, không bo góc, không lề. Ảnh điều dưỡng nằm bên
 * phải và chạy hết mép phải lẫn mép dưới, đúng như thiết kế.
 *
 * Chữ lấy từ `khoi_noi_dung.step0.hero`, danh sách gạch đầu dòng lấy từ
 * `/catalog/services` — đổi dịch vụ trong DB là màn này tự đổi theo, không phải
 * build lại app.
 */
export const Step0Welcome: React.FC<Step0Props> = ({ onLogin, onRegister }) => {
  const banner = useImage('banner-login');
  const hero = useContent('step0', 'step0.hero');
  const { hasBridge, error, retrySso } = useAuth();

  const [services, setServices] = useState<ApiService[] | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    // Endpoint công khai — gọi được trước khi đăng nhập
    getServices(controller.signal)
      .then(setServices)
      .catch(() => setServices([]));
    // [R-2.5] Cleanup bắt buộc
    return () => controller.abort();
  }, []);

  return (
    <div
      className="relative w-full min-h-screen overflow-hidden"
      style={{
        background:
          'linear-gradient(180deg, var(--color-hero-1) 0%, var(--color-hero-2) 45%, var(--color-hero-3) 75%, var(--color-hero-4) 100%)',
      }}
    >
      {/* Ảnh bên phải, tràn hết mép phải và mép dưới. Màn hẹp thì ẩn đi để
          không cắt mất mặt người và không đè lên chữ. */}
      <div className="absolute inset-y-0 right-0 w-[62%] hidden md:block">
        <RemoteImage
          image={banner}
          alt={banner?.alt ?? 'Điều dưỡng SAN chăm sóc người bệnh'}
          className="w-full h-full object-cover object-left"
          priority
        />
        {/* Hoà mép trái của ảnh vào nền xanh, thay cho ảnh cắt nền trong thiết kế */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(to right, var(--color-hero-2) 0%, rgba(216,233,253,0.72) 14%, rgba(216,233,253,0) 42%)',
          }}
        />
      </div>

      {/* Cột chữ — canh giữa theo chiều dọc như thiết kế */}
      <div className="relative min-h-screen flex items-center">
        <div className="w-full md:w-[52%] px-6 sm:px-10 lg:px-16 py-10 space-y-5">
          <SanLogo size="lg" showSubtitle={false} />

          {hero?.subtitle && (
            <p className="text-sm sm:text-base font-semibold text-navy">{hero.subtitle}</p>
          )}

          <div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold italic text-crimson leading-tight">
              {hero?.title ?? 'Trẻ cậy cha, già cậy SAN'}
            </h1>
            {/* Gạch ngang có trái tim ở giữa, như thiết kế */}
            <div className="flex items-center gap-2 mt-3 max-w-lg">
              <span className="h-px flex-1 bg-crimson/30" />
              <svg viewBox="0 0 24 24" className="w-4 h-4 text-crimson/60" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M12 20s-7-4.5-7-9a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 4.5-7 9-7 9z"
                />
              </svg>
              <span className="h-px flex-1 bg-crimson/30" />
            </div>
          </div>

          {/* 3 dịch vụ — nguồn: /catalog/services */}
          <ul className="space-y-3.5">
            {services === null &&
              [0, 1, 2].map((i) => (
                <li
                  key={i}
                  className="h-5 w-3/4 rounded bg-white/40 animate-pulse"
                  aria-hidden="true"
                />
              ))}

            {services?.map((s) => (
              <li key={s.code} className="flex items-center gap-3">
                <span className="w-3.5 h-3.5 rounded-full bg-dot-red shrink-0" />
                <span className="text-sm sm:text-base lg:text-lg font-bold text-navy uppercase tracking-wide">
                  {s.title}
                </span>
              </li>
            ))}
          </ul>

          {/* [R-4] SSO hỏng thì cho thử lại ngay tại màn đầu */}
          {error && hasBridge && (
            <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 max-w-md">
              <p className="text-xs font-semibold text-amber-900 mb-2">{error.message}</p>
              <button
                type="button"
                onClick={retrySso}
                className="text-xs font-bold text-navy underline cursor-pointer"
              >
                Thử kết nối lại
              </button>
            </div>
          )}

          <div className="space-y-3 pt-2 max-w-md">
            <button
              type="button"
              onClick={onLogin}
              className="w-full h-14 rounded-xl bg-linear-to-b from-login-from to-login-to text-white text-lg font-bold shadow-lg hover:brightness-110 transition-[filter] cursor-pointer"
            >
              {hero?.ctaLabel ?? 'Đăng nhập'}
            </button>

            <button
              type="button"
              onClick={onRegister}
              className="w-full h-14 rounded-xl bg-linear-to-b from-signup-from to-signup-to text-brand-text text-lg font-bold shadow-md hover:brightness-105 transition-[filter] cursor-pointer"
            >
              Đăng ký
            </button>
          </div>
        </div>
      </div>

      {/* Màn hẹp: ảnh nằm dưới cùng, không cắt mất mặt người */}
      <div className="md:hidden">
        <RemoteImage
          image={banner}
          alt={banner?.alt ?? 'Điều dưỡng SAN chăm sóc người bệnh'}
          className="w-full h-56 object-cover"
        />
      </div>
    </div>
  );
};
