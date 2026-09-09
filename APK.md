# Đóng gói phần web thành APK Android

## Trước hết: APK không phải định dạng nộp cho VNPT

Theo [readme.md §0](../readme.md), VNPT HomeHub có **hai track tích hợp tách rời**:

| Track | Định dạng nộp | Cách chạy |
|---|---|---|
| **MiniApp** (track của dự án này) | gói **`.vma`** (zip) | SPA chạy trong Native Shell của SmartScreen |
| Partner App | APK native | dùng `home_hub_sdk.aar`, giao tiếp AIDL |

APK dựng ở đây **không dùng để nộp Store** — nó là vỏ WebView tự dựng, đóng
đúng vai trò mà Native Shell đảm nhiệm trên SmartScreen thật, để:

- demo trên điện thoại / Android TV box mà không cần SmartScreen
- kiểm thử giao diện ở kích thước và WebView thật
- gửi bản chạy được cho người không có môi trường dev

Khi nộp chính thức vẫn phải đóng `.vma` kèm `app.json` + `manifest.json`
(readme §4, §7).

---

## Yêu cầu

| Thành phần | Bản dùng | Ghi chú |
|---|---|---|
| JDK | **17+** | Capacitor 6 biên dịch ở source level 17. JDK 8/11 sẽ lỗi `invalid source release`. |
| Android SDK | platform 34+ | có sẵn nếu đã cài Android Studio |
| Node | 20+ | |

Máy hiện tại: JDK 17.0.15 tại `C:\JAVA_17`, SDK tại `%LOCALAPPDATA%\Android\Sdk`.

> Capacitor **7** cần JDK 21 — dự án cố tình dùng **Capacitor 6** cho khớp JDK 17.

---

## Build

```bash
cd vnpt-app
npm run apk           # bản debug — ký bằng khoá debug của Android
npm run apk:release   # bản release — ký bằng keystore thật
```

Một lệnh chạy trọn: copy ảnh → `vite build` → `cap sync` → `gradle assemble`,
rồi chép ra `release/SAN-<version>-<debug|release>.apk`.

```bash
adb install -r release/SAN-0.0.0-release.apk
```

> Cài đè bản debug lên bản release (hoặc ngược lại) sẽ báo
> `INSTALL_FAILED_UPDATE_INCOMPATIBLE` vì khác chữ ký — gỡ bản cũ trước:
> `adb uninstall vn.vnpt.san.miniapp`

---

## Ký bản release

Keystore đã tạo sẵn tại `android/keystore/san-release.jks`, cấu hình ở
`android/keystore.properties`. Cả hai đều **bị gitignore**.

> ### Sao lưu keystore ngay
> Mất file `.jks` hoặc mật khẩu = **không bao giờ cập nhật được** app đã phát
> hành (CH Play từ chối APK ký bằng khoá khác). Chép `android/keystore/` và
> `android/keystore.properties` ra nơi lưu trữ an toàn ngoài máy này.

Chứng chỉ hiện tại: `CN=SAN Cham soc suc khoe, OU=MiniApp, O=SAN, L=Ho Chi Minh, C=VN`,
RSA 2048, hạn 30 năm.

Tạo lại keystore khác (nếu cần):

```bash
keytool -genkeypair -v \
  -keystore android/keystore/san-release.jks \
  -alias san-release -keyalg RSA -keysize 2048 -validity 10950
```

rồi cập nhật `android/keystore.properties`:

```ini
storeFile=keystore/san-release.jks
storePassword=...
keyAlias=san-release
keyPassword=...
```

Kiểm tra chữ ký:

```bash
apksigner verify --print-certs release/SAN-0.0.0-release.apk
```

---

## Cấu hình — `.env.app`

```ini
APP_API_URL=https://nonatomic-unacceptably-fermina.ngrok-free.dev
APP_JAVA_HOME=C:/JAVA_17
APP_CLEARTEXT=false
```

| Biến | Việc |
|---|---|
| `APP_API_URL` | Gốc backend app gọi. **Bắt buộc HTTPS** ở bản thật (readme §3.1). |
| `APP_JAVA_HOME` | Thư mục JDK 17. Bỏ trống thì script tự dò. |
| `APP_CLEARTEXT` | `true` chỉ khi backend chạy `http://` trong LAN để test. Android chặn cleartext mặc định. |

Đổi backend (vd sang Fly.io) chỉ cần sửa `APP_API_URL` rồi chạy lại `npm run apk`.

---

## Hai điều bắt buộc ở phía backend

**1. Origin của app phải nằm trong `CORS_ORIGINS`.**
Capacitor dùng `androidScheme: 'https'` nên WebView chạy ở origin `https://localhost`:

```ini
CORS_ORIGINS=http://localhost:3000,https://ductai1204.github.io,https://localhost
```

