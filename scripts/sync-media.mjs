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
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, '..', 'vnpt-api', 'media', 'images');
const dest = join(root, 'public', 'media', 'images');

if (!existsSync(src)) {
  console.log(`[sync-media] bỏ qua, không thấy ${src} (dùng ảnh đã commit sẵn)`);
  process.exit(0);
}

// Dọn tệp không còn ở nguồn. `cpSync` chỉ ghi đè chứ không xoá, nên một tệp bỏ
// vào đây bằng tay sẽ nằm lại mãi và chui vào cả bundle lẫn APK. Đã dính một
// lần: login.png 1.4MB làm APK phình thêm 1.4MB, và là PNG thô nên vi phạm
// [R-2.1] chỉ dùng WebP/AVIF.
if (existsSync(dest)) {
  const keep = new Set(readdirSync(src));
  for (const f of readdirSync(dest)) {
    if (keep.has(f)) continue;
    rmSync(join(dest, f), { recursive: true, force: true });
    console.log(`[sync-media] xoá tệp lạ: ${f}`);
  }
} else {
  mkdirSync(dest, { recursive: true });
}

cpSync(src, dest, { recursive: true });
console.log(`[sync-media] đã copy ${readdirSync(dest).length} tệp -> public/media/images`);
