import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, ArrowRight } from "lucide-react";

export type SchemaChangeType = "added" | "removed" | "renamed" | "type-changed";

export type SchemaChange = {
  column: string;
  type: SchemaChangeType;
  before: string;
  after: string;
};

const TYPE_STYLES: Record<SchemaChangeType, { label: string; color: string; bg: string }> = {
  added: { label: "Added", color: "#15803d", bg: "rgba(34,197,94,0.10)" },
  removed: { label: "Removed", color: "#b42318", bg: "rgba(208,82,82,0.12)" },
  renamed: { label: "Renamed", color: "#b45309", bg: "rgba(180,83,9,0.10)" },
  "type-changed": { label: "Type changed", color: "#b45309", bg: "rgba(180,83,9,0.10)" },
};

export function SchemaDiffModal({
  open,
  onOpenChange,
  table,
  changes,
  runLabel = "Compared against the previous profiling run",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  table: string;
  changes: SchemaChange[];
  runLabel?: string;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/30" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-50 w-[min(640px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2 rounded-2xl border bg-white p-6 shadow-xl"
          style={{ borderColor: "var(--hairline)" }}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <Dialog.Title
                className="text-[18px] font-semibold leading-tight"
                style={{ color: "var(--ink-900)" }}
              >
                Schema changes — {table}
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-[13px]" style={{ color: "var(--ink-500)" }}>
                {runLabel}
              </Dialog.Description>
            </div>
            <Dialog.Close
              aria-label="Close"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-[color:var(--surface-soft)]"
              style={{ color: "var(--ink-700)" }}
            >
              <X size={16} />
            </Dialog.Close>
          </div>

          <table className="mt-5 w-full text-[13px]">
            <thead>
              <tr style={{ color: "var(--ink-500)" }}>
                <th className="pb-2 text-left font-medium">Column</th>
                <th className="pb-2 text-left font-medium">Change</th>
                <th className="pb-2 text-left font-medium">Before → after</th>
              </tr>
            </thead>
            <tbody>
              {changes.map((c) => {
                const s = TYPE_STYLES[c.type];
                return (
                  <tr key={`${c.column}-${c.type}`} className="border-t" style={{ borderColor: "var(--hairline)" }}>
                    <td className="py-2.5 font-mono text-[13px]" style={{ color: "var(--ink-900)" }}>
                      {c.column}
                    </td>
                    <td className="py-2.5">
                      <span
                        className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium"
                        style={{ background: s.bg, color: s.color }}
                      >
                        {s.label}
                      </span>
                    </td>
                    <td className="py-2.5">
                      <span className="inline-flex items-center gap-2 font-mono text-[12px]" style={{ color: "var(--ink-700)" }}>
                        <span>{c.before}</span>
                        <ArrowRight size={12} style={{ color: "var(--ink-300)" }} />
                        <span style={{ color: "var(--ink-900)" }}>{c.after}</span>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {changes.length === 0 && (
            <p className="mt-4 text-[13px]" style={{ color: "var(--ink-500)" }}>
              No schema changes detected in the last run.
            </p>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
