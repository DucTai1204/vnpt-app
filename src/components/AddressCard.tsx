import React from 'react';
import { ChevronRight, MapPin } from 'lucide-react';

/**
 * Thẻ địa chỉ nhận chăm — xuất hiện đầu mọi màn chọn ngày/giờ trong thiết kế.
 * Bấm vào để quay lại bước sửa địa chỉ.
 */
interface AddressCardProps {
  name: string;
  phone: string;
  address: string;
  onEdit?: () => void;
}

export const AddressCard: React.FC<AddressCardProps> = ({ name, phone, address, onEdit }) => (
  <button
    type="button"
    onClick={onEdit}
    disabled={!onEdit}
    className="w-full text-left bg-white rounded-2xl border border-hairline px-5 py-4 flex items-center gap-4 hover:border-brand-border transition-colors cursor-pointer disabled:cursor-default"
  >
    <MapPin className="w-6 h-6 text-brand shrink-0" />

    <div className="min-w-0 flex-1">
      <p className="text-base font-bold text-navy truncate">
        {name} – {phone}
      </p>
      <p className="text-sm text-navy-soft truncate">{address}</p>
    </div>

    {onEdit && <ChevronRight className="w-5 h-5 text-navy-soft shrink-0" />}
  </button>
);
