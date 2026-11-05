import * as React from "react";

const EVENT = "agentflow-store";

/**
 * A small localStorage-backed state hook shared across components. Every
 * writer notifies every other reader on the page, and the first render always
 * uses `initial` so server and client markup match. `initial` must be a
 * stable (module-level) value.
 */
export function useLocalStore<T>(
  key: string,
  initial: T,
): [T, (update: T | ((prev: T) => T)) => void, boolean] {
  const [value, setValue] = React.useState<T>(initial);
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    const read = () => {
      try {
        const raw = window.localStorage.getItem(key);
        if (raw) setValue(JSON.parse(raw) as T);
      } catch {
        /* storage unavailable or corrupt — keep the default */
      }
    };
    read();
    setReady(true);
    const onChange = (e: Event) => {
      if ((e as CustomEvent<string>).detail === key) read();
    };
    window.addEventListener(EVENT, onChange);
    return () => window.removeEventListener(EVENT, onChange);
  }, [key]);

  const set = React.useCallback(
    (update: T | ((prev: T) => T)) => {
      let current = initial;
      try {
        const raw = window.localStorage.getItem(key);
        if (raw) current = JSON.parse(raw) as T;
      } catch {
        /* fall back to the default */
      }
      const next = typeof update === "function" ? (update as (prev: T) => T)(current) : update;
      try {
        window.localStorage.setItem(key, JSON.stringify(next));
      } catch {
        /* still update this session */
      }
      setValue(next);
      window.dispatchEvent(new CustomEvent(EVENT, { detail: key }));
    },
    [key, initial],
  );

  return [value, set, ready];
}
