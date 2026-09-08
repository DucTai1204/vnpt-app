import React, { useState } from 'react';
import { AlertCircle, ArrowLeft, Loader2, Lock, Phone, Eye, EyeOff } from 'lucide-react';
import { useImage, useStep } from '../api/BootstrapContext';
import { useAuth } from '../api/AuthContext';
import { ApiError } from '../api/client';
import { RemoteImage } from './RemoteImage';
import { SanLogo } from './SanLogo';

interface Step1LoginProps {
  phone: string;
  onPhoneChange: (phone: string) => void;
  /** Gọi sau khi backend cấp phiên thành công. */
  onSubmit: () => void;
  onBack: () => void;
}

export const Step1Login: React.FC<Step1LoginProps> = ({
  phone,
  onPhoneChange,
  onSubmit,
  onBack,
}) => {
  const banner = useImage('banner-login');
  const { loginWithPhone, hasBridge } = useAuth();

  // Tiêu đề lấy từ bảng buoc_dat_lich qua /bootstrap
  const step = useStep('step1');
  const heading = step?.title ?? 'Đăng nhập';
  const subheading = step?.subtitle ?? '';

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setError(null);
    try {
      await loginWithPhone(phone.trim());
      onSubmit();
    } catch (err) {
      setError(
        err instanceof ApiError ? err : new ApiError('INTERNAL_ERROR', 'Đăng nhập không thành công'),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto my-6 sm:my-10 px-4">
      <div className="bg-white/95 rounded-2xl shadow-xl border border-sky-100 overflow-hidden grid grid-cols-1 md:grid-cols-5">
        {/* Left Side: Staff Supporting Elderly Image (3/5 = ~60%) */}
        <div className="md:col-span-3 relative hidden md:block bg-sky-900">
          <RemoteImage
            image={banner}
            alt="Nhân viên SAN hỗ trợ người cao tuổi"
            className="w-full h-full object-cover opacity-90"
            priority
          />
          <div className="absolute inset-0 bg-linear-to-t from-[#0B2E6B] via-[#0B2E6B]/30 to-transparent flex flex-col justify-end p-8 text-white">
            <h3 className="text-xl font-bold text-white mb-2">Chăm sóc tận tâm</h3>
            <p className="text-xs text-sky-100 leading-relaxed">
              Dịch vụ chăm sóc người già &amp; người bệnh uy tín hàng đầu tại nhà và bệnh viện.
            </p>
          </div>
        </div>

        {/* Right Side: Login Form Card (2/5 = ~40%) */}
        <div className="md:col-span-2 p-6 sm:p-8 flex flex-col justify-between relative bg-white overflow-y-auto">
          <div>
            {/* Top Back button + Logo */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={onBack}
                className="p-2 rounded-full hover:bg-stone-100 text-[#0B2E6B] transition-colors border border-stone-200 cursor-pointer"
                title="Quay lại"
                aria-label="Quay lại"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <SanLogo size="sm" showSubtitle={false} />
            </div>

            <h2 className="text-2xl font-bold text-[#0B2E6B] mb-1">{heading}</h2>
            <p className="text-xs text-stone-500 mb-6">{subheading}</p>

            {/* [R-1.5] Trên SmartScreen phiên đến từ SSO — màn này chỉ là đường lùi ở máy dev */}
            {hasBridge && (
              <div className="mb-4 rounded-xl border border-sky-200 bg-sky-50 p-3 text-xs text-[#0B2E6B]">
                Thiết bị đã đăng nhập qua HomeHub. Bạn không cần nhập lại số điện thoại.
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Phone Input */}
              <div>
                <label className="block text-xs font-semibold text-[#0B2E6B] mb-1.5" htmlFor="phone">
                  Số điện thoại
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel"
                    value={phone}
                    onChange={(e) => onPhoneChange(e.target.value)}
                    placeholder="Nhập số điện thoại"
                    required
                    disabled={submitting}
                    className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm font-medium text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#0B2E6B] focus:bg-white transition-all disabled:opacity-60"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label
                  className="block text-xs font-semibold text-[#0B2E6B] mb-1.5"
                  htmlFor="password"
                >
                  Mật khẩu
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Nhập mật khẩu"
                    required
                    disabled={submitting}
                    className="w-full pl-10 pr-10 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm font-medium text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#0B2E6B] focus:bg-white transition-all disabled:opacity-60"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Checkbox + Forgot Password */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-stone-700">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded-md accent-[#D42A2A] cursor-pointer"
                  />
                  <span>Ghi nhớ đăng nhập</span>
                </label>

                <button
                  type="button"
                  className="text-xs font-semibold text-[#D42A2A] hover:underline cursor-pointer"
                >
                  Quên mật khẩu?
                </button>
              </div>

              {/* [R-4] Trạng thái lỗi hiển thị ngay tại form */}
              {error && (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3"
                >
                  <AlertCircle className="w-4 h-4 text-[#D42A2A] shrink-0 mt-0.5" />
                  <p className="text-xs text-[#D42A2A] leading-relaxed">
                    {error.code === 'NOT_FOUND'
                      ? 'Số điện thoại chưa có tài khoản trên hệ thống.'
                      : error.code === 'NO_PERMISSION'
                        ? 'Đăng nhập bằng số điện thoại đã tắt. Hãy mở ứng dụng từ HomeHub.'
                        : error.message}
                  </p>
                </div>
              )}

              {/* CTA Red->Orange Gradient Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-4 py-3.5 px-6 bg-linear-to-r from-[#D42A2A] to-amber-500 hover:from-red-700 hover:to-amber-600 text-white font-bold rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{submitting ? 'Đang đăng nhập...' : 'Đăng nhập'}</span>
              </button>
            </form>
          </div>

          {/* Footer register link */}
          <div className="mt-8 pt-4 border-t border-stone-100 text-center text-xs text-stone-600">
            Chưa có tài khoản?{' '}
            <button
              type="button"
              onClick={onBack}
              className="font-bold text-[#D42A2A] hover:underline cursor-pointer"
            >
              Đăng ký ngay
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
