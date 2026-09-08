/**
 * Client gọi API backend (../vnpt-api).
 *
 * Dùng đường dẫn tương đối `/api/v1/...` để luôn cùng origin với FE:
 * ở dev thì Vite proxy chuyển tiếp, khi deploy thì reverse proxy đứng trước.
 * Nhờ vậy không phải khai báo thêm domain vào whitelist CSP (README §3.2).
 *
 * [R-3.3] Token phiên chỉ nằm trong bộ nhớ tiến trình — không ghi vào
 * localStorage/sessionStorage. Mất token (reload) thì xin lại bằng SSO.
 */

/* ------------------------------------------------------------------ */
/* Kiểu dữ liệu                                                        */
/* ------------------------------------------------------------------ */

export interface ApiImage {
  code: string;
  kind: 'banner' | 'poster' | 'anh_nho' | 'icon' | 'minh_hoa';
  webp: string;
  avif: string | null;
  width: number;
  height: number;
  alt: string | null;
  color: string | null;
}

export interface ApiOption {
  value: string;
  label: string;
  description: string | null;
  icon: string | null;
  metadata: Record<string, unknown> | null;
  isDefault: boolean;
}

export interface ApiStep {
  code: string;
  title: string;
  subtitle: string | null;
  progressIndex: number | null;
  showProgress: number;
  showHotline: number;
  maxFields: number | null;
}

export interface Bootstrap {
  settings: Record<string, unknown>;
  options: Record<string, ApiOption[]>;
  steps: ApiStep[];
  navTabs: { code: string; label: string; icon: string | null; screen: string; position: string }[];
  content: Record<string, unknown[]>;
  serviceGroups: { code: string; name: string }[];
  /** Tra ảnh theo mã: images['dv-nguoi-gia'] */
  images: Record<string, ApiImage>;
}

export interface ApiService {
  id: number;
  code: string;
  title: string;
  subtitle: string | null;
  shortDescription: string | null;
  badgeLabel: string | null;
  groupCode: string | null;
  groupName: string | null;
  imageWebp: string | null;
  imageAvif: string | null;
  imageWidth: number | null;
  imageHeight: number | null;
  imageAlt: string | null;
  imageColor: string | null;
}

export interface ApiPackage {
  id: number;
  code: string;
  category: 'theo_ngay' | 'theo_thang';
  label: string;
  sublabel: string | null;
  durationHours: number;
  durationMonths: number | null;
  minSessions: number | null;
  price: number;
  priceUnit: string | null;
}

export interface ApiMonthlyPlan {
  durationMonths: number;
  label: string;
  minSessions: number | null;
  packages: {
    code: string;
    durationHours: number;
    price: number;
    dailyPrice: number | null;
    savingPerSession: number;
  }[];
}

export interface ApiDisease {
  id: number;
  code: string;
  name: string;
  description: string | null;
  groupCode: string | null;
  requiresNote: number;
}

export interface ApiTimeSlotGroup {
  code: string;
  label: string;
  slots: { value: string; label: string; isDefault: boolean }[];
}

export interface ApiAddress {
  id: number;
  contactName: string | null;
  contactPhone: string | null;
  addressLine: string;
  ward: string | null;
  district: string | null;
  province: string | null;
  locationType: string;
  hospitalName: string | null;
  latitude: number | null;
  longitude: number | null;
  note: string | null;
  isDefault: number;
}

export interface ApiProfile {
  id: number;
  displayName: string;
  phone: string | null;
  avatarUrl: string | null;
  memberRole: string;
  householdName?: string | null;
}

export interface ApiSession {
  token: string;
  expiresInHours: number;
  profile: ApiProfile;
}

export interface ApiRecipient {
  id: number;
  fullName: string | null;
  gender: string | null;
  age: number | null;
  relationship: string | null;
  specialNotes: string | null;
  isDefault: number;
  diseases: { code: string; name: string; note: string | null }[];
}

/** Đơn đang nhập dở (bảng don_nhap_do) — dùng để phục hồi sau khi F5. */
export interface ApiDraft {
  currentStep: string;
  payload: Record<string, unknown>;
  entrySource?: string;
  expiresAt: string;
  updatedAt?: string;
}

export interface ApiMe {
  profile: ApiProfile;
  defaultAddress: ApiAddress | null;
  /** Kèm sẵn `diseases` để step6 tick lại tiền sử bệnh đã lưu. */
  defaultRecipient: ApiRecipient | null;
  consents?: { scope: string; granted: number }[];
  draft?: ApiDraft | null;
  unreadNotifications?: number;
}

