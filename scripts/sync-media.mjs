/**
 * Copy ảnh đã tối ưu từ backend (../vnpt-api/media/images) sang public/media.
 *
 * Bản deploy tĩnh (GitHub Pages) phục vụ ảnh cùng origin với trang thay vì gọi
 * sang backend: thẻ <img>/<source> không gắn được header, nên nếu trỏ thẳng vào
 * tunnel ngrok free thì mọi ảnh nhận trang cảnh báo ERR_NGROK_6024 thay vì dữ
 * liệu ảnh. Ảnh cũng chỉ ~600KB nên đóng gói kèm là rẻ hơn gọi mạng.
 *
 * Không có thư mục nguồn (ví dụ chạy trên CI, nơi chỉ checkout repo frontend)
 * thì bỏ qua: ảnh đã được commit sẵn trong public/media.
 */
import { cpSync, existsSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, '..', 'vnpt-api', 'media', 'images');
const dest = join(root, 'public', 'media', 'images');

if (!existsSync(src)) {
  console.log(`[sync-media] bỏ qua, không thấy ${src} (dùng ảnh đã commit sẵn)`);
  process.exit(0);
}

cpSync(src, dest, { recursive: true });
console.log(`[sync-media] đã copy ${readdirSync(dest).length} tệp -> public/media/images`);
