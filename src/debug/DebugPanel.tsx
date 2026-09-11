import React, { useEffect, useState } from 'react';
import { Bug, Copy, Trash2, X } from 'lucide-react';
import { clearLogs, getLogs, installLogCapture, LogEntry, subscribeLogs } from './logStore';

/** Màu theo mức log, đủ để liếc qua là phân biệt được. */
const TONE: Record<LogEntry['level'], string> = {
  log: 'text-slate-300',
  warn: 'text-amber-300',
  error: 'text-red-400',
  api: 'text-sky-300',
};

/**
 * Nút Debug nổi trên mọi màn hình; bấm vào mở bảng log ngay tại chỗ.
 *
 * Máy ảo và TV box không mở được DevTools nên đây là cách duy nhất xem được
 * console và các lệnh gọi API khi chạy thật trong APK.
 *
 * CHỈ DÙNG KHI DEV. App.tsx bọc component này sau cờ SHOW_DEBUG, tắt cờ đó
 * trước khi nộp Store.
 */
export const DebugPanel: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [, force] = useState(0);

  useEffect(() => {
    installLogCapture();
    // [R-2.5] Cleanup bắt buộc: bỏ đăng ký khi rời màn
    return subscribeLogs(() => force((n) => n + 1));
  }, []);

  const logs = getLogs();

  const copyAll = () => {
    const text = logs.map((l) => `${l.at} [${l.level}] ${l.text}`).join('\n');
    void navigator.clipboard?.writeText(text).catch(() => {
      // Một số WebView không cho ghi clipboard — không được làm hỏng bảng log
    });
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Mở bảng debug"
        className="fixed bottom-3 right-3 z-[100] w-11 h-11 rounded-full bg-slate-900/85 text-white shadow-lg flex items-center justify-center cursor-pointer hover:bg-slate-900"
      >
        <Bug className="w-5 h-5" />
        {logs.some((l) => l.level === 'error') && (
          <span className="absolute top-0 right-0 w-3 h-3 rounded-full bg-red-500 ring-2 ring-white" />
        )}
      </button>
    );
  }

  return (
    <div className="fixed inset-x-2 bottom-2 z-[100] h-[55vh] rounded-2xl bg-slate-900 text-white shadow-2xl flex flex-col overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/15 shrink-0">
        <Bug className="w-4 h-4 text-sky-300" />
        <span className="text-sm font-bold">Debug · {logs.length} dòng</span>

        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={copyAll}
            aria-label="Chép toàn bộ log"
            className="p-2 rounded-lg hover:bg-white/10 cursor-pointer"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={clearLogs}
            aria-label="Xoá log"
            className="p-2 rounded-lg hover:bg-white/10 cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Đóng bảng debug"
            className="p-2 rounded-lg hover:bg-white/10 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2 font-mono text-[11px] leading-relaxed">
        {logs.length === 0 && <p className="text-slate-400">Chưa có log nào.</p>}
        {logs.map((l) => (
          <div key={l.id} className="flex gap-2 border-b border-white/5 py-0.5">
            <span className="text-slate-500 shrink-0">{l.at}</span>
            <span className={`${TONE[l.level]} break-all whitespace-pre-wrap`}>{l.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
