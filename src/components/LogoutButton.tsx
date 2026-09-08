import React, { useState } from 'react';
import { Loader2, LogOut } from 'lucide-react';
import { useAuth } from '../api/AuthContext';

/**
 * Nút đăng xuất.
 *
 * Có bước xác nhận vì đăng xuất làm mất đơn đang nhập dở và thu hồi phiên
 * phía server. Sau khi đăng xuất, `status` chuyển 'anonymous' -> App tự đưa
 * người dùng về màn chào (xem useEffect trong App.tsx).
 *
 * [R-1.5] Trên SmartScreen phiên gắn với SSO của HomeHub, người dùng đổi
 * profile ở Native Shell chứ không đăng xuất trong MiniApp -> ẩn nút khi có
 * JS Bridge, trừ khi gọi với `alwaysShow`.
 */
interface LogoutButtonProps {
  /** Hiện cả khi chạy trên SmartScreen (dùng cho màn Tài khoản). */
  alwaysShow?: boolean;
  /** 'icon' cho thanh header chật, 'full' cho khối có chỗ rộng. */
  variant?: 'icon' | 'full';
  className?: string;
}

export const LogoutButton: React.FC<LogoutButtonProps> = ({
  alwaysShow = false,
  variant = 'icon',
  className = '',
}) => {
  const { signOut, hasBridge, profile } = useAuth();
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);

  if (hasBridge && !alwaysShow) return null;

  const doSignOut = async () => {
    setBusy(true);
    try {
      await signOut();
    } finally {
      setBusy(false);
      setAsking(false);
    }
  };

  return (
    <>
      {variant === 'icon' ? (
        <button
          type="button"
          onClick={() => setAsking(true)}
          title="Đăng xuất"
          aria-label="Đăng xuất"
          className={`p-2 rounded-full hover:bg-red-50 text-[#D42A2A] transition-colors cursor-pointer ${className}`}
        >
          <LogOut className="w-5 h-5" />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setAsking(true)}
          className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-red-200 bg-red-50 text-[#D42A2A] text-xs font-bold hover:bg-red-100 transition-colors cursor-pointer ${className}`}
        >
          <LogOut className="w-4 h-4" />
          <span>Đăng xuất</span>
        </button>
      )}

      {asking && (
        // [R-2.4] Nền mờ bằng màu đặc, không dùng backdrop-filter
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="logout-title"
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <h3 id="logout-title" className="text-base font-bold text-[#0B2E6B]">
              Đăng xuất khỏi {profile?.displayName ?? 'tài khoản'}?
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Thông tin bạn đang nhập dở sẽ không được giữ lại. Bạn sẽ quay về màn hình chào.
            </p>

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => setAsking(false)}
                disabled={busy}
                className="flex-1 py-2.5 rounded-xl bg-stone-100 text-stone-700 text-xs font-bold hover:bg-stone-200 transition-colors cursor-pointer disabled:opacity-60"
              >
                Ở lại
              </button>
              <button
                type="button"
                onClick={doSignOut}
                disabled={busy}
                className="flex-1 py-2.5 rounded-xl bg-[#D42A2A] text-white text-xs font-bold hover:bg-red-700 transition-colors cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {busy && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{busy ? 'Đang thoát...' : 'Đăng xuất'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
