import { useEffect } from 'react';

/**
 * Tích hợp vỏ native (APK Capacitor).
 *
 * Toàn bộ file này KHÔNG chạy gì khi mở bằng trình duyệt: các plugin
 * `@capacitor/*` chỉ nạp động khi thật sự đang chạy trong app native, nên bản
 * web (dev, GitHub Pages, và cả gói .vma trên SmartScreen) không tải thêm byte
 * nào và không đổi hành vi.
 *
 * Trên SmartScreen thật, những việc này do Native Shell của VNPT lo (readme §0);
 * ở đây ta tự làm phần tương đương cho APK demo.
 */

export interface NativeShellOptions {
  /** Quay lại bước trước. Trả về false nếu đang ở màn đầu (thoát app). */
  onBack: () => boolean;
}

/** Chỉ true khi đang chạy trong APK/IPA, không phải trình duyệt. */
export const isNativeApp = (): boolean => {
  const cap = (globalThis as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  return typeof cap?.isNativePlatform === 'function' && cap.isNativePlatform();
};

export function useNativeShell({ onBack }: NativeShellOptions): void {
  useEffect(() => {
    if (!isNativeApp()) return;

    let disposed = false;
    const cleanups: Array<() => void> = [];

    (async () => {
      /**
       * Nút back cứng của Android.
       *
       * Mặc định Capacitor cho WebView tự xử lý, mà SPA này không dùng History
       * API nên bấm back là thoát thẳng app — mất hết tiến trình đang nhập.
       * Chặn lại và điều hướng theo state của app; chỉ thoát khi đã ở màn đầu.
       */
      const { App } = await import('@capacitor/app');
      if (disposed) return;

      const backHandle = await App.addListener('backButton', () => {
        const handled = onBack();
        if (!handled) void App.exitApp();
      });
      cleanups.push(() => void backHandle.remove());

      // Thanh trạng thái theo màu thương hiệu
      try {
        const { StatusBar, Style } = await import('@capacitor/status-bar');
        await StatusBar.setStyle({ style: Style.Light });
        await StatusBar.setBackgroundColor({ color: '#0A5CD6' });
      } catch {
        // Máy không có status bar (TV box) -> bỏ qua, không được làm hỏng app
      }

      // Giao diện đã sẵn sàng -> tắt splash
      try {
        const { SplashScreen } = await import('@capacitor/splash-screen');
        await SplashScreen.hide();
      } catch {
        // Splash có thể đã tự tắt
      }
    })();

    // [R-2.5] Cleanup bắt buộc: gỡ listener khi unmount
    return () => {
      disposed = true;
      for (const fn of cleanups) fn();
    };
  }, [onBack]);
}
