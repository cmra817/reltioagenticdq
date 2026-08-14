import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { MOCK_INCIDENTS } from "@/components/data-health/widget-model";

type Search = { segment?: string; widget?: string };

export const Route = createFileRoute("/incidents")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    segment: typeof search.segment === "string" ? search.segment : undefined,
    widget: typeof search.widget === "string" ? search.widget : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Incident Manager — AgentFlow Quality" },
      {
        name: "description",
        content:
          "Review data quality incidents by dimension, table, and severity from your Data Health widgets.",
      },
      { property: "og:title", content: "Incident Manager — AgentFlow Quality" },
      { property: "og:description", content: "Data quality incidents filtered by dashboard segment." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: IncidentsPage,
});

function IncidentsPage() {
  const { segment, widget } = Route.useSearch();
  const incidents = segment
    ? MOCK_INCIDENTS.filter((i) => i.segment.toLowerCase() === segment.toLowerCase())
    : MOCK_INCIDENTS;

  return (
    <AppShell activeNav="data-health">
      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="mx-auto max-w-[1200px]">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-[13px]"
            style={{ color: "var(--brand-blue)" }}
          >
            <ArrowLeft size={14} />
            Back to Data health
          </Link>
          <h1 className="mt-3 text-[24px] font-semibold" style={{ color: "var(--ink-900)" }}>
            Incident Manager
          </h1>
          <p className="mt-1 text-[14px]" style={{ color: "var(--ink-500)" }}>
            {segment ? `Filtered by "${segment}"` : "All open incidents"}
            {widget ? ` · from widget "${widget}"` : ""}
          </p>

          <section
            className="mt-6 overflow-hidden rounded-xl border bg-white"
            style={{ borderColor: "var(--hairline)" }}
          >
            <table className="w-full border-collapse text-left text-[13px]">
              <thead>
                <tr
                  className="border-b text-[11px] uppercase tracking-[0.08em]"
                  style={{ borderColor: "var(--hairline)", color: "var(--ink-300)" }}
                >
                  <th className="px-6 py-3 font-semibold">Incident</th>
                  <th className="px-6 py-3 font-semibold">Table</th>
                  <th className="px-6 py-3 font-semibold">Rule</th>
                  <th className="px-6 py-3 font-semibold">Dimension</th>
                  <th className="px-6 py-3 font-semibold">Severity</th>
                  <th className="px-6 py-3 font-semibold">Detected</th>
                </tr>
              </thead>
              <tbody>
                {incidents.map((i) => (
                  <tr
                    key={i.id}
                    className="border-b last:border-b-0 hover:bg-[color:var(--surface-soft)]"
                    style={{ borderColor: "var(--hairline)" }}
                  >
                    <td className="px-6 py-4 font-medium" style={{ color: "var(--ink-900)" }}>
                      {i.id}
                    </td>
                    <td className="px-6 py-4" style={{ color: "var(--ink-700)" }}>
                      {i.table}
                    </td>
                    <td className="px-6 py-4" style={{ color: "var(--ink-700)" }}>
                      {i.rule}
                    </td>
                    <td className="px-6 py-4" style={{ color: "var(--ink-700)" }}>
                      {i.segment}
                    </td>
                    <td className="px-6 py-4" style={{ color: "var(--ink-700)" }}>
                      {i.severity}
                    </td>
                    <td className="px-6 py-4" style={{ color: "var(--ink-500)" }}>
                      {i.detected}
                    </td>
                  </tr>
                ))}
                {incidents.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-12 text-center text-[14px]"
                      style={{ color: "var(--ink-500)" }}
                    >
                      No incidents for this segment.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
