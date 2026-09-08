import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  ApiError,
  ApiMe,
  ApiProfile,
  createSsoSession,
  devLogin,
  getMe,
  logout as apiLogout,
  deleteDraft,
  onSessionExpired,
  setSessionToken,
} from './client';

/**
 * Phiên đăng nhập.
 *
 * [R-1.5] Trên SmartScreen, Native Shell bơm profile vào `window.HomeHub`;
 * app tự đổi lấy token của MiniApp, người dùng KHÔNG phải đăng nhập lại.
 * Màn Step1Login (SĐT) chỉ là đường lùi cho máy dev — backend chặn bằng
 * ALLOW_DEV_LOGIN=false khi lên Store.
 *
 * [R-3.3] Token giữ trong bộ nhớ, không ghi ra storage.
 */

/** Hình dạng bridge do Native Shell cung cấp. Không có ở máy dev. */
interface HomeHubBridge {
  auth?: {
    getToken?: () => Promise<string> | string;
    getProfile?: () => Promise<HomeHubProfile> | HomeHubProfile;
  };
  device?: { getSerial?: () => Promise<string> | string };
}

interface HomeHubProfile {
  householdId: string;
  profileId: string;
  displayName: string;
  phone?: string;
  avatarUrl?: string;
  memberRole?: 'chu_ho' | 'thanh_vien' | 'tre_em' | 'khach';
  province?: string;
  householdName?: string;
}

declare global {
  interface Window {
    HomeHub?: HomeHubBridge;
  }
}

export type AuthStatus =
  | 'checking' // đang thử SSO
  | 'anonymous' // chưa có phiên -> hiện Welcome/Login
  | 'authenticated';

interface AuthValue {
  status: AuthStatus;
  profile: ApiProfile | null;
  me: ApiMe | null;
  error: ApiError | null;
  /** true khi chạy trên SmartScreen (có JS Bridge) -> ẩn màn đăng nhập SĐT. */
  hasBridge: boolean;
  loginWithPhone: (phone: string) => Promise<void>;
  retrySso: () => void;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthValue>({
  status: 'checking',
  profile: null,
  me: null,
  error: null,
  hasBridge: false,
  loginWithPhone: async () => {},
  retrySso: () => {},
  signOut: async () => {},
});

async function resolveBridgeSession(signal: AbortSignal) {
  const bridge = window.HomeHub;
  if (!bridge?.auth?.getProfile) return null;

  const profile = await bridge.auth.getProfile();
  const homehubToken = bridge.auth.getToken ? await bridge.auth.getToken() : undefined;
  const deviceSerial = bridge.device?.getSerial ? await bridge.device.getSerial() : undefined;

  return createSsoSession(
    {
      homehubToken,
      deviceSerial,
      household: {
        homehubHouseholdId: profile.householdId,
        displayName: profile.householdName,
        province: profile.province,
      },
      profile: {
        homehubProfileId: profile.profileId,
        displayName: profile.displayName,
        phone: profile.phone,
        avatarUrl: profile.avatarUrl,
        memberRole: profile.memberRole ?? 'thanh_vien',
      },
    },
    signal,
  );
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<AuthStatus>('checking');
  const [profile, setProfile] = useState<ApiProfile | null>(null);
  const [me, setMe] = useState<ApiMe | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [attempt, setAttempt] = useState(0);

  const hasBridge = typeof window !== 'undefined' && Boolean(window.HomeHub?.auth?.getProfile);

  /**
   * Lúc mở app ta CHỦ ĐỘNG thử /auth/me để dò xem cookie còn phiên không.
   * Lần mở đầu tiên chắc chắn 401 — đó là bình thường, không phải "hết hạn",
   * nên cờ này chặn không cho hiện cảnh báo trong giai đoạn dò.
   */
  const probing = useRef(true);

  // Phiên hết hạn giữa chừng -> quay về màn đăng nhập [R-4]
  useEffect(
    () =>
      onSessionExpired(() => {
        setProfile(null);
        setMe(null);
        setStatus('anonymous');
        if (!probing.current) {
          setError(new ApiError('SESSION_EXPIRED', 'Phiên đã hết hạn, vui lòng đăng nhập lại'));
        }
      }),
    [],
  );

  /**
   * Khôi phục phiên khi mở app (kể cả sau F5).
   *
   * Thứ tự thử:
   *  1. Cookie phiên còn hạn -> /auth/me trả 200, vào thẳng, KHÔNG bắt đăng nhập lại.
   *  2. Có JS Bridge -> đổi SSO của HomeHub lấy phiên mới [R-1.5].
   *  3. Không có gì -> về màn chào.
   *
   * Cookie là httpOnly nên JS không đọc được token; trình duyệt tự gửi kèm.
   * Vì vậy cách duy nhất để biết phiên còn sống là thử gọi /auth/me.
   */
  useEffect(() => {
    const controller = new AbortController();

    (async () => {
      setError(null);
      probing.current = true;

      // 1. Thử phiên sẵn có từ cookie
      try {
        const meData = await getMe(controller.signal);
        if (controller.signal.aborted) return;
        setMe(meData);
        setProfile(meData.profile);
        setStatus('authenticated');
        return;
      } catch (err) {
        if ((err as Error)?.name === 'AbortError') return;
        // Chưa có phiên là chuyện bình thường lúc mở lần đầu -> không báo lỗi
      } finally {
        probing.current = false;
      }
      if (controller.signal.aborted) return;

      // 2. Chưa có phiên -> thử SSO của HomeHub
      try {
        const session = await resolveBridgeSession(controller.signal);
        if (controller.signal.aborted) return;

        if (!session) {
          // Máy dev: không có bridge -> chờ người dùng bấm đăng nhập
          setStatus('anonymous');
          return;
        }
        setSessionToken(session.token);
        setProfile(session.profile);
        const meData = await getMe(controller.signal);
        if (controller.signal.aborted) return;
        setMe(meData);
        setProfile(meData.profile ?? session.profile);
        setStatus('authenticated');
      } catch (err) {
        if ((err as Error)?.name === 'AbortError') return;
        setSessionToken(null);
        setStatus('anonymous');
        setError(
          err instanceof ApiError ? err : new ApiError('INTERNAL_ERROR', 'Không tạo được phiên'),
        );
      }
    })();

    // [R-2.5] Cleanup bắt buộc
    return () => controller.abort();
  }, [attempt]);

  const loginWithPhone = useCallback(async (phone: string) => {
    setError(null);
    const session = await devLogin(phone);
    setSessionToken(session.token);
    setProfile(session.profile);
    const meData = await getMe();
    setMe(meData);
    setProfile(meData.profile ?? session.profile);
    setStatus('authenticated');
  }, []);

  const signOut = useCallback(async () => {
    // Hộp thoại xác nhận có hứa "thông tin nhập dở sẽ không được giữ lại"
    // -> xoá đơn dở TRƯỚC khi thu hồi phiên (sau đó là hết quyền gọi API).
    try {
      await deleteDraft();
    } catch {
      // không xoá được nháp cũng không được chặn việc đăng xuất
    }
    try {
      await apiLogout();
    } catch {
      // đăng xuất phía server hỏng cũng vẫn phải xoá phiên phía client
    }
    setSessionToken(null);
    setProfile(null);
    setMe(null);
    setStatus('anonymous');
  }, []);

  const value: AuthValue = {
    status,
    profile,
    me,
    error,
    hasBridge,
    loginWithPhone,
    retrySso: () => setAttempt((n) => n + 1),
    signOut,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const useAuth = () => useContext(Ctx);
