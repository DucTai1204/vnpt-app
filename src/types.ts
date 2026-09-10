/**
 * Kiểu dữ liệu của luồng đặt lịch.
 *
 * Ở đây KHÔNG còn hằng số nghiệp vụ nào: danh sách dịch vụ, bảng giá, khung
 * giờ, bệnh lý, hotline, thông tin người đặt... đều lấy từ backend
 * (`/api/v1/bootstrap` và `/api/v1/catalog/*`). Xem `src/api/client.ts`.
 */

export type StepId =
  | 'step0' // Welcome / Splash
  | 'step1' // Login
  | 'step2' // Home / Service Selection
  | 'step3' // Update Address
  | 'step4' // Select Package Category (Daily vs Monthly)
  | 'step5a' // Date & Time (Daily)
  | 'step5b' // Date & Time (Monthly)
  | 'step6' // Recipient Health Info
  | 'step7'; // Confirmation & Payment

/** Gói dịch vụ đang chọn — dữ liệu gốc từ `/catalog/services/:code/packages`. */
export interface DurationOption {
  /** Mã gói trong DB (goi_dich_vu.ma) — dùng khi gửi báo giá/tạo đơn. */
  code: string;
  label: string;
  sublabel: string;
  hours: number;
  price: number;
}

export interface BookingState {
  currentStep: StepId;
  previousStepHistory: StepId[];

  // Người đặt — nạp từ /auth/me
  bookerName: string;
  bookerPhone: string;

  // Địa chỉ chăm sóc — nạp từ /auth/me (defaultAddress)
  addressId: number | null;
  address: string;
  /** Giá trị thuộc bộ lựa chọn `loai_dia_diem` của backend. */
  locationType: string;
  isDefaultAddress: boolean;

  // Dịch vụ đang chọn
  serviceCode: string;
  selectedService: string;

  // Hình thức đặt
  packageCategory: 'daily' | 'monthly';

  // Gói theo ngày
  packageCode: string;
  durationPackage: string;
  durationHours: number;
  price: number;

  // Ngày & giờ
  selectedDate: string; // ISO yyyy-mm-dd
  selectedDates: string[]; // Gói tháng: nhiều ngày
  /** Nhãn kỳ hạn tháng, lấy từ `/catalog/services/:code/monthly-plans`. */
  monthlyType: string;
  monthlyPlanCode: string;
  startTime: string; // "14:00"
  notes: string;

  // Người được chăm — nạp từ /auth/me (defaultRecipient)
  recipientId: number | null;
  /** Giá trị thuộc bộ lựa chọn `gioi_tinh`. */
  recipientGender: string;
  recipientAge: number;
  /** Mã bệnh lý (benh_ly.ma), không phải tên hiển thị. */
  selectedDiseases: string[];
  saveForNext: boolean;

  // Thanh toán — giá trị thuộc bộ `phuong_thuc_thanh_toan`
  paymentMethod: string;
  voucher: string;
}

/**
 * Trạng thái rỗng khi app vừa mở. Mọi trường nghiệp vụ để trống và sẽ được
 * `/auth/me` + `/bootstrap` điền vào, nên không có dữ liệu giả nào ở đây.
 */
export const EMPTY_BOOKING_STATE: BookingState = {
  currentStep: 'step1',
  previousStepHistory: [],

  bookerName: '',
  bookerPhone: '',

  addressId: null,
  address: '',
  locationType: '',
  isDefaultAddress: true,

  serviceCode: '',
  selectedService: '',

  packageCategory: 'daily',

  packageCode: '',
  durationPackage: '',
  durationHours: 0,
  price: 0,

  selectedDate: '',
  selectedDates: [],
  monthlyType: '',
  monthlyPlanCode: '',
  startTime: '',
  notes: '',

  recipientId: null,
  recipientGender: '',
  recipientAge: 0,
  selectedDiseases: [],
  saveForNext: true,

  paymentMethod: '',
  voucher: '',
};
