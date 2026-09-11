import React, { useCallback, useEffect, useRef, useState } from 'react';
import { BackgroundDecoration } from './components/BackgroundDecoration';
import { Step0Welcome } from './components/Step0Welcome';
import { Step1Login } from './components/Step1Login';
import { Step2HomeServices } from './components/Step2HomeServices';
import { Step3UpdateAddress } from './components/Step3UpdateAddress';
import { Step4SelectPackage } from './components/Step4SelectPackage';
import { Step5ADateTimeDaily } from './components/Step5ADateTimeDaily';
import { Step5BDateTimeMonthly } from './components/Step5BDateTimeMonthly';
import { Step6HealthInfo } from './components/Step6HealthInfo';
import { Step7ConfirmPayment } from './components/Step7ConfirmPayment';
import { SuccessModal } from './components/SuccessModal';
import { AppStatus } from './components/AppStatus';

import { useAuth } from './api/AuthContext';
import { useBootstrap } from './api/BootstrapContext';
import { ApiBookingDetail, createBooking, deleteDraft, saveDraft } from './api/client';

import { BookingState, DurationOption, EMPTY_BOOKING_STATE, StepId } from './types';
import { useNativeShell } from './native/useNativeShell';

/**
 * Bao lâu thì rời màn chào. Màn này chỉ để giới thiệu, không có nút bấm.
 */
const INTRO_MS = 1800;

/**
 * TẠM THỜI: tự đăng nhập bằng tài khoản test để khỏi gõ tay khi dev.
 *
 * XOÁ TRƯỚC KHI NỘP STORE. Trên SmartScreen phiên đến từ SSO của HomeHub, và
 * backend production đặt ALLOW_DEV_LOGIN=false nên gọi vào sẽ nhận NO_PERMISSION
 * — lúc đó app đứng lại ở màn chào cho tới khi hết INTRO_MS rồi vào màn đăng nhập.
 */
const AUTO_LOGIN_PHONE = '0900000001';

