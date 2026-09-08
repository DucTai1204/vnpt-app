# README — Quy chuẩn thiết kế MiniApp cho VNPT HomeHub SmartScreen

> Tài liệu tổng hợp từ "Quy chuẩn chung dành cho MiniApp tích hợp lên SmartScreen".
> Dùng làm checklist khi thiết kế & build MiniApp (WebView-based, giống mô hình Zalo Mini App).

## 0. Kiến trúc tổng quan
- MiniApp = web app (SPA) chạy trong **WebView (Chromium 100+)**, được bọc bởi **Native Shell**.
- Mọi truy cập phần cứng/API nhạy cảm phải qua **JS Bridge/SDK** do VNPT cung cấp (`HomeHub.*`), **không gọi thẳng browser API**.
- Backend riêng của bạn: gọi thẳng bình thường **nếu** domain đã được khai báo/whitelist trong CSP + dùng HTTPS. Riêng API nhạy cảm (thanh toán, dữ liệu người dùng, token bên thứ 3) **bắt buộc** đi qua Proxy SDK (`HomeHub.network.request()`), không tự quản lý token trong JS.

---

## 1. UI/UX Design

### 1.1 Vị trí menu
| Loại MiniApp | Vị trí menu |
|---|---|
| Truyền hình/video/nội dung | Menu ngang phía trên |
| Tiện ích đời sống, tên chức năng ngắn | Tab trên (≤8 mục, kéo ngang nếu nhiều hơn) |
| Tiện ích đời sống, nhiều nhóm nghiệp vụ | Menu bên trái (5-6 mục chính, scroll nếu nhiều hơn) |

### 1.2 Số lượng item / màn hình
- Mỗi màn hình: **1 mục tiêu chính**.
- Thành phần tương tác chính: **6–12 item**.
- Danh sách app/nội dung: tối ưu **9–12**, tối đa **15** → vượt quá phải chia nhóm/phân trang/"Xem thêm"/tìm kiếm.
- Card nội dung: 3, 5, 7 hoặc 9 card; poster mỗi hàng: 4–6 card.
- Icon grid: tối ưu 9, tối đa 15.
- Nút chức năng: 6–9 button. Form nhập liệu: 4–6 trường/màn.
- Nút hành động chính: 1 nút chính + tối đa 1 nút phụ.
- Không nhiều popup gây gián đoạn; không để cuộn quá dài để tìm chức năng chính.

### 1.3 Scroll
| Nội dung | Kiểu scroll |
|---|---|
| Danh sách app/chuyên mục, thành viên, đơn hàng, thông báo | Dọc |
| Phim/video/nhạc/đề xuất, banner | Ngang (banner có chấm chỉ báo) |
| Trang chủ | Hạn chế scroll, ưu tiên nội dung chính ngay màn đầu |
| Form dài | Chia bước, không cuộn dài |

- Scroll dọc: cần chỉ báo còn nội dung, trạng thái đầu/cuối, lazy load/phân trang.
- Scroll ngang: cần chấm chỉ báo; **không dùng** cho đơn hàng/lịch hẹn/thanh toán/trạng thái giao hàng.

### 1.4 Trạng thái bắt buộc
Loading (skeleton/spinner, không màn trắng) · Empty (thông báo + hành động tiếp theo) · Error (rõ lỗi + cách xử lý) · No Internet (nút thử lại) · No Permission · Session Expired (yêu cầu đăng nhập lại).

### 1.5 Kết nối nền tảng
- SSO từ SmartScreen — không bắt login lại.
- Nhận/đổi profile → tự load lại dữ liệu theo profile mới.
- Logout → xóa session + dữ liệu MiniApp.
- Deep link: khai báo rõ màn hình/action mở được từ Home, AI Agent, Banner, Notification.
- Quyền: chỉ xin khi cần dùng, không xin hết khi mở app (camera, mic, vị trí, NFC/eKYC, thông báo, thanh toán...).
- Giao dịch phát sinh → tích hợp luồng thanh toán chuẩn của nền tảng.

