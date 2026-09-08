import React from 'react';
import { assetUrl, type ApiImage } from '../api/client';

/**
 * Ảnh do backend cung cấp.
 *
 * [R-2.2] <picture> ưu tiên AVIF rồi tới WebP; luôn có width/height thật để
 * không gây layout shift; `loading="lazy"` + `decoding="async"` cho mọi ảnh.
 * Trong lúc tải thì nền dùng `color` (màu chủ đạo) thay vì để trắng nhấp nháy.
 *
 * `image` là null khi bootstrap chưa về -> render đúng khung với nền màu,
 * nhờ vậy bố cục không nhảy khi ảnh xuất hiện.
 */
interface RemoteImageProps {
  image: ApiImage | null | undefined;
  /** Ghi đè alt khi ngữ cảnh cụ thể hơn mô tả lưu trong DB. */
  alt?: string;
  className?: string;
  /** Ảnh nằm trong khung đầu tiên (banner welcome) -> tải ngay, không lazy. */
  priority?: boolean;
}

export const RemoteImage: React.FC<RemoteImageProps> = ({
  image,
  alt,
  className = '',
  priority = false,
}) => {
  const placeholder = image?.color ?? '#E2E8F0';

  if (!image) {
    return (
      <div
        className={className}
        style={{ backgroundColor: placeholder }}
        aria-hidden="true"
      />
    );
  }

  return (
    <picture>
      {image.avif && <source srcSet={assetUrl(image.avif)} type="image/avif" />}
      <source srcSet={assetUrl(image.webp)} type="image/webp" />
      <img
        src={assetUrl(image.webp)}
        alt={alt ?? image.alt ?? ''}
        width={image.width}
        height={image.height}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        fetchPriority={priority ? 'high' : 'auto'}
        referrerPolicy="no-referrer"
        className={className}
        style={{ backgroundColor: placeholder }}
      />
    </picture>
  );
};
