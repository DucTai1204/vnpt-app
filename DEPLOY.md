# Deploy MiniApp SAN lên GitHub Pages

Trang tĩnh: **https://ductai1204.github.io/vnpt-app/**
Backend (`../vnpt-api`) chạy ở máy khác, expose ra ngoài bằng ngrok.

---

## 1. Kiến trúc bản Pages

```
GitHub Pages (HTTPS, tĩnh)              ngrok (HTTPS)            máy dev
┌──────────────────────────┐           ┌──────────────┐        ┌──────────┐
│ index.html + assets/     │  /api/v1  │              │        │ Express  │
│ media/images/*  (ảnh)    │ ────────► │  tunnel      │ ─────► │  :4000   │
└──────────────────────────┘           └──────────────┘        └──────────┘
```

Hai điểm khác bản chạy dev:

1. **Không có Vite proxy.** Bundle phải biết địa chỉ tuyệt đối của backend →
   biến `VITE_API_BASE_URL` nhúng lúc build.
2. **Ảnh nằm trong bundle**, không gọi sang backend (xem mục 3).

---

## 2. Chuẩn bị một lần

### 2.1 Bật GitHub Pages

`Settings` → `Pages` → **Source: GitHub Actions**.

### 2.2 Khai địa chỉ backend

`Settings` → `Secrets and variables` → `Actions` → tab **Variables** →
`New repository variable`:

| Name | Value |
|---|---|
| `VITE_API_BASE_URL` | `https://<subdomain>.ngrok-free.dev` (không có `/` cuối) |

> Gói ngrok Free đổi subdomain sau mỗi lần khởi động lại. Đổi URL thì **sửa
> biến này rồi chạy lại workflow** (`Actions` → `Deploy to GitHub Pages` →
> `Run workflow`) — không cần commit.

### 2.3 Khai origin ở backend

Trong `../vnpt-api/.env`:

```env
CORS_ORIGINS=http://localhost:3000,https://ductai1204.github.io
COOKIE_SAMESITE=none
```

- `CORS_ORIGINS` — chỉ tên miền, **không** kèm `/vnpt-app`. Origin của trình
  duyệt luôn là `scheme://host`, phần path không tính.
- `COOKIE_SAMESITE=none` — Pages và backend khác site, cookie phiên chỉ được
  gửi kèm khi `SameSite=None`. Trình duyệt chỉ nhận `None` nếu có `Secure`,
  nên backend bắt buộc chạy sau HTTPS (ngrok đã là HTTPS).

**Đổi `.env` phải khởi động lại backend** — `tsx watch` chỉ theo dõi `src/`.

---

## 3. Hai cái bẫy của ngrok Free (đã xử lý sẵn trong code)

### 3.1 Trang cảnh báo ERR_NGROK_6024

Tunnel Free chặn mọi request có `User-Agent` trình duyệt bằng một trang xác
nhận. Trang đó trả **HTTP 200**, nên `fetch` không ném lỗi mà lặng lẽ nhận HTML
thay cho JSON.

Cách bỏ qua: gửi header `ngrok-skip-browser-warning`. Đã gắn sẵn trong
[src/api/client.ts](src/api/client.ts) và khai trong `Access-Control-Allow-Headers`
của backend.

Kiểm chứng:

```bash
curl -s -A "Mozilla/5.0 Chrome/120" \
     -H "ngrok-skip-browser-warning: true" \
     https://<subdomain>.ngrok-free.dev/health
# {"ok":true,"data":{"status":"ok",...}}
```

### 3.2 Ảnh không gắn được header

Thẻ `<img>`/`<source>` không cho thêm header, nên ảnh trỏ thẳng vào ngrok sẽ
luôn nhận trang cảnh báo. Vì vậy ảnh được **copy vào bundle**:

- `npm run sync:media` copy `../vnpt-api/media/images` → `public/media/images`
  (~600KB, 16 tệp — đã commit sẵn nên CI không cần backend).
- Build Pages đặt `VITE_MEDIA_BASE_URL=.` → `assetUrl()` trả
  `./media/images/x.webp`, cùng origin với trang.

Backend đổi ảnh thì chạy lại `npm run sync:media` và commit.

---

## 4. Build tại máy

```bash
npm ci
npm run sync:media                      # đồng bộ ảnh từ backend
VITE_API_BASE_URL=https://<subdomain>.ngrok-free.dev \
VITE_MEDIA_BASE_URL=. npm run build
npx vite preview                        # thử trước khi đẩy
```

---

## 5. Deploy

Push lên `main` → workflow [.github/workflows/deploy.yml](.github/workflows/deploy.yml)
tự build và publish. Chạy tay: `Actions` → `Deploy to GitHub Pages` → `Run workflow`.

---

## 6. Trục trặc thường gặp

| Hiện tượng | Nguyên nhân |
|---|---|
| Trang trắng, console báo 404 file `.js` | `base` trong `vite.config.ts` bị đổi khỏi `'./'` |
| `NO_INTERNET` ở mọi màn | ngrok tắt, hoặc `VITE_API_BASE_URL` trỏ sai subdomain cũ |
| Console báo lỗi CORS | thiếu origin trong `CORS_ORIGINS`, **hoặc quên restart backend** |
| API trả `Máy chủ trả về dữ liệu không hợp lệ` | trang cảnh báo ngrok — kiểm tra `Access-Control-Allow-Headers` có `ngrok-skip-browser-warning` |
| Ảnh vỡ hết | build thiếu `VITE_MEDIA_BASE_URL=.`, hoặc chưa chạy `sync:media` |
| Đăng nhập xong F5 là mất phiên | backend thiếu `COOKIE_SAMESITE=none` |

> Bản Pages chỉ dùng để demo. Bản nộp VNPT là gói `.vma` chạy trong Native
> Shell của SmartScreen, backend phải là domain HTTPS cố định và khai trong
> `allowedNetworkDomains` (readme §4).