export interface ApiQuoteSession {
  /** yyyy-mm-dd */
  sessionDate: string;
  /** "yyyy-mm-dd HH:mm:ss" */
  startsAt: string;
  endsAt: string;
  durationHours: number;
}

/** Kết quả /bookings/quote — nguồn sự thật duy nhất về giá, FE không tự tính. */
export interface ApiQuote {
  service: { code: string; title: string };
  package: {
    code: string;
    label: string;
    sublabel: string | null;
    category: 'theo_ngay' | 'theo_thang';
    durationHours: number;
    durationMonths: number | null;
  };
  sessions: ApiQuoteSession[];
  pricing: {
    unitPrice: number;
    sessionCount: number;
    subtotalAmount: number;
    surchargeAmount: number;
    discountAmount: number;
    totalAmount: number;
  };
  voucher: { code: string; name: string } | null;
  firstServiceDate: string | null;
  lastServiceDate: string | null;
}

export interface ApiVoucher {
  code: string;
  name: string;
  discountType: string;
  discountValue: number;
  maxDiscountAmount: number | null;
  minOrderAmount: number | null;
  discountAmount: number;
  usable: boolean | number;
  reason: string | null;
}

/** Đơn đã tạo — POST /bookings trả nguyên chi tiết đơn. */
export interface ApiBookingDetail {
  id: number;
  code: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  serviceTitle: string;
  packageLabel: string;
  packageCategory: 'theo_ngay' | 'theo_thang';
  durationHours: number;
  durationMonths: number | null;
  bookerName: string;
  bookerPhone: string;
  addressText: string;
  locationType: string;
  recipientGender: string | null;
  recipientAge: number | null;
  startTime: string;
  firstServiceDate: string | null;
  lastServiceDate: string | null;
  sessionCount: number;
  notes: string | null;
  unitPrice: number;
  subtotalAmount: number;
  surchargeAmount: number;
  discountAmount: number;
  totalAmount: number;
  voucherCode: string | null;
  createdAt: string;
  sessions: (ApiQuoteSession & { id: number; status: string; caregiverName: string | null })[];
  diseases: { code: string; name: string; note: string | null }[];
}

/** Tham số chung của /bookings/quote và POST /bookings. */
export interface QuoteInput {
  serviceCode: string;
  packageCode: string;
  dates: string[];
  startTime: string;
  voucherCode?: string | null;
}

export interface CreateBookingInput extends QuoteInput {
  addressId?: number;
  careRecipientId?: number;
  recipient?: {
    gender: 'nam' | 'nu' | 'khac';
    age: number;
    fullName?: string | null;
    relationship?: string | null;
    diseaseCodes: string[];
    saveForNext: boolean;
  };
  paymentMethod?: 'tien_mat' | 'vi_homehub' | 'vnpt_pay' | 'chuyen_khoan';
  notes?: string | null;
  entrySource?: 'trang_chu' | 'tro_ly_ai' | 'banner' | 'thong_bao' | 'truc_tiep';
}

/* ------------------------------------------------------------------ */
/* Lỗi                                                                 */
/* ------------------------------------------------------------------ */

/** Khớp 6 trạng thái bắt buộc của quy chuẩn MiniApp (README §4). */
export type ApiErrorCode =
  | 'SESSION_EXPIRED'
  | 'UNAUTHENTICATED'
  | 'NO_PERMISSION'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'CONFLICT'
  | 'INTERNAL_ERROR'
  | 'NO_INTERNET';

