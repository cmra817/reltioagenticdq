import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

export type ConnectedDomain = {
  name: string;
  tables: string[]; // friendly table names, e.g. "customers"
  checkCount: number;
  connectedAt: number;
};

type DomainContextValue = {
  domains: string[];
  selected: string;
  selectDomain: (name: string) => void;
  addDomain: (name: string) => void;
  /** Connection details keyed by domain name. */
  connections: Record<string, ConnectedDomain>;
  /** Most recently connected domain (drives the breadcrumb banner). */
  justConnected: ConnectedDomain | null;
  dismissJustConnected: () => void;
  /** Called when AddDataset wizard finishes — saves tables/checks under domain. */
  completeConnection: (input: { domain: string; tables: string[]; checkCount: number }) => void;
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

const DomainContext = createContext<DomainContextValue | null>(null);

export function DomainProvider({ children }: { children: ReactNode }) {
  const [domains, setDomains] = useState<string[]>(DEFAULT_DOMAINS);
  const [selected, setSelected] = useState<string>("Finance");
  const [connections, setConnections] = useState<Record<string, ConnectedDomain>>({});
  const [justConnected, setJustConnected] = useState<ConnectedDomain | null>(null);

  const addDomain = useCallback((name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setDomains((d) => (d.includes(trimmed) ? d : [...d, trimmed]));
  }, []);

  const selectDomain = useCallback((name: string) => {
    setSelected(name);
  }, []);

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
      setJustConnected(record);
    },
    [],
  );

  const dismissJustConnected = useCallback(() => setJustConnected(null), []);

  return (
    <DomainContext.Provider
      value={{
        domains,
        selected,
        selectDomain,
        addDomain,
        connections,
        justConnected,
        dismissJustConnected,
        completeConnection,
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
