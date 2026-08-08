import { useEffect, useRef, useState } from "react";
import {
  formatNotificationTime,
  useNotifications,
  type JobKind,
} from "./notification-context";

function BellIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.7 21a2 2 0 0 1-3.4 0" />
    </svg>
  );
}

function KindDot({ kind }: { kind: JobKind }) {
  return (
    <span
      className="mt-1.5 inline-block h-2 w-2 shrink-0 rounded-full"
      style={{ background: kind === "profiling" ? "var(--brand-blue)" : "#16a34a" }}
      aria-hidden="true"
    />
  );
}

export function NotificationBell() {
  const { notifications, unreadCount, markAllRead, clearAll } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((v) => {
            if (!v) markAllRead();
            return !v;
          });
        }}
        className="relative flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-[color:var(--surface-soft)]"
        style={{ color: "var(--ink-700)" }}
        aria-label={
          unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"
        }
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <BellIcon />
        {unreadCount > 0 && (
          <span
            className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold text-white"
            style={{ background: "#ef4444" }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+8px)] z-50 w-[340px] overflow-hidden rounded-xl border bg-white"
          style={{ borderColor: "var(--hairline)", boxShadow: "0 12px 32px rgba(15,23,42,0.12)" }}
        >
          <div
            className="flex items-center justify-between border-b px-3 py-2"
            style={{ borderColor: "var(--hairline)" }}
          >
            <span className="text-[13px] font-semibold" style={{ color: "var(--ink-900)" }}>
              Notifications
            </span>
            {notifications.length > 0 && (
              <button
                type="button"
                onClick={clearAll}
                className="text-[12px] font-medium"
                style={{ color: "var(--brand-blue)" }}
              >
                Clear all
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="px-3 py-6 text-center text-[13px]" style={{ color: "var(--ink-500)" }}>
              No notifications yet. You'll be notified when profiling or DQ checks finish.
            </div>
          ) : (
            <ul className="max-h-[360px] overflow-y-auto">
              {notifications.map((n) => (
                <li
                  key={n.id}
                  className="border-b px-3 py-2.5 last:border-b-0"
                  style={{ borderColor: "var(--hairline)" }}
                >
                  <div className="flex gap-2.5">
                    <KindDot kind={n.kind} />
                    <div className="min-w-0">
                      <div
                        className="text-[13px] font-semibold"
                        style={{ color: "var(--ink-900)" }}
                      >
                        {n.title}
                      </div>
                      <div className="mt-0.5 text-[12px]" style={{ color: "var(--ink-700)" }}>
                        {n.body}
                      </div>
                      <div className="mt-1 text-[11px]" style={{ color: "var(--ink-300)" }}>
                        {formatNotificationTime(n.at)}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