export class ApiError extends Error {
  constructor(
    readonly code: ApiErrorCode,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface Envelope<T> {
  ok: boolean;
  data?: T;
  error?: { code: ApiErrorCode; message: string; details?: unknown };
}

/* ------------------------------------------------------------------ */
/* Phiên làm việc — chỉ giữ trong bộ nhớ [R-3.3]                        */
/* ------------------------------------------------------------------ */

let sessionToken: string | null = null;
const expiredListeners = new Set<() => void>();

export const setSessionToken = (token: string | null) => {
  sessionToken = token;
};
export const getSessionToken = () => sessionToken;

/** Đăng ký callback khi phiên hết hạn để app đưa người dùng về màn đăng nhập. */
export function onSessionExpired(fn: () => void): () => void {
  expiredListeners.add(fn);
  return () => {
    expiredListeners.delete(fn);
  };
}

/* ------------------------------------------------------------------ */
/* Lớp gọi HTTP                                                        */
/* ------------------------------------------------------------------ */

/**
 * Gốc của backend.
 *
 * - Web (dev & deploy sau reverse proxy): để trống -> gọi đường dẫn tương đối
 *   `/api/v1/...`, cùng origin, cookie phiên đi kèm tự nhiên.
 * - Gói APK / .vma: không có proxy nên phải trỏ tuyệt đối tới backend bằng
 *   `VITE_API_BASE_URL` lúc build (vd https://vnpt-san-api.fly.dev).
 *
 * [readme §4] Domain điền ở đây cũng chính là domain phải khai trong
 * `allowedNetworkDomains` của app.json, nếu không CSP của Native Shell sẽ chặn.
 */
const API_ORIGIN = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/+$/, '');

/** true khi backend nằm khác origin -> cookie phải gửi kiểu cross-site. */
export const isCrossOrigin = API_ORIGIN !== '';

/**
 * Gốc phục vụ ảnh tĩnh (`/media/images/*`), tách khỏi gốc API.
 *
 * Mặc định trùng `API_ORIGIN`: backend tự phục vụ ảnh, đúng như khi chạy dev
 * hoặc sau reverse proxy.
 *
 * Web tĩnh (GitHub Pages) phải đặt `VITE_MEDIA_BASE_URL=.` để lấy ảnh đã copy
 * sẵn vào bundle. Lý do: thẻ `<img>`/`<source>` không gắn được header, nên nếu
 * trỏ thẳng vào một tunnel ngrok free thì mọi ảnh sẽ nhận trang cảnh báo
 * ERR_NGROK_6024 thay vì dữ liệu ảnh (xem `NGROK_HEADER` bên dưới).
 */
const MEDIA_ORIGIN = (import.meta.env.VITE_MEDIA_BASE_URL ?? API_ORIGIN).replace(/\/+$/, '');

/** Đường dẫn tuyệt đối cho ảnh/tệp tĩnh backend trả về (vd /media/images/x.webp). */
export const assetUrl = (path: string | null | undefined): string =>
  !path ? '' : /^https?:\/\//i.test(path) ? path : `${MEDIA_ORIGIN}${path}`;

const BASE = `${API_ORIGIN}/api/v1`;

/**
 * Bỏ qua trang cảnh báo của ngrok free.
 *
 * Tunnel ngrok gói Free chặn mọi request có User-Agent trình duyệt bằng một
 * trang xác nhận (ERR_NGROK_6024) trả về HTTP 200 — tức fetch không báo lỗi mà
 * nhận HTML rác thay cho JSON. Header này tắt trang đó.
 *
 * Chỉ gắn khi backend nằm khác origin: cùng origin thì không có ngrok ở giữa,
 * mà thêm header lạ lại biến request thành "non-simple" và sinh preflight thừa.
 * Backend phải khai header này trong `Access-Control-Allow-Headers`.
 */
const NGROK_HEADER: Record<string, string> = isCrossOrigin
  ? { 'ngrok-skip-browser-warning': 'true' }
  : {};

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  signal?: AbortSignal;
  /** Bỏ qua việc gắn Authorization (endpoint công khai). */
  anonymous?: boolean;
}

async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, signal, anonymous = false } = opts;

  const headers: Record<string, string> = { Accept: 'application/json', ...NGROK_HEADER };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (!anonymous && sessionToken) headers.Authorization = `Bearer ${sessionToken}`;

  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      signal,
      // Khác origin (APK) thì phải 'include' cookie phiên mới được gửi kèm
      credentials: isCrossOrigin ? 'include' : 'same-origin',
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (err) {
    // fetch chỉ reject khi mất mạng / bị CSP chặn — phân biệt với lỗi HTTP
    if ((err as Error)?.name === 'AbortError') throw err;
    throw new ApiError('NO_INTERNET', 'Không có kết nối tới máy chủ');
  }

  if (res.status === 204) return undefined as T;

  let envelope: Envelope<T>;
  try {
    envelope = (await res.json()) as Envelope<T>;
  } catch {
    throw new ApiError('INTERNAL_ERROR', `Máy chủ trả về dữ liệu không hợp lệ (HTTP ${res.status})`);
  }

  if (!res.ok || !envelope.ok) {
    const code = envelope.error?.code ?? 'INTERNAL_ERROR';
    if (code === 'SESSION_EXPIRED' || code === 'UNAUTHENTICATED') {
      sessionToken = null;
      for (const fn of expiredListeners) fn();
    }
    throw new ApiError(
      code,
      envelope.error?.message ?? `Lỗi máy chủ (HTTP ${res.status})`,
      envelope.error?.details,
    );
  }
  return envelope.data as T;
}

