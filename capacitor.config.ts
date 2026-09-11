import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Vỏ Android cho phần web của MiniApp SAN.
 *
 * LƯU Ý VỀ TRACK TÍCH HỢP (readme §0): bản chính thức nộp cho VNPT HomeHub là
 * gói `.vma` chạy trong Native Shell của SmartScreen, KHÔNG phải APK. APK ở đây
 * là vỏ WebView tự dựng để demo/test trên máy Android hoặc TV box — đóng đúng
 * vai trò mà Native Shell đảm nhiệm trên SmartScreen thật.
 *
 * Toàn bộ giao diện nằm trong `dist/` (assets cục bộ), backend gọi tuyệt đối
 * qua `VITE_API_BASE_URL` khai lúc build.
 */

/**
 * [readme §3.1] Bản phát hành BẮT BUỘC HTTPS.
 * Chỉ bật cleartext khi test với backend HTTP trong mạng LAN:
 *   CAP_CLEARTEXT=true npm run apk:debug
 */
const allowCleartext = process.env.CAP_CLEARTEXT === 'true';

const config: CapacitorConfig = {
  appId: 'vn.vnpt.san.miniapp',
  appName: 'SAN Chăm sóc người già',
  webDir: 'dist',

  android: {
    // https://localhost -> WebView coi là secure context, cookie Secure hoạt động
    androidScheme: 'https',
    allowMixedContent: allowCleartext,
  },

  server: {
    cleartext: allowCleartext,
  },

  plugins: {
    SplashScreen: {
      /**
       * KHÔNG cho splash tự tắt.
       *
       * Mặc định Capacitor tắt splash sau vài giây, mà lúc đó app còn đang gọi
       * API nên người dùng thấy: splash -> màn trắng -> vòng xoay "Đang tải".
       * Để `false` rồi tự tắt trong `useNativeShell` khi dữ liệu đã về, người
       * dùng chỉ thấy splash liền một mạch tới lúc giao diện hiện ra.
       */
      launchAutoHide: false,
      backgroundColor: '#ffffff',
      showSpinner: false,
      // Mờ dần cho đỡ giật khi chuyển sang giao diện
      fadeOutDuration: 200,
    },
  },
};

export default config;