---

## 2. Performance

**Mục tiêu:** FPS cuộn ≥55, FPS trung bình ≈60, Touch Response <100ms, First Render <2s, 0 white screen, 0 crash WebView, 0 memory leak.

### 2.1 Giới hạn cứng (Hard Limits)
| Tài nguyên | Ngưỡng | Vi phạm |
|---|---|---|
| Gói .vma (zip) | ≤10MB | Từ chối upload Store |
| Initial bundle (gzip) | <500KB | Từ chối kiểm duyệt |
| RAM runtime | ≤200MB/MiniApp | Native Shell tự kill |
| Local storage | ≤20MB | QuotaExceededError |
| TTI | <3s (mạng ổn định) | Cảnh báo "phản hồi chậm" |
| Request đồng thời | ≤10 | Bị queue, chậm app |
| Độ phân giải | 1280x720 | — |
| Ảnh hiển thị đồng thời | ≤20 trong viewport | — |
| Banner / Thumbnail | ≤150KB / ≤40KB | — |
| Tổng bộ nhớ ảnh hiển thị | ≤5MB | — |

### 2.2 Ảnh & đồ họa
- Định dạng **WebP/AVIF**, cấm PNG/JPG gốc chưa nén, cấm ảnh lớn hơn kích thước hiển thị, cấm preload hàng loạt ảnh ngoài viewport.
- Luôn khai báo width/height hoặc `aspect-ratio` để tránh layout shift.
- `decoding="async"` + `loading="lazy"` cho mọi ảnh.
- Poster lớn hiển thị ≤10, thumbnail đồng thời ≤20, ảnh decode cùng lúc ≤5.
- CDN cache: `Cache-Control: public, max-age=31536000, immutable` cho image/font/svg/icon/css/js.

### 2.3 Danh sách & Virtual List
- Danh sách lớn **bắt buộc** Virtual Scrolling/Windowing/DOM Recycling (React Virtuoso/Virtual/Window...).
- Không `createElement/removeChild/appendChild` liên tục khi cuộn — giữ DOM cố định, tái sử dụng (giống RecyclerView).
- Khi đang fling scroll: không render/decode ảnh mới, không animation, không khởi tạo component phức tạp → dùng skeleton placeholder.
- Overscan khuyến nghị: danh sách đơn giản 600–800px, nhiều ảnh 800–1200px, grid poster phim 1000–1500px.
- **Không** kết hợp Virtual List với `content-visibility: auto` trên từng item (chỉ dùng cho widget tĩnh/section ngoài virtual list).
- Passive event listener bắt buộc (`{ passive: true }`), tránh `preventDefault()` tùy tiện.

### 2.4 CSS
- **Cấm**: `backdrop-filter`, `filter: blur()`, `mix-blend-mode`, box-shadow blur lớn (>4px) — dùng ảnh PNG/WebP giả lập nếu cần shadow lớn.
- **Khuyến nghị**: `content-visibility: auto` + `contain: strict/content` + `contain-intrinsic-size` cho widget tĩnh.
- `touch-action: manipulation` toàn cục để loại bỏ delay 300ms.
- Animation chỉ dùng `transform`/`opacity`; **cấm** animate `width/height/margin/padding/top/left/right/bottom`.

### 2.5 JavaScript Runtime
- Cleanup bắt buộc: `setTimeout/setInterval/requestAnimationFrame/EventListener/WebSocket/MutationObserver/IntersectionObserver`.
- Không tạo object mới trong scroll/touchmove handler (gây GC, FPS drop).
- Throttle/debounce cho `scroll`, `resize`, `touchmove` (dùng `requestAnimationFrame` hoặc throttle).

### 2.6 Font
- WOFF2, font subset, chỉ load các weight cần dùng (vd 400/500/700).

---

## 3. Bảo mật

