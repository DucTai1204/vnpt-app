import React, { createContext, useContext, useEffect, useState } from 'react';
import { ApiError, ApiImage, ApiOption, ApiStep, Bootstrap, getBootstrap } from './client';

/**
 * Nạp /api/v1/bootstrap đúng 1 lần cho cả app: cấu hình, tiêu đề từng bước,
 * bộ lựa chọn, nội dung màn hình và danh mục ảnh.
 *
 * [R-2.1] Gộp vào 1 request để không đụng trần 10 request đồng thời.
 * Mọi hằng số hiển thị đều lấy từ đây — FE không giữ bản sao cứng nào.
 */

export interface ContentBlock {
  code: string;
  screen: string | null;
  title: string | null;
  subtitle: string | null;
  body: string | null;
  ctaLabel: string | null;
  ctaScreen: string | null;
  badgeLabel: string | null;
  badgeIcon: string | null;
  imageWebp: string | null;
  imageAvif: string | null;
  imageWidth: number | null;
  imageHeight: number | null;
  imageAlt: string | null;
  imageColor: string | null;
}

interface BootstrapValue {
  data: Bootstrap | null;
  loading: boolean;
  error: ApiError | null;
  retry: () => void;
  image: (code: string) => ApiImage | null;
  setting: <T>(key: string, fallback: T) => T;
  step: (code: string) => ApiStep | null;
  options: (setCode: string) => ApiOption[];
  content: (screen: string, code?: string) => ContentBlock | null;
}

const EMPTY_OPTIONS: ApiOption[] = [];

const Ctx = createContext<BootstrapValue>({
  data: null,
  loading: true,
  error: null,
  retry: () => {},
  image: () => null,
  setting: (_key, fallback) => fallback,
  step: () => null,
  options: () => EMPTY_OPTIONS,
  content: () => null,
});

export const BootstrapProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<Bootstrap | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    getBootstrap(controller.signal)
      .then((res) => setData(res))
      .catch((err: unknown) => {
        if ((err as Error)?.name === 'AbortError') return;
        setError(
          err instanceof ApiError ? err : new ApiError('INTERNAL_ERROR', 'Không tải được cấu hình'),
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    // [R-2.5] Cleanup bắt buộc: huỷ request khi component unmount
    return () => controller.abort();
  }, [attempt]);

  const value: BootstrapValue = {
    data,
    loading,
    error,
    retry: () => setAttempt((n) => n + 1),

    image: (code) => data?.images?.[code] ?? null,

    setting: <T,>(key: string, fallback: T): T => {
      const raw = data?.settings?.[key];
      return (raw === undefined || raw === null ? fallback : raw) as T;
    },

    step: (code) => data?.steps?.find((s) => s.code === code) ?? null,

    options: (setCode) => data?.options?.[setCode] ?? EMPTY_OPTIONS,

    content: (screen, code) => {
      const blocks = (data?.content?.[screen] ?? []) as ContentBlock[];
      if (!code) return blocks[0] ?? null;
      return blocks.find((b) => b.code === code) ?? null;
    },
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const useBootstrap = () => useContext(Ctx);

/* --------------------------- đường tắt hay dùng --------------------------- */

/** Ảnh theo mã trong bảng tep_hinh_anh. */
export const useImage = (code: string) => useBootstrap().image(code);

/** Cấu hình công khai, vd useSetting('app.hotline', ''). */
export const useSetting = <T,>(key: string, fallback: T): T => useBootstrap().setting(key, fallback);

/** Tiêu đề/phụ đề của một bước, vd useStep('step1'). */
export const useStep = (code: string) => useBootstrap().step(code);

/** Bộ lựa chọn, vd useOptions('gioi_tinh'). */
export const useOptions = (setCode: string) => useBootstrap().options(setCode);

/** Khối nội dung của màn hình, vd useContent('step4', 'step4.the_theo_ngay'). */
export const useContent = (screen: string, code?: string) => useBootstrap().content(screen, code);
