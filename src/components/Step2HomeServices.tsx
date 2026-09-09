import React, { useEffect, useState } from 'react';
import { Bell, User, Home, ClipboardList, UserCircle2, ChevronRight } from 'lucide-react';
import { SanLogo } from './SanLogo';
import { RemoteImage } from './RemoteImage';
import { ApiError, ApiService, getServices } from '../api/client';
import { useBootstrap, useSetting, useStep } from '../api/BootstrapContext';
import { AccountPanel } from './AccountPanel';
import { BookingList } from './BookingList';
import { LogoutButton } from './LogoutButton';

/** Icon do DB chỉ định (tab_dieu_huong.icon). */
const NAV_ICONS: Record<string, React.ElementType> = { Home, ClipboardList, UserCircle2 };

interface Step2HomeServicesProps {
  bookerName: string;
  selectedService: string;
  /** Trả cả mã dịch vụ để các bước sau gọi API theo mã. */
  onSelectService: (serviceCode: string, serviceTitle: string) => void;
  onBack: () => void;
}


export const Step2HomeServices: React.FC<Step2HomeServicesProps> = ({
  bookerName,
  onSelectService,
}) => {
  const [activeTab, setActiveTab] = useState('trang_chu');

  // Tên app, slogan, tiêu đề màn hình đều lấy từ /bootstrap
  const appName = useSetting('app.ten', '');
  const slogan = useSetting('app.slogan', '');
  const step = useStep('step2');
  // Vị trí thanh menu do DB quyết định (tab_dieu_huong.vi_tri), FE không gán cứng.
  const navTabs = useBootstrap().data?.navTabs ?? [];
  const navPosition = navTabs[0]?.position ?? 'tren';

  // Danh sách dịch vụ + ảnh lấy từ backend, không hardcode trong FE nữa.
  const [services, setServices] = useState<ApiService[] | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setError(null);

    getServices(controller.signal)
      .then(setServices)
      .catch((err: unknown) => {
        if ((err as Error)?.name === 'AbortError') return;
        setError(
          err instanceof ApiError
            ? err
            : new ApiError('INTERNAL_ERROR', 'Không tải được danh sách dịch vụ'),
        );
      });

    // [R-2.5] Cleanup bắt buộc: huỷ request khi rời màn hình
    return () => controller.abort();
  }, [attempt]);

  /**
   * Thanh menu — nguồn: bảng `tab_dieu_huong` qua /bootstrap.
   * Tab đang chọn được gạch chân màu xanh, đúng như bộ thiết kế.
   */
  const navBar = (
    <nav
      className={
        navPosition === 'duoi'
          ? 'fixed bottom-0 left-0 right-0 bg-white border-t border-hairline shadow-lg z-30 px-6 py-2'
          : 'bg-white rounded-2xl border border-hairline shadow-sm mb-6 px-4'
      }
    >
      <div className="max-w-3xl mx-auto grid grid-cols-3">
        {navTabs.map((tab) => {
          const Icon = NAV_ICONS[tab.icon ?? ''] ?? Home;
          const isActive = activeTab === tab.code;
          return (
            <button
              key={tab.code}
              type="button"
              aria-current={isActive ? 'page' : undefined}
              onClick={() => setActiveTab(tab.code)}
              className={`relative flex items-center justify-center gap-2 py-3 text-sm font-semibold cursor-pointer transition-colors ${
                isActive ? 'text-brand' : 'text-navy-soft hover:text-navy'
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span>{tab.label}</span>
              {isActive && (
                <span
                  className={`absolute inset-x-4 h-1 rounded-full bg-brand ${
                    navPosition === 'duoi' ? 'bottom-0' : 'top-0'
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );

  return (
    <div className="w-full max-w-5xl mx-auto pt-4 px-4">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-sky-100 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <SanLogo size="sm" showSubtitle={false} />
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#0B2E6B] leading-tight">
              {appName}
            </h2>
            <p className="text-xs font-medium text-[#D42A2A]">{slogan}</p>
          </div>
        </div>

        {/* User / Bell Icons */}
        <div className="flex items-center gap-2">
          <button className="relative p-2 rounded-full hover:bg-stone-100 text-stone-600 transition-colors cursor-pointer">
            <Bell className="w-5 h-5 text-[#0B2E6B]" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#D42A2A] ring-2 ring-white" />
          </button>
          <div className="flex items-center gap-2 pl-2 border-l border-stone-200">
            <div className="w-8 h-8 rounded-full bg-sky-100 text-[#0B2E6B] font-bold text-xs flex items-center justify-center border border-sky-200">
              <User className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-[#0B2E6B] hidden sm:inline">
              {bookerName}
            </span>
          </div>
          <div className="pl-1 border-l border-stone-200">
            <LogoutButton />
          </div>
        </div>
      </div>

      {navPosition !== 'duoi' && navBar}

      {/* Tab Tài khoản — hồ sơ, sổ địa chỉ, bệnh nền */}
      {activeTab === 'tai_khoan' && (
        <div className="mb-8">
          <AccountPanel bookerName={bookerName} />
        </div>
      )}

      {/* Tab Đơn dịch vụ — danh sách đơn thật + timeline trạng thái */}
      {activeTab === 'don_hang' && (
        <div className="mb-8">
          <BookingList />
        </div>
      )}

      {activeTab === 'trang_chu' && (
      <>
      {/* Main Section Header */}
      <div className="mb-4">
        <h3 className="text-xl font-bold text-[#0B2E6B]">{step?.title ?? ''}</h3>
        <p className="text-xs text-stone-500">{step?.subtitle ?? ''}</p>
      </div>

      {/* 3 Service Cards Grid — dữ liệu + ảnh từ backend */}
      {error && (
        <div className="mb-8 rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm font-bold text-[#D42A2A] mb-1">
            {error.code === 'NO_INTERNET' ? 'Không có kết nối' : 'Không tải được dịch vụ'}
          </p>
          <p className="text-xs text-stone-600 mb-4">{error.message}</p>
          <button
            onClick={() => setAttempt((n) => n + 1)}
            className="px-5 py-2 bg-[#0B2E6B] text-white text-xs font-bold rounded-xl cursor-pointer"
          >
            Thử lại
          </button>
        </div>
      )}

      {!error && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          {/* Skeleton giữ đúng chỗ trong lúc chờ -> không layout shift [R-2.2] */}
          {services === null &&
            [0, 1, 2].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl overflow-hidden border border-stone-200/80 shadow-md"
                aria-hidden="true"
              >
                <div className="h-44 bg-stone-200 animate-pulse" />
                <div className="p-5 space-y-2">
                  <div className="h-4 w-3/4 bg-stone-200 rounded animate-pulse" />
                  <div className="h-3 w-1/2 bg-stone-100 rounded animate-pulse" />
                  <div className="h-3 w-full bg-stone-100 rounded animate-pulse" />
                </div>
              </div>
            ))}

          {services?.length === 0 && (
            <p className="col-span-full text-center text-sm text-stone-500 py-10">
              Hiện chưa có dịch vụ nào.
            </p>
          )}

          {services?.map((item) => (
            <div
              key={item.code}
              onClick={() => onSelectService(item.code, item.title)}
              className="bg-white rounded-2xl overflow-hidden border border-stone-200/80 shadow-md hover:shadow-xl hover:border-sky-300 transition-all duration-300 flex flex-col justify-between group cursor-pointer"
            >
              <div>
                {/* Card Image */}
                <div className="relative h-44 overflow-hidden bg-stone-100">
                  <RemoteImage
                    image={
                      item.imageWebp
                        ? {
                            code: item.code,
                            kind: 'anh_nho',
                            webp: item.imageWebp,
                            avif: item.imageAvif,
                            width: item.imageWidth ?? 640,
                            height: item.imageHeight ?? 360,
                            alt: item.imageAlt,
                            color: item.imageColor,
                          }
                        : null
                    }
                    alt={item.imageAlt ?? item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {item.badgeLabel && (
                    <span className="absolute top-3 left-3 bg-[#D42A2A] text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-xs">
                      {item.badgeLabel}
                    </span>
                  )}
                </div>

                {/* Card Content */}
                <div className="p-5">
                  <h4 className="text-base font-bold text-[#0B2E6B] leading-snug mb-1 group-hover:text-[#D42A2A] transition-colors">
                    {item.title}
                  </h4>
                  {item.subtitle && (
                    <p className="text-xs font-semibold text-[#D42A2A] mb-2">
                      "{item.subtitle}"
                    </p>
                  )}
                  <p className="text-xs text-stone-600 leading-relaxed">
                    {item.shortDescription}
                  </p>
                </div>
              </div>

              {/* Card CTA Button */}
              <div className="p-5 pt-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectService(item.code, item.title);
                  }}
                  className="w-full py-2.5 px-4 bg-[#0B2E6B] group-hover:bg-[#D42A2A] text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Chọn dịch vụ</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      </>
      )}

      {navPosition === 'duoi' && <div className="h-20" aria-hidden="true" />}
      {navPosition === 'duoi' && navBar}
    </div>
  );
};
