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
  /**
   * Ảnh đã tách nền. Bỏ luôn màu nền chờ tải.
   *
   * Mặc định thẻ <img> được tô `image.color` để lúc tải không nhấp nháy trắng.
   * Nhưng với ảnh trong suốt đặt `object-contain`, thẻ <img> vẫn chiếm trọn
   * khung còn ảnh chỉ nằm gọn ở giữa — màu nền đó tô kín phần lề, ra một mảng
   * đặc che mất nền thật. Đã dính đúng lỗi này ở màn đăng nhập: cả nửa trái
   * thành khối navy #0B2E6B.
   */
  transparent?: boolean;
}

export const RemoteImage: React.FC<RemoteImageProps> = ({
  image,
  alt,
  className = '',
  priority = false,
  transparent = false,
}) => {
  const placeholder = transparent ? undefined : (image?.color ?? '#E2E8F0');

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

/**
 * Ảnh gắn sẵn trong một bản ghi có các trường `image*` (khối nội dung, dịch vụ).
 *
 * Dùng cái này thay vì `useImage('<mã cứng>')`: ảnh đi theo bản ghi trong DB nên
 * đổi ảnh chỉ cần sửa `anh_id`, không phải build lại app.
 */
export interface HasImageFields {
  code?: string;
  imageWebp: string | null;
  imageAvif: string | null;
  imageWidth: number | null;
  imageHeight: number | null;
  imageAlt: string | null;
  imageColor: string | null;
}

export const imageOf = (row: HasImageFields | null | undefined): ApiImage | null =>
  !row?.imageWebp
    ? null
    : {
        code: row.code ?? '',
        kind: 'anh_nho',
        webp: row.imageWebp,
        avif: row.imageAvif,
        width: row.imageWidth ?? 640,
        height: row.imageHeight ?? 360,
        alt: row.imageAlt,
        color: row.imageColor,
      };
