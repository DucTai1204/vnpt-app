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
};

export default config;
