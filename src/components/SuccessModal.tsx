import React from 'react';
import { CheckCircle2, Home } from 'lucide-react';
import { useContent, useSetting } from '../api/BootstrapContext';
import { imageOf, RemoteImage } from './RemoteImage';
import { ApiBookingDetail } from '../api/client';

interface SuccessModalProps {
  /** Đơn thật do backend trả về sau khi tạo — không dùng lại state phía FE. */
  order: ApiBookingDetail;
  onGoHome: () => void;
}

export const SuccessModal: React.FC<SuccessModalProps> = ({ order, onGoHome }) => {
  const hotline = useSetting('app.hotline', '');
  const block = useContent('success', 'success.banner');
  // Ảnh đi kèm chính khối nội dung này (khoi_noi_dung.anh_id), không gán mã cứng
  const anhCamOn = imageOf(block);

  return (
    // [R-2.4] Không dùng backdrop-filter: nền mờ bằng màu đặc thay vì blur
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="success-title"
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
    >
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl text-center space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div>
          <h2 id="success-title" className="text-2xl font-bold text-[#0B2E6B] mb-2">
            {block?.title ?? 'Đặt dịch vụ thành công!'}
          </h2>
          <p className="text-sm font-semibold text-[#D42A2A]">{block?.subtitle ?? ''}</p>
        </div>

        {/* Ảnh cảm ơn — chỉ dựng khung khi DB thực sự gắn ảnh cho khối này */}
        {anhCamOn && (
          <div className="rounded-2xl overflow-hidden shadow-xs border border-stone-200">
            <RemoteImage
              image={anhCamOn}
              alt={block?.imageAlt ?? 'SAN - Ấm áp & Phụng sự tận tâm'}
              className="w-full h-40 object-cover"
            />
          </div>
        )}

        <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 text-left text-xs space-y-2 text-stone-700">
          <div className="flex justify-between font-bold text-[#0B2E6B] border-b border-stone-200 pb-2">
            <span>Mã đơn hàng: {order.code}</span>
            <span>{order.sessionCount} buổi</span>
          </div>
          <p>
            <strong className="text-stone-900">Dịch vụ:</strong> {order.serviceTitle} —{' '}
            {order.packageLabel}
          </p>
          <p>
            <strong className="text-stone-900">Người đặt:</strong> {order.bookerName} (
            {order.bookerPhone})
          </p>
          <p>
            <strong className="text-stone-900">Địa chỉ:</strong> {order.addressText}
          </p>
          <p>
            <strong className="text-stone-900">Bắt đầu:</strong> {order.firstServiceDate}
            {order.lastServiceDate && order.lastServiceDate !== order.firstServiceDate
              ? ` → ${order.lastServiceDate}`
              : ''}{' '}
            lúc {order.startTime.slice(0, 5)}
          </p>
          {order.discountAmount > 0 && (
            <p className="text-emerald-700">
              <strong>Khuyến mãi:</strong> -{order.discountAmount.toLocaleString('vi-VN')} đ
              {order.voucherCode ? ` (${order.voucherCode})` : ''}
            </p>
          )}
          <p>
            <strong className="text-stone-900">Tổng phí:</strong>{' '}
            <span className="font-extrabold text-[#D42A2A]">
              {order.totalAmount.toLocaleString('vi-VN')} đ
            </span>
          </p>
        </div>

        {hotline && (
          <p className="text-xs text-stone-500">
            Mọi thắc mắc cần hỗ trợ gấp, vui lòng gọi Hotline:{' '}
            <a href={`tel:${hotline}`} className="font-bold text-[#D42A2A] underline">
              {hotline}
            </a>
          </p>
        )}

        <button
          onClick={onGoHome}
          className="w-full py-3.5 px-6 bg-[#0B2E6B] hover:bg-[#082252] text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Home className="w-4 h-4" />
          <span>{block?.ctaLabel ?? 'Về trang chủ'}</span>
        </button>
      </div>
    </div>
  );
};
