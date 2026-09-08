/// <reference types="vite/client" />

/**
 * Biến môi trường build-time của Vite.
 * Khai báo tường minh để TypeScript bắt lỗi khi gõ sai tên biến.
 */
interface ImportMetaEnv {
  /**
   * Gốc backend cho bản đóng gói (APK/.vma) — vd https://vnpt-san-api.fly.dev
   * Bỏ trống ở bản web để gọi đường dẫn tương đối cùng origin.
   */
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
