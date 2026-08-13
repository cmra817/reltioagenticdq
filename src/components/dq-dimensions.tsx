import type { LucideIcon } from "lucide-react";
import {
  BadgeCheck,
  Clock,
  Fingerprint,
  GitCompareArrows,
  Link2,
  PieChart,
  Ruler,
  ShieldQuestion,
  Target,
} from "lucide-react";

/**
 * Canonical DQ dimensions for the prototype. This is the fixed list — do not add
 * new dimensions without updating this file, since every dimension surface
 * (pills, tables, cards, wizard, activity feed) reads its icon from here.
 */
export const DQ_DIMENSIONS = [
  "Validity",
  "Completeness",
  "Accuracy",
  "Consistency",
  "Uniqueness",
  "Referential integrity",
  "Format and range",
] as const;

export type DQDimension = (typeof DQ_DIMENSIONS)[number];

export type DimensionMeta = {
  icon: LucideIcon;
  /** Foreground / icon color token or hex. */
  color: string;
  /** Soft background used behind the icon. */
  bg: string;
};

export const DIMENSION_META: Record<DQDimension, DimensionMeta> = {
  Validity: { icon: BadgeCheck, color: "#1d4ed8", bg: "#eaf1ff" },
  Completeness: { icon: PieChart, color: "#0f766e", bg: "#e6f6f4" },
  Accuracy: { icon: Target, color: "#b45309", bg: "#fdf1e0" },
  Consistency: { icon: GitCompareArrows, color: "#7c3aed", bg: "#f2ecfe" },
  Uniqueness: { icon: Fingerprint, color: "#be185d", bg: "#fdeaf3" },
  "Referential integrity": { icon: Link2, color: "#0369a1", bg: "#e6f2fb" },
  "Format and range": { icon: Ruler, color: "#4d7c0f", bg: "#f0f7e4" },
};

/** Legacy / non-canonical labels still present in some mock data. */
const FALLBACK_META: Record<string, DimensionMeta> = {
  Timeliness: { icon: Clock, color: "#475569", bg: "#f1f5f9" },
};

export function getDimensionMeta(label: string): DimensionMeta {
  return (
    DIMENSION_META[label as DQDimension] ??
    FALLBACK_META[label] ?? { icon: ShieldQuestion, color: "#475569", bg: "#f1f5f9" }
  );
}

export function DimensionIcon({ label, size = 14 }: { label: string; size?: number }) {
  const meta = getDimensionMeta(label);
  const Icon = meta.icon;
  return <Icon size={size} color={meta.color} strokeWidth={2} aria-hidden />;
}

/** Icon + label chip used anywhere a dimension is displayed. */
export function DimensionBadge({
  label,
  size = "md",
  showLabel = true,
}: {
  label: string;
  size?: "sm" | "md";
  showLabel?: boolean;
}) {
  const meta = getDimensionMeta(label);
  const Icon = meta.icon;
  const iconSize = size === "sm" ? 12 : 14;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-[12px]"
      }`}
      style={{ background: meta.bg, color: meta.color }}
      title={label}
    >
      <Icon size={iconSize} strokeWidth={2} aria-hidden />
      {showLabel ? <span>{label}</span> : <span className="sr-only">{label}</span>}
    </span>
  );
}
