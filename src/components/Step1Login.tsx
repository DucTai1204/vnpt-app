import React, { useState } from 'react';
import { AlertCircle, ChevronLeft, Eye, EyeOff, Loader2, Lock, Phone } from 'lucide-react';
import { useAuth } from '../api/AuthContext';
import { useContent, useImage, useStep } from '../api/BootstrapContext';
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

/**
 * Màn đăng nhập — dựng theo "2-man hinh 2 log on 1280 x 800".
 *
 * Tràn kín màn hình: nền xanh chuyển chéo từ góc trên phải xuống góc dưới trái,
 * logo và slogan ở góc trên trái, ảnh nhân viên dìu người cao tuổi chiếm nửa
 * trái và chạy hết mép dưới, thẻ trắng chứa form nằm bên phải canh giữa.
 *
 * Ảnh dùng `object-contain` neo đáy vì thiết kế dùng ảnh ĐÃ TÁCH NỀN. Khi thay
 * `dv-nguoi-gia` bằng bản PNG trong suốt là khớp thiết kế ngay, không phải sửa
 * layout. Trong lúc chưa có bản tách nền, lớp phủ `photo-blend` bên dưới làm
 * mềm mép ảnh chữ nhật — xoá lớp đó đi khi đã có PNG trong suốt.
 *
 * [R-1.5] Trên SmartScreen phiên đến từ SSO của HomeHub — màn này chỉ là đường
 * lùi ở máy dev. Bản Store đặt ALLOW_DEV_LOGIN=false thì backend trả NO_PERMISSION.
 */
export const Step1Login: React.FC<Step1LoginProps> = ({
  phone,
  onPhoneChange,
  onSubmit,
  onBack,
}) => {
  // Ưu tiên bản ĐÃ TÁCH NỀN. Chưa có trong DB thì tạm dùng ảnh dịch vụ có nền —
  // thêm 'login-hero' vào tep_hinh_anh là màn này tự đổi, không phải sửa code.
  // Gọi cả hai hook vô điều kiện: '??' sẽ làm hook thứ hai chạy lúc có lúc không.
  const cutout = useImage('login-hero');
  const fallback = useImage('dv-nguoi-gia');
  const photo = cutout ?? fallback;
  const hero = useContent('step0', 'step0.hero');
  const step = useStep('step1');
  const { loginWithPhone, hasBridge } = useAuth();

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

  /** Ô nhập có icon trong khối bo tròn nền xanh nhạt, như thiết kế. */
  const field = (icon: React.ReactNode, input: React.ReactNode, trailing?: React.ReactNode) => (
    <div className="flex items-center gap-3 h-14 rounded-xl bg-white border border-hairline px-3 focus-within:border-brand transition-colors">
      <span className="w-9 h-9 rounded-lg bg-field-icon text-brand flex items-center justify-center shrink-0">
        {icon}
      </span>
      {input}
      {trailing}
    </div>
  );

  return (
    <div
      className="relative w-full min-h-screen overflow-hidden"
      style={{
        background:
          'linear-gradient(to bottom left, var(--color-signin-light) 0%, var(--color-signin-mid) 50%, var(--color-signin-deep) 100%)',
      }}
    >
      {/* Ảnh nửa trái, neo đáy. Ảnh đã tách nền nên dùng `object-contain` để
          không cắt mất người và không cần lớp phủ hoà mép nào.
          Màn hẹp ẩn đi để không đè lên form. */}
      <div className="absolute bottom-0 left-0 w-[58%] h-[86%] hidden lg:block">
        <RemoteImage
          image={photo}
          alt={photo?.alt ?? 'Nhân viên SAN dìu người cao tuổi'}
          className="w-full h-full object-contain object-bottom"
          priority
        />
      </div>

      {/* Logo + slogan, góc trên trái */}
      <div className="relative z-10 flex items-center gap-4 flex-wrap px-6 sm:px-10 lg:px-14 pt-8">
        <SanLogo size="lg" showSubtitle={false} />
        <p className="text-lg sm:text-2xl lg:text-3xl font-bold italic text-crimson">
          {hero?.title ?? 'Trẻ cậy cha, già cậy SAN'}
        </p>
      </div>

      {/* Thẻ form, nửa phải, canh giữa theo chiều dọc */}
      <div className="relative z-10 min-h-[calc(100vh-7rem)] flex items-center justify-center lg:justify-end px-4 sm:px-8 lg:px-14 py-8">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 sm:p-8 space-y-5">
          <button
            type="button"
            onClick={onBack}
            aria-label="Quay lại"
            className="w-11 h-11 rounded-full bg-white border border-hairline text-navy flex items-center justify-center hover:bg-brand-surface transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-navy">
              {step?.title ?? 'Đăng nhập'}
            </h1>
            <p className="text-sm text-muted mt-1">
              {step?.subtitle ?? 'Nhập số điện thoại và mật khẩu để tiếp tục'}
            </p>
          </div>

          {/* [R-1.5] Có JS Bridge nghĩa là đang trên SmartScreen -> khỏi nhập lại */}
          {hasBridge && (
            <div className="rounded-xl border border-brand-border bg-brand-surface p-3 text-xs text-navy">
              Thiết bị đã đăng nhập qua HomeHub. Bạn không cần nhập lại số điện thoại.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="sr-only" htmlFor="phone">
              Số điện thoại
            </label>
            {field(
              <Phone className="w-5 h-5" />,
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
                className="flex-1 min-w-0 bg-transparent text-base text-ink placeholder:text-slate-400 focus:outline-none disabled:opacity-60"
              />,
            )}

            <label className="sr-only" htmlFor="password">
              Mật khẩu
            </label>
            {field(
              <Lock className="w-5 h-5" />,
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
                className="flex-1 min-w-0 bg-transparent text-base text-ink placeholder:text-slate-400 focus:outline-none disabled:opacity-60"
              />,
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                className="p-2 text-muted hover:text-navy cursor-pointer shrink-0"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>,
            )}

            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-5 h-5 rounded accent-cta-from cursor-pointer"
              />
              <span className="text-sm text-ink">Ghi nhớ đăng nhập</span>
            </label>

            {/* [R-4] Trạng thái lỗi hiển thị ngay tại form */}
            {error && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-xl border border-red-200 bg-accent-surface p-3"
              >
                <AlertCircle className="w-4 h-4 text-cta-from shrink-0 mt-0.5" />
                <p className="text-xs text-cta-from leading-relaxed">
                  {error.code === 'NOT_FOUND'
                    ? 'Số điện thoại chưa có tài khoản trên hệ thống.'
                    : error.code === 'NO_PERMISSION'
                      ? 'Đăng nhập bằng số điện thoại đã tắt. Hãy mở ứng dụng từ HomeHub.'
                      : error.message}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full h-14 rounded-xl bg-linear-to-r from-cta-from to-cta-to text-white text-lg font-bold shadow-md hover:brightness-105 transition-[filter] cursor-pointer disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {submitting && <Loader2 className="w-5 h-5 animate-spin" />}
              <span>{submitting ? 'Đang đăng nhập...' : 'Đăng nhập'}</span>
            </button>

            <div className="text-center">
              <button
                type="button"
                className="text-sm font-semibold text-cta-from underline cursor-pointer"
              >
                Quên mật khẩu?
              </button>
            </div>
          </form>

          <div className="pt-4 border-t border-hairline text-center text-sm text-ink">
            Chưa có tài khoản?{' '}
            <button
              type="button"
              onClick={onBack}
              className="font-bold text-cta-from underline cursor-pointer"
            >
              Đăng ký ngay
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
