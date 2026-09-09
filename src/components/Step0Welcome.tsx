import React from 'react';
import { useAuth } from '../api/AuthContext';
import { useContent, useImage } from '../api/BootstrapContext';
import { assetUrl } from '../api/client';

interface Step0Props {
  onLogin: () => void;
  onRegister: () => void;
}

/**
 * Tỉ lệ của ảnh nền gốc (1585x992). Sân khấu bên dưới bị khoá đúng tỉ lệ này.
 */
const RATIO = 1585 / 992;

/**
 * Toạ độ hai nút, tính theo phần trăm của ẢNH, đo trực tiếp từ bộ thiết kế
 * "1-man hinh chao 1 1280 x 800" bằng cách quét dải ngang liền mạch của màu nút.
 */
const BUTTON = { left: '11.48%', width: '30.90%', height: '8.57%' } as const;
const TOP_LOGIN = '65.32%';
const TOP_SIGNUP = '76.00%';

/** Chiều cao sân khấu — dùng lại cho cỡ chữ nút. */
const STAGE_H = `max(100vh, calc(100vw / ${RATIO}))`;

/**
 * Cỡ chữ nút phải bám theo SÂN KHẤU, không phải khung nhìn.
 *
 * Nút cao 8.57% sân khấu; lấy chữ bằng ~38% chiều cao nút -> 3.26% sân khấu.
 * Nếu dùng thang theo khung nhìn thì trên khổ màn mà ảnh bị phóng to, chữ sẽ
 * nhỏ hẳn so với cái nút chứa nó. clamp() chặn hai đầu cho dễ đọc.
 */
const buttonStyle = (top: string): React.CSSProperties => ({
  position: 'absolute',
  top,
  ...BUTTON,
  fontSize: `clamp(0.875rem, calc(${STAGE_H} * 0.0326), 1.5rem)`,
});

/**
 * Màn chào — dựng theo "1-man hinh chao 1 1280 x 800".
 *
 * Ảnh `welcome-bg` là nền TRỌN VẸN do thiết kế cung cấp: đã gồm logo, slogan,
 * tiêu đề, đường kẻ trái tim và cả 3 dòng dịch vụ. Màn này chỉ phủ thêm hai nút.
 *
 * Vì chữ đã nằm trong ảnh, hai nút phải DÍNH theo ảnh chứ không theo khung nhìn.
 * Nếu đặt nút theo phần trăm của khung nhìn thì mỗi khổ màn cắt ảnh một kiểu,
 * nút sẽ trôi khỏi chỗ trống bên dưới danh sách dịch vụ. Nên bên trong có một
 * "sân khấu" khoá đúng tỉ lệ ảnh, phóng to vừa đủ phủ kín khung nhìn, và nút
 * được đặt theo phần trăm của SÂN KHẤU.
 *
 * Đã kiểm lại trên cả bốn khổ màn đích, nút luôn nằm trong vùng nhìn thấy.
 */
export const Step0Welcome: React.FC<Step0Props> = ({ onLogin, onRegister }) => {
  const background = useImage('welcome-bg');
  const hero = useContent('step0', 'step0.hero');
  const { hasBridge, error, retrySso } = useAuth();

  return (
    <div className="relative w-full h-screen overflow-hidden bg-hero-2">
      {/* Sân khấu: luôn phủ kín khung nhìn mà vẫn giữ đúng tỉ lệ ảnh */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{
          width: `max(100vw, calc(100vh * ${RATIO}))`,
          height: STAGE_H,
          backgroundImage: background ? `url(${assetUrl(background.webp)})` : undefined,
          backgroundSize: '100% 100%',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <button
          type="button"
          onClick={onLogin}
          style={buttonStyle(TOP_LOGIN)}
          className="rounded-xl bg-linear-to-b from-login-from to-login-to text-white font-bold shadow-lg hover:brightness-110 transition-[filter] cursor-pointer"
        >
          {hero?.ctaLabel ?? 'Đăng nhập'}
        </button>

        <button
          type="button"
          onClick={onRegister}
          style={buttonStyle(TOP_SIGNUP)}
          className="rounded-xl bg-linear-to-b from-signup-from to-signup-to text-brand-text font-bold shadow-md hover:brightness-105 transition-[filter] cursor-pointer"
        >
          Đăng ký
        </button>
      </div>

      {/* [R-4] SSO hỏng thì cho thử lại ngay tại màn đầu.
          Neo vào khung nhìn chứ không vào sân khấu: đây là thông báo lỗi, phải
          thấy được ngay dù ảnh bị cắt kiểu gì. */}
      {error && hasBridge && (
        <div className="absolute z-10 bottom-4 left-4 right-4 sm:right-auto sm:max-w-md rounded-xl border border-amber-300 bg-amber-50 p-3">
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
    </div>
  );
};
