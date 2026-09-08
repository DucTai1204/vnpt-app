import React from 'react';
import { AlertCircle, Inbox, Loader2, LockKeyhole, RefreshCw, WifiOff } from 'lucide-react';

/**
 * 6 trạng thái bắt buộc của quy chuẩn MiniApp (README §4):
 * Loading / Empty / Error / No Internet / No Permission / Session Expired.
 *
 * Dùng chung cho cả màn hình đầy và khối nhỏ trong trang (`inline`).
 */

export type StatusKind =
  | 'loading'
  | 'empty'
  | 'error'
  | 'offline'
  | 'no-permission'
  | 'session-expired';

const PRESET: Record<
  StatusKind,
  { icon: React.ElementType; title: string; hint: string; tone: string }
> = {
  loading: {
    icon: Loader2,
    title: 'Đang tải...',
    hint: 'Vui lòng đợi trong giây lát.',
    tone: 'text-[#0B2E6B]',
  },
  empty: {
    icon: Inbox,
    title: 'Chưa có dữ liệu',
    hint: 'Hiện chưa có mục nào để hiển thị.',
    tone: 'text-stone-500',
  },
  error: {
    icon: AlertCircle,
    title: 'Đã xảy ra lỗi',
    hint: 'Vui lòng thử lại sau ít phút.',
    tone: 'text-[#D42A2A]',
  },
  offline: {
    icon: WifiOff,
    title: 'Không có kết nối',
    hint: 'Kiểm tra kết nối mạng của thiết bị rồi thử lại.',
    tone: 'text-[#D42A2A]',
  },
  'no-permission': {
    icon: LockKeyhole,
    title: 'Không có quyền truy cập',
    hint: 'Tài khoản của bạn chưa được cấp quyền cho chức năng này.',
    tone: 'text-amber-600',
  },
  'session-expired': {
    icon: LockKeyhole,
    title: 'Phiên đã hết hạn',
    hint: 'Vui lòng đăng nhập lại để tiếp tục.',
    tone: 'text-amber-600',
  },
};

interface AppStatusProps {
  kind: StatusKind;
  /** Ghi đè phần mô tả khi backend trả thông điệp cụ thể hơn. */
  message?: string;
  title?: string;
  onRetry?: () => void;
  retryLabel?: string;
  /** Hiển thị gọn trong một khối thay vì chiếm cả màn hình. */
  inline?: boolean;
}

export const AppStatus: React.FC<AppStatusProps> = ({
  kind,
  message,
  title,
  onRetry,
  retryLabel = 'Thử lại',
  inline = false,
}) => {
  const preset = PRESET[kind];
  const Icon = preset.icon;

  return (
    <div
      role={kind === 'loading' ? 'status' : 'alert'}
      aria-live="polite"
      className={
        inline
          ? 'flex flex-col items-center justify-center gap-3 rounded-2xl border border-stone-200 bg-white p-8 text-center'
          : 'min-h-screen flex flex-col items-center justify-center gap-3 bg-stone-50 px-6 text-center'
      }
    >
      <Icon
        className={`w-8 h-8 ${preset.tone} ${kind === 'loading' ? 'animate-spin' : ''}`}
        aria-hidden="true"
      />
      <h2 className="text-base font-bold text-[#0B2E6B]">{title ?? preset.title}</h2>
      <p className="max-w-sm text-xs leading-relaxed text-stone-600">{message ?? preset.hint}</p>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-2 inline-flex items-center gap-2 rounded-xl bg-[#0B2E6B] px-5 py-2.5 text-xs font-bold text-white transition-colors hover:bg-[#082052] cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          {retryLabel}
        </button>
      )}
    </div>
  );
};
