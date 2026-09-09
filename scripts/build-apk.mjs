#!/usr/bin/env node
/**
 * Dựng APK debug từ phần web của MiniApp.
 *
 *   npm run apk            -> APK debug (ky bang khoa debug)
 *   npm run apk:release    -> APK release (ky bang keystore that)
 *
 * Các bước: copy ảnh -> vite build -> cap sync -> gradle assemble,
 * rồi chép APK ra `release/SAN-<version>-<variant>.apk`.
 *
 * Cấu hình qua biến môi trường (hoặc file .env.app cùng thư mục):
 *   APP_API_URL    gốc backend app sẽ gọi (bắt buộc, phải HTTPS ở bản thật)
 *   APP_JAVA_HOME  thư mục JDK 17 (mặc định dò các vị trí quen thuộc)
 *   APP_CLEARTEXT  'true' nếu backend chạy HTTP trong LAN (chỉ để test)
 *
 * LƯU Ý (readme §0): bản nộp cho VNPT HomeHub là gói `.vma`, không phải APK.
 * APK này là vỏ WebView để demo/test trên thiết bị Android.
 */
import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = path.resolve(import.meta.dirname, '..');
const isWin = process.platform === 'win32';

/* ---------------------------------------------------------------- config -- */

const fileEnv = {};
const envFile = path.join(root, '.env.app');
if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (m) fileEnv[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}
const cfg = { ...fileEnv, ...process.env };

const API_URL = cfg.APP_API_URL;
if (!API_URL) {
  console.error('Thiếu APP_API_URL — đặt trong .env.app hoặc biến môi trường.');
  console.error('Ví dụ: APP_API_URL=https://abc.ngrok-free.dev');
  process.exit(1);
}

const CLEARTEXT = cfg.APP_CLEARTEXT === 'true';
if (API_URL.startsWith('http://') && !CLEARTEXT) {
  console.error(`APP_API_URL dùng http:// nhưng APP_CLEARTEXT chưa bật.`);
  console.error('Android chặn cleartext mặc định — đặt APP_CLEARTEXT=true để test LAN.');
  process.exit(1);
}

/** `npm run apk:release` truyền --release */
const isRelease = process.argv.includes('--release');
const variant = isRelease ? 'release' : 'debug';

/** Dò JDK 17: Capacitor 6 biên dịch ở source level 17, JDK 8/11 sẽ fail. */
function resolveJavaHome() {
  const candidates = [
    cfg.APP_JAVA_HOME,
    cfg.JAVA_HOME,
    'C:/JAVA_17',
    'C:/Program Files/Java/jdk-17',
    'C:/Program Files/Eclipse Adoptium/jdk-17',
    '/usr/lib/jvm/java-17-openjdk',
  ].filter(Boolean);

  for (const dir of candidates) {
    const bin = path.join(dir, 'bin', isWin ? 'java.exe' : 'java');
    if (!existsSync(bin)) continue;
    const out = spawnSync(bin, ['-version'], { encoding: 'utf8' });
    const text = `${out.stdout ?? ''}${out.stderr ?? ''}`;
    const major = /version "(\d+)/.exec(text)?.[1];
    if (major && Number(major) >= 17) return { dir, version: major };
  }
  return null;
}

const java = resolveJavaHome();
if (!java) {
  console.error('Không tìm thấy JDK 17 trở lên. Đặt APP_JAVA_HOME trỏ tới thư mục JDK.');
  process.exit(1);
}

const androidHome =
  cfg.ANDROID_HOME ??
  cfg.ANDROID_SDK_ROOT ??
  (isWin ? path.join(cfg.LOCALAPPDATA ?? '', 'Android', 'Sdk') : '');
if (!existsSync(androidHome)) {
  console.error(`Không tìm thấy Android SDK tại "${androidHome}". Đặt ANDROID_HOME.`);
  process.exit(1);
}

/* ------------------------------------------------------------------ run -- */

function run(cmd, args, extraEnv = {}) {
  const res = spawnSync(cmd, args, {
    cwd: root,
    stdio: 'inherit',
    shell: isWin, // .cmd/.bat trên Windows cần shell
    env: { ...process.env, ...extraEnv },
  });
  if (res.status !== 0) process.exit(res.status ?? 1);
}

console.log(`\nAPI       : ${API_URL}`);
console.log(`JDK       : ${java.dir} (Java ${java.version})`);
console.log(`Android   : ${androidHome}`);
console.log(`Cleartext : ${CLEARTEXT ? 'BẬT (chỉ dùng để test LAN)' : 'tắt'}\n`);

// 1. Ảnh: copy từ backend vào public/ để app đọc cục bộ.
//    Bắt buộc — thẻ <img> không gắn được header ngrok-skip-browser-warning,
//    trỏ thẳng vào tunnel free sẽ nhận trang cảnh báo thay vì dữ liệu ảnh.
run(process.execPath, [path.join(root, 'scripts', 'sync-media.mjs')]);

// 2. Web build. VITE_MEDIA_BASE_URL='.' -> ảnh lấy từ bundle trong APK.
run('npx', ['vite', 'build'], {
  VITE_API_BASE_URL: API_URL,
  VITE_MEDIA_BASE_URL: '.',
});

// 3. Đẩy dist/ vào dự án Android
run('npx', ['cap', 'sync', 'android'], { CAP_CLEARTEXT: String(CLEARTEXT) });

// 4. Gradle
if (isRelease && !existsSync(path.join(root, 'android', 'keystore.properties'))) {
  console.error('Thiếu android/keystore.properties — chưa có khoá ký bản release.');
  console.error('Xem hướng dẫn tạo keystore trong APK.md.');
  process.exit(1);
}

const gradlew = path.join(root, 'android', isWin ? 'gradlew.bat' : 'gradlew');
const task = isRelease ? 'assembleRelease' : 'assembleDebug';
const res = spawnSync(gradlew, [task, '--no-daemon'], {
  cwd: path.join(root, 'android'),
  stdio: 'inherit',
  shell: isWin,
  env: {
    ...process.env,
    JAVA_HOME: java.dir,
    ANDROID_HOME: androidHome,
    ANDROID_SDK_ROOT: androidHome,
  },
});
if (res.status !== 0) process.exit(res.status ?? 1);

// 5. Chép ra chỗ dễ tìm
const built = path.join(root, `android/app/build/outputs/apk/${variant}/app-${variant}.apk`);
if (!existsSync(built)) {
  console.error(`Gradle báo thành công nhưng không thấy app-${variant}.apk.`);
  process.exit(1);
}

const version = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8')).version || '0.0.0';
const outDir = path.join(root, 'release');
mkdirSync(outDir, { recursive: true });
const out = path.join(outDir, `SAN-${version}-${variant}.apk`);
copyFileSync(built, out);

const kb = (readFileSync(out).length / 1024).toFixed(0);
console.log(`\nXong: ${path.relative(root, out)}  (${kb} KB)`);
console.log('Cài lên máy: adb install -r ' + path.relative(root, out));
