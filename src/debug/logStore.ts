/**
 * Kho log cho bảng Debug trong app.
 *
 * Trên máy ảo và TV box không mở được DevTools, nên log phải hiện ngay trong
 * app. File này KHÔNG import gì khác để `client.ts` gọi vào mà không tạo vòng
 * phụ thuộc.
 */

export type LogLevel = 'log' | 'warn' | 'error' | 'api';

export interface LogEntry {
  id: number;
  at: string;
  level: LogLevel;
  text: string;
}

/** Giữ tối đa bấy nhiêu dòng. Quá thì bỏ dòng cũ nhất — log chạy vô hạn sẽ ăn hết RAM. */
const MAX = 300;

let seq = 0;
let entries: LogEntry[] = [];
const listeners = new Set<() => void>();

const clock = () => new Date().toTimeString().slice(0, 8);

/** Rút gọn giá trị bất kỳ thành một dòng đọc được, không ném lỗi. */
function stringify(v: unknown): string {
  if (typeof v === 'string') return v;
  if (v instanceof Error) return `${v.name}: ${v.message}`;
  try {
    const s = JSON.stringify(v);
    return s === undefined ? String(v) : s;
  } catch {
    return String(v);
  }
}

export function pushLog(level: LogLevel, ...parts: unknown[]): void {
  entries = [
    ...entries.slice(-(MAX - 1)),
    { id: ++seq, at: clock(), level, text: parts.map(stringify).join(' ') },
  ];
  for (const fn of listeners) fn();
}

export function clearLogs(): void {
  entries = [];
  for (const fn of listeners) fn();
}

export const getLogs = (): LogEntry[] => entries;

export function subscribeLogs(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

let installed = false;

/**
 * Chuyển console và lỗi chưa bắt vào kho log.
 *
 * Vẫn gọi tiếp hàm console gốc: bảng Debug là thêm vào, không thay thế, để chạy
 * bằng trình duyệt vẫn xem được ở DevTools như thường.
 */
export function installLogCapture(): void {
  if (installed) return;
  installed = true;

  for (const level of ['log', 'warn', 'error'] as const) {
    const original = console[level].bind(console);
    console[level] = (...args: unknown[]) => {
      pushLog(level, ...args);
      original(...args);
    };
  }

  window.addEventListener('error', (e) => {
    pushLog('error', e.message, e.filename ? `(${e.filename}:${e.lineno})` : '');
  });
  window.addEventListener('unhandledrejection', (e) => {
    pushLog('error', 'Promise chưa bắt:', e.reason);
  });
}
