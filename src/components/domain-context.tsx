import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

export type ConnectedDomain = {
  name: string;
  tables: string[]; // friendly table names, e.g. "customers"
  checkCount: number;
  connectedAt: number;
};

export type HealthStatus = "good" | "warn" | "bad" | "unknown";

type DomainContextValue = {
  domains: string[];
  selected: string;
  selectDomain: (name: string) => void;
  /** True when the agent is scoped to every domain instead of the selected one. */
  allDomains: boolean;
  setAllDomains: (value: boolean) => void;
  addDomain: (name: string) => void;
  /** Connection details keyed by domain name. */
  connections: Record<string, ConnectedDomain>;
  /** Most recently connected domain (drives the breadcrumb banner). */
  justConnected: ConnectedDomain | null;
  dismissJustConnected: () => void;
  /** Called when AddDataset wizard finishes — saves tables/checks under domain. */
  completeConnection: (input: { domain: string; tables: string[]; checkCount: number }) => void;
  /** Health score (0–100) for a domain, or null when nothing is monitored yet. */
  healthFor: (name: string) => number | null;
};

const DEFAULT_DOMAINS = [
  "Finance",
  "Marketing",
  "Sales",
  "Human Resources",
  "Operations",
  "Customer Success",
  "Product",
  "Supply Chain",
];

/**
 * Prototype scores. These stand in for the real metric layer: one fixed
 * definition per domain, computed on a schedule and stored.
 */
const MOCK_DOMAIN_HEALTH: Record<string, number> = {
  Finance: 81,
  Marketing: 90,
  Sales: 88,
  "Human Resources": 96,
  Operations: 84,
  "Customer Success": 93,
  Product: 97,
  "Supply Chain": 72,
};

/** Thresholds shared by every place that colors a score. */
export function statusForScore(score: number | null): HealthStatus {
  if (score === null) return "unknown";
  if (score >= 90) return "good";
  if (score >= 80) return "warn";
  return "bad";
}

/** Plain-language status, so color is never the only signal. */
export const STATUS_LABEL: Record<HealthStatus, string> = {
  good: "Healthy",
  warn: "Needs attention",
  bad: "At risk",
  unknown: "Not monitored yet",
};

const SELECTED_KEY = "agentflow.domain.selected.v1";
const DEFAULT_SELECTED = "Finance";

const DomainContext = createContext<DomainContextValue | null>(null);

export function DomainProvider({ children }: { children: ReactNode }) {
  const [domains, setDomains] = useState<string[]>(DEFAULT_DOMAINS);
  // Start from the default so server and first client render match; the saved
  // choice is applied right after hydration.
  const [selected, setSelected] = useState<string>(DEFAULT_SELECTED);
  const [allDomains, setAllDomains] = useState(false);
  const [connections, setConnections] = useState<Record<string, ConnectedDomain>>({});
  const [justConnected, setJustConnected] = useState<ConnectedDomain | null>(null);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(SELECTED_KEY);
      if (saved && DEFAULT_DOMAINS.includes(saved)) setSelected(saved);
    } catch {
      /* storage unavailable — fall back to the default */
    }
  }, []);

  const persistSelected = useCallback((name: string) => {
    try {
      window.localStorage.setItem(SELECTED_KEY, name);
    } catch {
      /* best-effort */
    }
  }, []);

  const addDomain = useCallback((name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setDomains((d) => (d.includes(trimmed) ? d : [...d, trimmed]));
  }, []);

  const selectDomain = useCallback(
    (name: string) => {
      setSelected(name);
      setAllDomains(false);
      persistSelected(name);
    },
    [persistSelected],
  );

  const completeConnection = useCallback<DomainContextValue["completeConnection"]>(
    ({ domain, tables, checkCount }) => {
      const trimmed = domain.trim();
      if (!trimmed) return;
      setDomains((d) => (d.includes(trimmed) ? d : [...d, trimmed]));
      const record: ConnectedDomain = {
        name: trimmed,
        tables,
        checkCount,
        connectedAt: Date.now(),
      };
      setConnections((c) => ({ ...c, [trimmed]: record }));
      setSelected(trimmed);
      setAllDomains(false);
      persistSelected(trimmed);
      setJustConnected(record);
    },
    [persistSelected],
  );

  const dismissJustConnected = useCallback(() => setJustConnected(null), []);

  const healthFor = useCallback((name: string) => MOCK_DOMAIN_HEALTH[name] ?? null, []);

  return (
    <DomainContext.Provider
      value={{
        domains,
        selected,
        selectDomain,
        allDomains,
        setAllDomains,
        addDomain,
        connections,
        justConnected,
        dismissJustConnected,
        completeConnection,
        healthFor,
      }}
    >
      {children}
    </DomainContext.Provider>
  );
}

export function useDomainState() {
  const ctx = useContext(DomainContext);
  if (!ctx) throw new Error("useDomainState must be used within DomainProvider");
  return ctx;
}