### 3.1 Sandbox & Permissions
- Cấm `<a target="_blank">` / `window.open()` ra ngoài whitelist — Native Shell sẽ chặn.
- `navigator.geolocation`, `navigator.mediaDevices` bị chặn mặc định — phải qua SDK HomeHub để xin quyền.
- Phải khai báo `manifest.json` với scope cụ thể (vd `scope.payment`, `scope.iot.read`) khi nộp Store. Gọi API ngoài scope đã duyệt → bị ngắt + log cảnh báo bảo mật.

### 3.2 Mạng & CSP
- Native Shell tự inject CSP:
  - `default-src 'self' data: https://*.vnpt.vn https://api.partner.com;` (chỉ domain MiniApp + API đã khai báo)
  - `script-src 'self';` (cấm CDN thứ 3 lạ)
  - `object-src 'none';`
- **Chỉ HTTPS** (`usesCleartextTraffic=false`) — request HTTP bị chặn.
- API nhạy cảm (thanh toán, dữ liệu người dùng) **không gọi thẳng từ JS ra Internet** — bắt buộc qua `HomeHub.network.request()` để Native đính kèm token; token không được expose cho JS.

### 3.3 Chống khai thác mã nguồn
- **Cấm tuyệt đối**: `eval()`, `setTimeout(string)`, `new Function()` — CSP sẽ chặn.
- Không dùng `dangerouslySetInnerHTML` / `v-html` trực tiếp cho HTML từ server → phải qua `DOMPurify.sanitize()`.

### 3.4 Lưu trữ dữ liệu
- Local Storage tối đa 20MB.
- Không lưu PII chưa mã hóa (SĐT, tên, ID hộ gia đình, token bên thứ 3) dạng clear text trong `localStorage`/`IndexedDB` → dùng `HomeHub.storage.set(key, value)`.
- Đổi profile/Logout → Native Shell tự xóa sạch storage của mọi MiniApp; MiniApp phải tự thiết kế UI phục hồi được khi data bị xóa đột ngột (không cần tự viết code clear cache).

### 3.5 Checklist Security QA (loại ngay nếu vi phạm)
| Hạng mục | Đạt chuẩn | Loại ngay |
|---|---|---|
| Kết nối | Toàn bộ API/ảnh dùng https:// | Có request http:// |
| Token | Dùng Proxy SDK | Tự lưu token dạng text trong localStorage |
| XSS | Sanitize HTML nếu render động | Có `eval()` hoặc `dangerouslySetInnerHTML` |
| Quyền hạn | Chỉ gọi Native SDK đã khai báo | Tự ý dùng `navigator.camera` hoặc SDK chui |
| Điều hướng | Chuyển trang nội bộ trong SPA | Dùng `location.href` nhảy sang website lạ |

---

## 4. Design Guideline chi tiết
Xem UI mẫu tại Figma: (link trong tài liệu gốc — mục "Design Guidelines").

---

## 5. Checklist trước khi submit Store
- [ ] Bundle .vma ≤10MB, initial bundle gzip <500KB
- [ ] Domain backend đã khai báo whitelist CSP, toàn bộ request HTTPS
- [ ] `manifest.json` khai báo đầy đủ scope quyền sử dụng
- [ ] Ảnh WebP/AVIF, đúng ngưỡng kích thước, có lazy load + async decode
- [ ] Danh sách dài dùng Virtual List, không render toàn bộ DOM
- [ ] Đầy đủ 6 trạng thái: Loading/Empty/Error/No Internet/No Permission/Session Expired
- [ ] Không dùng backdrop-filter/blur lớn/mix-blend-mode, animation chỉ transform/opacity
- [ ] Không eval()/dangerouslySetInnerHTML thô, có DOMPurify nếu render HTML động
- [ ] API nhạy cảm đi qua Proxy SDK, không tự lưu token trong localStorage
- [ ] UI có khả năng phục hồi khi storage bị xóa đột ngột (đổi profile/logout)