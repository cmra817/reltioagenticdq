import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Check } from "./add-dataset/mock-checks";
import type { ScheduleConfig } from "./add-dataset/Step3Schedule";

export type CreatedAsset = {
  /** URL slug used by /assets/$assetSlug */
  slug: string;
  name: string;
  type: "table" | "view";
  /** Warehouse type, e.g. Databricks / Snowflake / BigQuery */
  source: string;
  /** Connection display name from the wizard */
  connection: string;
  /** Schema the asset lives in — shown as the dataset breadcrumb */
  schema: string;
  description: string;
  rows: number;
  columnCount: number;
  /** Checks the user kept enabled in step 2 */
  checks: Check[];
  profilingSchedule: ScheduleConfig;
  checksSchedule: ScheduleConfig;
  domain: string;
  createdAt: number;
};

export type CreatedAssetInput = Omit<CreatedAsset, "slug" | "columnCount" | "createdAt">;

export function assetNameToSlug(name: string) {
  return name.toLowerCase().replace(/\s+/g, "-");
}

type CreatedAssetsValue = {
  assets: CreatedAsset[];
  bySlug: Record<string, CreatedAsset>;
  addAssets: (inputs: CreatedAssetInput[]) => void;
  updateAsset: (slug: string, patch: Partial<CreatedAsset>) => void;
  removeAsset: (slug: string) => void;
};

const CreatedAssetsContext = createContext<CreatedAssetsValue | null>(null);

const STORAGE_KEY = "agentflow.created-assets.v1";

export function CreatedAssetsProvider({ children }: { children: ReactNode }) {
  const [assets, setAssets] = useState<CreatedAsset[]>([]);

  // Restore after hydration so a page reload keeps assets added through the wizard.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setAssets(parsed as CreatedAsset[]);
      }
    } catch {
      /* ignore unreadable storage */
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(assets));
    } catch {
      /* ignore quota / privacy-mode failures */
    }
  }, [assets]);

  const addAssets = useCallback((inputs: CreatedAssetInput[]) => {
    if (inputs.length === 0) return;
    setAssets((prev) => {
      const next = [...prev];
      for (const input of inputs) {
        const slug = assetNameToSlug(input.name);
        const fields = new Set(input.checks.map((c) => c.field));
        const record: CreatedAsset = {
          ...input,
          slug,
          columnCount: Math.max(fields.size, 6),
          createdAt: Date.now(),
        };
        const existing = next.findIndex((a) => a.slug === slug);
        if (existing >= 0) next[existing] = record;
        else next.push(record);
      }
      return next;
    });
  }, []);

  const updateAsset = useCallback((slug: string, patch: Partial<CreatedAsset>) => {
    setAssets((prev) => prev.map((a) => (a.slug === slug ? { ...a, ...patch } : a)));
  }, []);

  const removeAsset = useCallback((slug: string) => {
    setAssets((prev) => prev.filter((a) => a.slug !== slug));
  }, []);

  const bySlug = useMemo(() => {
    const map: Record<string, CreatedAsset> = {};
    for (const a of assets) map[a.slug] = a;
    return map;
  }, [assets]);

  return (
    <CreatedAssetsContext.Provider
      value={{ assets, bySlug, addAssets, updateAsset, removeAsset }}
    >
      {children}
    </CreatedAssetsContext.Provider>
  );
}

export function useCreatedAssets(): CreatedAssetsValue {
  const ctx = useContext(CreatedAssetsContext);
  // Tolerate usage outside the provider (e.g. isolated previews) with an empty store.
  return (
    ctx ?? {
      assets: [],
      bySlug: {} as Record<string, CreatedAsset>,
      addAssets: () => {},
      updateAsset: () => {},
      removeAsset: () => {},
    }
  );
}