export default function App() {
  const bootstrap = useBootstrap();
  const auth = useAuth();

  const [booking, setBooking] = useState<BookingState>(EMPTY_BOOKING_STATE);
  const [order, setOrder] = useState<ApiBookingDetail | null>(null);

  /** Hết giờ giới thiệu chưa. Màn chào giữ nguyên cho tới khi cờ này bật. */
  const [introDone, setIntroDone] = useState(false);
  const autoLoginTried = useRef(false);

  // Cấu hình đã về VÀ đã biết còn phiên hay không. Lỗi cũng tính là xong: phải
  // nhường màn hình cho app để người dùng thấy thông báo và nút thử lại.
  const bootDone = (!bootstrap.loading || Boolean(bootstrap.error)) && auth.status !== 'checking';

  /**
   * Đếm giờ từ lúc màn chào THẬT SỰ hiện, không phải từ lúc component gắn vào.
   * Đếm từ khi gắn thì phần lớn 1.8 giây bị nuốt vào lúc chờ API, người dùng
   * chỉ kịp thấy màn chào loé lên rồi biến mất.
   */
  useEffect(() => {
    if (!bootDone) return;
    const timer = setTimeout(() => setIntroDone(true), INTRO_MS);
    // [R-2.5] Cleanup bắt buộc
    return () => clearTimeout(timer);
  }, [bootDone]);

  /**
   * TẠM THỜI: tự đăng nhập tài khoản test ngay trong lúc màn chào đang hiện.
   * Nhờ chạy song song nên không tốn thêm thời gian chờ.
   */
  useEffect(() => {
    if (!AUTO_LOGIN_PHONE || auth.status !== 'anonymous' || autoLoginTried.current) return;
    autoLoginTried.current = true;
    void auth.loginWithPhone(AUTO_LOGIN_PHONE).catch(() => {
      // Backend tắt dev-login hoặc không có tài khoản -> rơi về đăng nhập tay
    });
  }, [auth.status, auth.loginWithPhone]);

  /** Hết giờ giới thiệu mà vẫn chưa vào được -> cho đăng nhập tay. */
  useEffect(() => {
    if (!introDone || auth.status !== 'anonymous') return;
    setBooking((prev) => (prev.currentStep === 'step0' ? { ...prev, currentStep: 'step1' } : prev));
  }, [introDone, auth.status]);

  /**
   * Nạp hồ sơ + địa chỉ + người được chăm mặc định từ /auth/me.
   * [R-4] Nhờ vậy UI phục hồi được khi storage bị xoá hay đổi profile.
   */
  useEffect(() => {
    if (auth.status !== 'authenticated' || !auth.me) return;

    const { profile, defaultAddress, defaultRecipient, draft } = auth.me;

    // Đơn đang nhập dở (bảng don_nhap_do) -> quay lại đúng bước trước khi F5.
    // [R-3.4] Tiến trình nằm ở server nên xoá storage / đổi máy vẫn phục hồi được.
    const restored = (draft?.payload ?? {}) as Partial<BookingState>;
    const restoredStep = draft?.currentStep as StepId | undefined;

    setBooking((prev) => ({
      ...prev,

      // Lớp 1 — mặc định của tài khoản (hồ sơ, địa chỉ, người được chăm)
      bookerName: profile.displayName ?? prev.bookerName,
      bookerPhone: profile.phone ?? prev.bookerPhone,

      addressId: defaultAddress?.id ?? prev.addressId,
      address: defaultAddress
        ? [
            defaultAddress.addressLine,
            defaultAddress.ward,
            defaultAddress.district,
            defaultAddress.province,
          ]
            .filter(Boolean)
            .join(', ')
        : prev.address,
      locationType: defaultAddress?.locationType ?? prev.locationType,
      isDefaultAddress: defaultAddress ? defaultAddress.isDefault === 1 : prev.isDefaultAddress,

      recipientId: defaultRecipient?.id ?? prev.recipientId,
      recipientGender: defaultRecipient?.gender ?? prev.recipientGender,
      recipientAge: defaultRecipient?.age ?? prev.recipientAge,
      selectedDiseases:
        defaultRecipient?.diseases?.map((d) => d.code) ?? prev.selectedDiseases,

      // Lớp 2 — đơn nhập dở ĐÈ LÊN mặc định: những gì người dùng tự sửa
      // (đổi địa chỉ, chọn gói, chọn ngày...) phải thắng giá trị mặc định.
      ...restored,

      // Đăng nhập xong sớm cũng phải chờ hết màn chào rồi mới chuyển.
      // Có đơn dở thì về đúng bước đó, không thì vào màn chọn dịch vụ.
      currentStep:
        !introDone && prev.currentStep === 'step0'
          ? 'step0'
          : restoredStep && restoredStep !== 'step0' && restoredStep !== 'step1'
            ? restoredStep
            : prev.currentStep === 'step0' || prev.currentStep === 'step1'
              ? 'step2'
              : prev.currentStep,
      previousStepHistory: [],
    }));
  }, [auth.status, auth.me, introDone]);

  /**
   * Lưu tiến trình lên server mỗi khi state đổi (hoãn 600ms để không spam API).
   * Nhờ vậy F5 giữa chừng vẫn quay lại đúng bước đang làm.
   */
  useEffect(() => {
    if (auth.status !== 'authenticated') return;
    if (booking.currentStep === 'step0' || booking.currentStep === 'step1') return;
    if (order) return; // đã đặt xong, không lưu nữa

    const controller = new AbortController();
    const timer = setTimeout(() => {
      const { currentStep, previousStepHistory: _skip, ...payload } = booking;
      void saveDraft(
        { currentStep, payload: payload as unknown as Record<string, unknown> },
        controller.signal,
      ).catch(() => {
        // Mất mạng lúc lưu nháp không được chặn thao tác của người dùng
      });
    }, 600);

    // [R-2.5] Cleanup bắt buộc
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [booking, auth.status, order]);

  // Phiên hết hạn giữa chừng -> quay về màn đầu
  useEffect(() => {
    if (auth.status === 'anonymous') {
      // [R-1.5][R-3.4] Xoá SẠCH state, không giữ lại tên/SĐT/địa chỉ của phiên
      // trước. Nếu chỉ đổi currentStep, người đăng nhập sau sẽ thấy dữ liệu của
      // người trước ở những trường mà /auth/me không trả về.
      setBooking(EMPTY_BOOKING_STATE);
      setOrder(null);
    }
  }, [auth.status]);

  const goToStep = (nextStep: StepId) => {
    setBooking((prev) => ({
      ...prev,
      previousStepHistory: [...prev.previousStepHistory, prev.currentStep],
      currentStep: nextStep,
    }));
  };

  const handleBack = () => {
    setBooking((prev) => {
      const history = [...prev.previousStepHistory];
      if (history.length === 0) {
        return { ...prev, currentStep: auth.status === 'authenticated' ? 'step2' : 'step1' };
      }
      const lastStep = history.pop()!;
      return { ...prev, previousStepHistory: history, currentStep: lastStep };
    });
  };

  // Step 2: chọn dịch vụ (giữ cả mã để các bước sau gọi API theo mã)
  const handleSelectService = (serviceCode: string, serviceTitle: string) => {
    setBooking((prev) => ({ ...prev, serviceCode, selectedService: serviceTitle }));
    goToStep('step3');
  };

  // Step 5A: chọn gói theo ngày
  const handleUpdateDuration = (opt: DurationOption) => {
    setBooking((prev) => ({
      ...prev,
      packageCode: opt.code,
      durationPackage: opt.label,
      durationHours: opt.hours,
      price: opt.price,
    }));
  };

  const handleToggleMonthlyDate = (dateStr: string) => {
    setBooking((prev) => ({
      ...prev,
      selectedDates: prev.selectedDates.includes(dateStr)
        ? prev.selectedDates.filter((d) => d !== dateStr)
        : [...prev.selectedDates, dateStr],
    }));
  };

  const handleToggleDisease = (diseaseCode: string) => {
    setBooking((prev) => ({
      ...prev,
      selectedDiseases: prev.selectedDiseases.includes(diseaseCode)
        ? prev.selectedDiseases.filter((d) => d !== diseaseCode)
        : [...prev.selectedDiseases, diseaseCode],
    }));
  };

  /** Step 7: gửi đơn thật lên backend (payload khớp `createSchema` của API). */
  const handleSubmitOrder = async () => {
    const created = await createBooking({
      serviceCode: booking.serviceCode,
      packageCode: booking.packageCode,
      dates: booking.packageCategory === 'daily' ? [booking.selectedDate] : booking.selectedDates,
      startTime: booking.startTime,
      voucherCode: booking.voucher || null,

      addressId: booking.addressId ?? undefined,
      careRecipientId: booking.recipientId ?? undefined,
      recipient: {
        gender: (booking.recipientGender || 'khac') as 'nam' | 'nu' | 'khac',
        age: booking.recipientAge,
        diseaseCodes: booking.selectedDiseases,
        saveForNext: booking.saveForNext,
      },

      paymentMethod: booking.paymentMethod as
        | 'tien_mat'
        | 'vi_homehub'
        | 'vnpt_pay'
        | 'chuyen_khoan',
      notes: booking.notes || null,
      entrySource: 'trang_chu',
    });
    setOrder(created);
    // Đặt xong thì bỏ đơn dở để lần sau mở app bắt đầu lại từ đầu
    void deleteDraft().catch(() => {});
  };

  const handleGoHome = () => {
    setOrder(null);
    setBooking({ ...EMPTY_BOOKING_STATE, currentStep: 'step2' });
  };

  /**
   * Nút back cứng của Android (chỉ có tác dụng trong APK).
   *
   * Trả về true nếu app đã tự xử lý; false thì vỏ native mới thoát app.
   * Thứ tự ưu tiên: đóng modal thành công -> lùi một bước -> thoát.
   */
  const handleHardwareBack = useCallback((): boolean => {
    if (order) {
      handleGoHome();
      return true;
    }
    // Màn chào và màn đăng nhập là đầu luồng -> hết đường lùi, để native thoát
    if (booking.currentStep === 'step0' || booking.currentStep === 'step1') return false;
    // Đã đăng nhập thì step2 là "trang chủ", lùi tiếp nữa là thoát
    if (booking.currentStep === 'step2' && booking.previousStepHistory.length === 0) return false;

    handleBack();
    return true;
  }, [order, booking.currentStep, booking.previousStepHistory.length]);

  // Trên APK, splash native che suốt quãng này nên không ai thấy màn "Đang tải"
  useNativeShell({ onBack: handleHardwareBack, ready: bootDone });

  // [R-4] Loading / No Internet / Error cho cấu hình dùng chung
  if (bootstrap.loading || auth.status === 'checking') {
    return <AppStatus kind="loading" />;
  }
  if (bootstrap.error) {
    return (
      <AppStatus
        kind={bootstrap.error.code === 'NO_INTERNET' ? 'offline' : 'error'}
        message={bootstrap.error.message}
        onRetry={bootstrap.retry}
      />
    );
  }

  return (
    <div className="min-h-screen relative font-sans text-stone-900 bg-stone-50 flex flex-col justify-between selection:bg-red-100 selection:text-[#D42A2A]">
      <BackgroundDecoration />

      {/* Bộ thiết kế không có thanh tiến trình: mỗi màn tự dựng ScreenHeader
          (nút back tròn + tiêu đề + pill hotline) ngay trong khung nội dung. */}
      <main className="relative z-10 flex-1 flex flex-col justify-center">
        {/* BƯỚC 0 – Màn chào. Không có nút, app tự chuyển sau INTRO_MS. */}
        {booking.currentStep === 'step0' && <Step0Welcome />}

        {/* BƯỚC 1 – Login. Là màn đầu của luồng thao tác nên KHÔNG truyền onBack:
            có truyền thì nút quay lại hiện ra nhưng bấm vào không đi đâu được. */}
        {booking.currentStep === 'step1' && (
          <Step1Login
            phone={booking.bookerPhone}
            onPhoneChange={(phone) => setBooking((prev) => ({ ...prev, bookerPhone: phone }))}
            onSubmit={() => goToStep('step2')}
          />
        )}

        {/* BƯỚC 2 – Home / Services */}
        {booking.currentStep === 'step2' && (
          <Step2HomeServices
            bookerName={booking.bookerName}
            selectedService={booking.selectedService}
            onSelectService={handleSelectService}
            onBack={handleBack}
          />
        )}

        {/* BƯỚC 3 – Update Address */}
        {booking.currentStep === 'step3' && (
          <Step3UpdateAddress
            bookerName={booking.bookerName}
            bookerPhone={booking.bookerPhone}
            address={booking.address}
            locationType={booking.locationType}
            isDefaultAddress={booking.isDefaultAddress}
            onUpdateName={(name) => setBooking((prev) => ({ ...prev, bookerName: name }))}
            onUpdatePhone={(phone) => setBooking((prev) => ({ ...prev, bookerPhone: phone }))}
            onUpdateAddress={(addr) => setBooking((prev) => ({ ...prev, address: addr }))}
            onUpdateLocationType={(type) => setBooking((prev) => ({ ...prev, locationType: type }))}
            onUpdateDefault={(isDefault) =>
              setBooking((prev) => ({ ...prev, isDefaultAddress: isDefault }))
            }
            onNext={() => goToStep('step4')}
            onBack={handleBack}
          />
        )}

        {/* BƯỚC 4 – Select Package Category */}
        {booking.currentStep === 'step4' && (
          <Step4SelectPackage
            onSelectDaily={() => {
              setBooking((prev) => ({ ...prev, packageCategory: 'daily' }));
              goToStep('step5a');
            }}
            onSelectMonthly={() => {
              setBooking((prev) => ({ ...prev, packageCategory: 'monthly' }));
              goToStep('step5b');
            }}
            onBack={handleBack}
          />
        )}

        {/* BƯỚC 5A – Date & Time Daily */}
        {booking.currentStep === 'step5a' && (
          <Step5ADateTimeDaily
            bookerName={booking.bookerName}
            bookerPhone={booking.bookerPhone}
            address={booking.address}
            serviceCode={booking.serviceCode}
            selectedDuration={booking.durationPackage}
            selectedDate={booking.selectedDate}
            startTime={booking.startTime}
            onUpdateDuration={handleUpdateDuration}
            onUpdateDate={(d) => setBooking((prev) => ({ ...prev, selectedDate: d }))}
            onUpdateStartTime={(t) => setBooking((prev) => ({ ...prev, startTime: t }))}
            onNext={() => goToStep('step6')}
            onChangeAddress={() => goToStep('step3')}
            onBack={handleBack}
          />
        )}

        {/* BƯỚC 5B – Date & Time Monthly */}
        {booking.currentStep === 'step5b' && (
          <Step5BDateTimeMonthly
            bookerName={booking.bookerName}
            bookerPhone={booking.bookerPhone}
            address={booking.address}
            serviceCode={booking.serviceCode}
            selectedService={booking.selectedService}
            selectedDuration={booking.durationPackage}
            monthlyType={booking.monthlyType}
            selectedDates={booking.selectedDates}
            startTime={booking.startTime}
            notes={booking.notes}
            onUpdateDuration={(label, code) =>
              setBooking((prev) => ({
                ...prev,
                durationPackage: label,
                packageCode: code || prev.packageCode,
              }))
            }
            onUpdateMonthlyType={(label, code) =>
              setBooking((prev) => ({
                ...prev,
                monthlyType: label,
                monthlyPlanCode: code,
                // Gói tháng: mã gói thật = kỳ hạn × số giờ, do Step5B tính
                packageCode: code || prev.packageCode,
              }))
            }
            onToggleDate={handleToggleMonthlyDate}
            onUpdateStartTime={(t) => setBooking((prev) => ({ ...prev, startTime: t }))}
            onUpdateNotes={(n) => setBooking((prev) => ({ ...prev, notes: n }))}
            onNext={() => goToStep('step6')}
            onChangeAddress={() => goToStep('step3')}
            onBack={handleBack}
          />
        )}

        {/* BƯỚC 6 – Recipient Health Info */}
        {booking.currentStep === 'step6' && (
          <Step6HealthInfo
            gender={booking.recipientGender}
            age={booking.recipientAge}
            selectedDiseases={booking.selectedDiseases}
            saveForNext={booking.saveForNext}
            onUpdateGender={(g) => setBooking((prev) => ({ ...prev, recipientGender: g }))}
            onUpdateAge={(a) => setBooking((prev) => ({ ...prev, recipientAge: a }))}
            onToggleDisease={handleToggleDisease}
            onUpdateSaveForNext={(s) => setBooking((prev) => ({ ...prev, saveForNext: s }))}
            onNext={() => goToStep('step7')}
            onBack={handleBack}
          />
        )}

        {/* BƯỚC 7 – Confirm & Payment */}
        {booking.currentStep === 'step7' && (
          <Step7ConfirmPayment
            booking={booking}
            onUpdatePaymentMethod={(m) => setBooking((prev) => ({ ...prev, paymentMethod: m }))}
            onUpdateVoucher={(v) => setBooking((prev) => ({ ...prev, voucher: v }))}
            onSubmitOrder={handleSubmitOrder}
            onBack={handleBack}
          />
        )}
      </main>

      {order && <SuccessModal order={order} onGoHome={handleGoHome} />}
    </div>
  );
}
