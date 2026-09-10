import React, { useState } from 'react';
import { AlertCircle, ChevronLeft, Eye, EyeOff, Loader2, Lock, Phone } from 'lucide-react';
import { useAuth } from '../api/AuthContext';
import { useImage, useSetting, useStep } from '../api/BootstrapContext';
import { ApiError, assetUrl } from '../api/client';

interface Step1LoginProps {
  phone: string;
  onPhoneChange: (phone: string) => void;
  /** Gọi sau khi backend cấp phiên thành công. */
  onSubmit: () => void;
  /** Bỏ trống khi đây là màn đầu tiên -> ẩn luôn nút quay lại. */
  onBack?: () => void;
}

/**
 * Màn đăng nhập — dựng theo "2-man hinh 2 log on 1280 x 800".
 *
 * Ảnh `login-bg` là nền TRỌN VẸN do thiết kế cung cấp: đã gồm nền xanh, hoạ tiết
 * sóng, logo, slogan và hai nhân vật. Nên màn này chỉ có đúng hai lớp: ảnh nền
 * tràn kín, và thẻ form trắng phủ lên nửa phải.
 *
 * Ảnh đặt bằng `background-image` chứ không phải thẻ <img>: nền trang trí không
 * mang thông tin, để nguyên thẻ <img> thì trình đọc màn hình phải bỏ qua bằng
 * alt rỗng, mà vẫn tốn một node trong cây bố cục.
 *
 * `background-position: left center` để trên màn 4:3 (máy tính bảng ngang) phần
 * bị cắt rơi vào mép PHẢI — chỗ đó là nền trống và đằng nào cũng bị thẻ form che
 * — chứ không cắt vào logo ở mép trái.
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
  const background = useImage('login-bg');
  const step = useStep('step1');
  const hotline = useSetting('app.hotline', '');
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
    <div className="flex items-center gap-3 h-[var(--h-control)] rounded-xl bg-white border border-hairline px-3 focus-within:border-brand transition-colors">
      <span className="w-9 h-9 rounded-lg bg-field-icon text-brand flex items-center justify-center shrink-0">
        {icon}
      </span>
      {input}
      {trailing}
    </div>
  );

  return (
    <div
      className="relative w-full h-screen overflow-hidden bg-signin-mid"
      style={
        background
          ? {
              backgroundImage: `url(${assetUrl(background.webp)})`,
              backgroundSize: 'cover',
              backgroundPosition: 'left center',
              backgroundRepeat: 'no-repeat',
            }
          : undefined
      }
    >
      {/* Thẻ form phủ lên nửa phải, canh giữa theo chiều dọc.
          Cao quá khung nhìn thì tự cuộn BÊN TRONG thẻ, không đẩy cả trang. */}
      <div className="app-wide relative z-10 h-full flex items-center justify-center lg:justify-end px-4 sm:px-8 lg:px-12">
        <div
          className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-white rounded-3xl shadow-2xl"
          style={{ padding: 'var(--pad-card)', display: 'grid', gap: 'var(--sp-block)' }}
        >
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              aria-label="Quay lại"
              className="w-10 h-10 rounded-full bg-white border border-hairline text-navy flex items-center justify-center hover:bg-brand-surface transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}

          <div>
            <h1 className="text-[length:var(--fs-title)] font-extrabold text-navy leading-tight">
              {step?.title ?? 'Đăng nhập'}
            </h1>
            <p className="text-[length:var(--fs-body)] text-muted mt-1">
              {step?.subtitle ?? 'Nhập số điện thoại và mật khẩu để tiếp tục'}
            </p>
          </div>

          {/* [R-1.5] Có JS Bridge nghĩa là đang trên SmartScreen -> khỏi nhập lại */}
          {hasBridge && (
            <div className="rounded-xl border border-brand-border bg-brand-surface p-3 text-xs text-navy">
              Thiết bị đã đăng nhập qua HomeHub. Bạn không cần nhập lại số điện thoại.
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 'var(--sp-tight)' }}>
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
                className="flex-1 min-w-0 bg-transparent text-[length:var(--fs-body)] text-ink placeholder:text-slate-400 focus:outline-none disabled:opacity-60"
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
                className="flex-1 min-w-0 bg-transparent text-[length:var(--fs-body)] text-ink placeholder:text-slate-400 focus:outline-none disabled:opacity-60"
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
              <span className="text-[length:var(--fs-body)] text-ink">Ghi nhớ đăng nhập</span>
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
              className="w-full h-[var(--h-control)] rounded-xl bg-linear-to-r from-cta-from to-cta-to text-white text-[length:var(--fs-item)] font-bold shadow-md hover:brightness-105 transition-[filter] cursor-pointer disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {submitting && <Loader2 className="w-5 h-5 animate-spin" />}
              <span>{submitting ? 'Đang đăng nhập...' : 'Đăng nhập'}</span>
            </button>

            <div className="text-center">
              <button
                type="button"
                className="text-[length:var(--fs-body)] font-semibold text-cta-from underline cursor-pointer"
              >
                Quên mật khẩu?
              </button>
            </div>
          </form>

          {/* Chưa làm chức năng đăng ký. Chỉ dẫn người dùng gọi tổng đài thay vì
              để một nút bấm vào không có gì xảy ra. */}
          <div className="pt-3 border-t border-hairline text-center text-[length:var(--fs-body)] text-ink">
            Chưa có tài khoản?{' '}
            {hotline ? (
              <a href={`tel:${hotline}`} className="font-bold text-cta-from underline">
                Gọi {hotline}
              </a>
            ) : (
              <span className="font-bold text-muted">Liên hệ tổng đài SAN</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