/* ------------------------------------------------------------------ */
/* Endpoint                                                            */
/* ------------------------------------------------------------------ */

export const getBootstrap = (signal?: AbortSignal) =>
  request<Bootstrap>('/bootstrap', { signal, anonymous: true });

export const getServices = (signal?: AbortSignal) =>
  request<ApiService[]>('/catalog/services', { signal, anonymous: true });

export const getPackages = (
  serviceCode: string,
  category?: 'theo_ngay' | 'theo_thang',
  signal?: AbortSignal,
) =>
  request<ApiPackage[]>(
    `/catalog/services/${encodeURIComponent(serviceCode)}/packages` +
      (category ? `?category=${category}` : ''),
    { signal, anonymous: true },
  );

export const getMonthlyPlans = (serviceCode: string, signal?: AbortSignal) =>
  request<ApiMonthlyPlan[]>(`/catalog/services/${encodeURIComponent(serviceCode)}/monthly-plans`, {
    signal,
    anonymous: true,
  });

export const getDiseases = (signal?: AbortSignal) =>
  request<ApiDisease[]>('/catalog/diseases', { signal, anonymous: true });

export const getTimeSlots = (signal?: AbortSignal) =>
  request<ApiTimeSlotGroup[]>('/catalog/time-slots', { signal, anonymous: true });

export const getOptions = (setCode: string, signal?: AbortSignal) =>
  request<ApiOption[]>(`/catalog/options/${encodeURIComponent(setCode)}`, {
    signal,
    anonymous: true,
  });

/** [R-1.5] SSO của HomeHub — luồng chính thức trên SmartScreen. */
export const createSsoSession = (payload: unknown, signal?: AbortSignal) =>
  request<ApiSession>('/auth/session', { method: 'POST', body: payload, signal, anonymous: true });

/** Chỉ chạy khi ALLOW_DEV_LOGIN=true ở backend; bản Store trả NO_PERMISSION. */
export const devLogin = (phone: string, signal?: AbortSignal) =>
  request<ApiSession>('/auth/dev-login', {
    method: 'POST',
    body: { phone },
    signal,
    anonymous: true,
  });

export const getMe = (signal?: AbortSignal) => request<ApiMe>('/auth/me', { signal });

export const logout = (signal?: AbortSignal) =>
  request<unknown>('/auth/logout', { method: 'POST', signal });

export const getAddresses = (signal?: AbortSignal) => request<ApiAddress[]>('/addresses', { signal });

/* --- Đơn nhập dở: giữ tiến trình wizard ở server, phục hồi sau khi F5 --- */

export const getDraft = (signal?: AbortSignal) =>
  request<ApiDraft | null>('/bookings/draft', { signal });

export const saveDraft = (
  body: { currentStep: string; payload: Record<string, unknown>; entrySource?: string },
  signal?: AbortSignal,
) => request<ApiDraft>('/bookings/draft', { method: 'PUT', body, signal });

export const deleteDraft = (signal?: AbortSignal) =>
  request<{ deleted: boolean }>('/bookings/draft', { method: 'DELETE', signal });

export const getQuote = (payload: QuoteInput, signal?: AbortSignal) =>
  request<ApiQuote>('/bookings/quote', { method: 'POST', body: payload, signal });

export const getVouchers = (
  params: { serviceCode: string; packageCode: string; sessionCount: number },
  signal?: AbortSignal,
) =>
  request<ApiVoucher[]>(
    `/bookings/vouchers?serviceCode=${encodeURIComponent(params.serviceCode)}` +
      `&packageCode=${encodeURIComponent(params.packageCode)}` +
      `&sessionCount=${params.sessionCount}`,
    { signal },
  );

export const createBooking = (payload: CreateBookingInput, signal?: AbortSignal) =>
  request<ApiBookingDetail>('/bookings', { method: 'POST', body: payload, signal });

export { request as apiRequest };
