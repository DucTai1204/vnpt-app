import React from 'react';
import { useAuth } from '../api/AuthContext';
import { useImage } from '../api/BootstrapContext';
import { assetUrl } from '../api/client';

/** Tỉ lệ ảnh nền gốc (1585x992) — sân khấu bên dưới khoá đúng tỉ lệ này. */
const RATIO = 1585 / 992;

/**
 * Màn chào — ảnh `welcome-bg` từ bộ thiết kế "1-man hinh chao 1 1280 x 800".
 *
 * Đây là màn GIỚI THIỆU, không phải màn thao tác: ảnh đã chứa sẵn logo, slogan,
 * tiêu đề và 3 dòng dịch vụ, nên màn này không có nút nào. App tự chuyển sang
 * trang chủ sau vài giây (xem `INTRO_MS` trong App.tsx).
 *
 * Sân khấu khoá đúng tỉ lệ ảnh rồi phóng vừa đủ phủ kín khung nhìn, thay cho
 * `background-size: cover` — cách này giữ được bố cục chữ trong ảnh y như thiết
 * kế trên mọi khổ màn, thay vì để trình duyệt tự cắt mỗi nơi một kiểu.
 */
export const Step0Welcome: React.FC = () => {
  const background = useImage('welcome-bg');
  const { hasBridge, error, retrySso } = useAuth();

  return (
    <div className="relative w-full h-screen overflow-hidden bg-hero-2">
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{
          width: `max(100vw, calc(100vh * ${RATIO}))`,
          height: `max(100vh, calc(100vw / ${RATIO}))`,
          backgroundImage: background ? `url(${assetUrl(background.webp)})` : undefined,
          backgroundSize: '100% 100%',
          backgroundRepeat: 'no-repeat',
        }}
      />

      {/* [R-4] SSO hỏng thì cho thử lại ngay tại màn đầu.
          Neo vào khung nhìn chứ không vào sân khấu: là thông báo lỗi nên phải
          thấy được dù ảnh bị cắt kiểu gì. */}
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
