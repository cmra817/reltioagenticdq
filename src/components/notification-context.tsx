import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";

export type JobKind = "profiling" | "checks";

export type Notification = {
  id: string;
  kind: JobKind;
  table: string;
  slug: string;
  title: string;
  body: string;
  at: number;
  read: boolean;
};

type NotificationContextValue = {
  notifications: Notification[];
  unreadCount: number;
  /** Simulate a job run: notifies the user once it completes. */
  runJob: (input: { kind: JobKind; table: string; delayMs?: number }) => void;
  markAllRead: () => void;
  clearAll: () => void;
};

function tableToSlug(table: string) {
  return table.toLowerCase().replace(/\s+/g, "-");
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

const LABEL: Record<JobKind, string> = {
  profiling: "Profiling",
  checks: "DQ checks",
};

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const seq = useRef(0);

  const runJob = useCallback<NotificationContextValue["runJob"]>(
    ({ kind, table, delayMs }) => {
      const label = LABEL[kind];
      toast(`${label} started for ${table}`);
      const wait = delayMs ?? (kind === "profiling" ? 4000 : 6500);
      window.setTimeout(() => {
        seq.current += 1;
        const id = `n-${seq.current}-${Date.now()}`;
        setNotifications((prev) => [
          {
            id,
            kind,
            table,
            title: `${label} completed`,
            body:
              kind === "profiling"
                ? `Column profile stats are ready for ${table}.`
                : `Quality checks finished running on ${table}.`,
            at: Date.now(),
            read: false,
          },
          ...prev,
        ]);
        toast.success(`${label} completed for ${table}`);
      }, wait);
    },
    [],
  );

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const clearAll = useCallback(() => setNotifications([]), []);

  const value = useMemo(
    () => ({
      notifications,
      unreadCount: notifications.filter((n) => !n.read).length,
      runJob,
      markAllRead,
      clearAll,
    }),
    [notifications, runJob, markAllRead, clearAll],
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationProvider");
  return ctx;
}

export function formatNotificationTime(at: number) {
  const diff = Date.now() - at;
  if (diff < 60_000) return "Just now";
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(at).toLocaleDateString();
}