**2. Cookie phiên phải gửi được cross-site.**
App ở `https://localhost` gọi sang domain khác → `SameSite=Lax` sẽ bị chặn:

```ini
COOKIE_SAMESITE=none
```

`SameSite=None` bắt buộc kèm `Secure`, tức backend phải HTTPS. Qua ngrok thì đạt.
Nếu backend chạy HTTP thuần, phiên sẽ không sống qua lần mở app kế tiếp
(trong một phiên vẫn chạy được nhờ Bearer token).

---

## Vì sao ảnh lấy từ bundle chứ không từ backend

Script build đặt `VITE_MEDIA_BASE_URL=.` nên ảnh đọc từ `assets/public/media/`
trong chính APK.

Lý do: thẻ `<img>`/`<source>` **không gắn được HTTP header**. Tunnel ngrok gói
Free chặn request có User-Agent trình duyệt bằng trang cảnh báo `ERR_NGROK_6024`
trả về HTTP 200 — tức ảnh sẽ nhận HTML rác thay vì dữ liệu ảnh. Còn request API
thì gắn được `ngrok-skip-browser-warning` nên vẫn gọi thẳng backend bình thường.

Đổi ảnh: chạy `npm run images:build` bên `vnpt-api`, rồi `npm run apk` (bước đầu
tự copy ảnh mới sang `public/`).

---

## Tích hợp vỏ native

`src/native/useNativeShell.ts` lo phần mà Native Shell của VNPT đảm nhiệm trên
SmartScreen thật (readme §0). Toàn bộ chỉ chạy khi `Capacitor.isNativePlatform()`
đúng, và các plugin được `import()` động nên **bản web không tải thêm byte nào** —
chúng nằm ở chunk riêng, chỉ nạp khi chạy trong APK.

| Việc | Vì sao cần |
|---|---|
| **Nút back cứng Android** | SPA này không dùng History API, nên mặc định bấm back là **thoát thẳng app**, mất hết tiến trình đang nhập. Giờ back đi theo `previousStepHistory`; chỉ thoát khi đã ở màn chào (hoặc trang chủ sau khi đăng nhập). |
| Thanh trạng thái | Tô màu thương hiệu `#0A5CD6` thay vì đen mặc định |
| Splash | Tự tắt khi giao diện sẵn sàng |

---

## Icon & splash

Sinh từ logo SAN (`vnpt-api/media/source/san-logo.png`):

```bash
npx capacitor-assets generate --android
```

Ảnh nguồn ở `assets/`: `icon.png`, `icon-foreground.png`, `icon-background.png`
(nền `#0A5CD6`), `splash.png`, `splash-dark.png`. Adaptive icon để logo trong
~55% giữa để không bị cắt khi hệ thống bo tròn.

---

## Cấu trúc

```
vnpt-app/
  capacitor.config.ts     appId, appName, androidScheme, cleartext
  .env.app                cấu hình build (không chứa bí mật)
  scripts/build-apk.mjs   toàn bộ pipeline
  android/                dự án Gradle do `cap add android` sinh
  release/                APK thành phẩm
```

`android/` là mã sinh tự động — sửa tay sẽ mất khi chạy lại `cap add`. Muốn đổi
icon, tên, quyền thì sửa `capacitor.config.ts` hoặc
`android/app/src/main/AndroidManifest.xml` (file này `cap sync` không ghi đè).

---

## Thông tin bản dựng hiện tại

| | |
|---|---|
| Package | `vn.vnpt.san.miniapp` |
| Tên hiển thị | SAN - Chăm sóc sức khỏe |
| minSdk / targetSdk | 22 / 34 |
| Kích thước | debug ~4.3 MB · release ~6.0 MB |
| Bundle web (gzip) | ~94 KB — dưới ngưỡng 500KB của readme §2.1 |

---

## Còn thiếu để phát hành thật

- [ ] **Backend cố định.** Tunnel ngrok free đổi domain mỗi lần khởi động lại →
      APK đã build sẽ trỏ vào domain chết. Deploy backend cố định
      (xem [../vnpt-api/DEPLOY.md](../vnpt-api/DEPLOY.md)), sửa `APP_API_URL`
      rồi build lại.
- [ ] **`versionCode` tăng dần.** Đang cố định `1` trong
      `android/app/build.gradle`. CH Play từ chối bản cập nhật có `versionCode`
      không lớn hơn bản trước.
- [ ] **Sao lưu keystore** ra ngoài máy này.
- [ ] **Thu gọn splash.** Bộ splash sinh ra ~6MB cho mọi mật độ màn hình, chiếm
      phần lớn chênh lệch kích thước. Xoá bớt thư mục `drawable-*` mật độ thấp
      nếu chỉ nhắm thiết bị màn hình lớn.
