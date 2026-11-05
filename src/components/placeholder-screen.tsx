/**
 * Stand-in for a destination that is designed but not built yet. It states what
 * the page will hold, so the nav item doesn't lead to a blank screen.
 */
export function PlaceholderScreen({
  title,
  summary,
  planned,
}: {
  title: string;
  summary: string;
  planned: { heading: string; body: string }[];
}) {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-y-auto px-8 pb-32 pt-6">
      <h1 className="text-[28px] font-semibold leading-tight" style={{ color: "var(--ink-900)" }}>
        {title}
      </h1>
      <p className="mt-2 max-w-2xl text-[15px]" style={{ color: "var(--ink-700)" }}>
        {summary}
      </p>

      <div
        className="mt-8 max-w-2xl rounded-2xl border bg-white/80 p-5"
        style={{ borderColor: "var(--hairline)", boxShadow: "var(--shadow-card)" }}
      >
        <div
          className="text-[11px] font-semibold uppercase tracking-wide"
          style={{ color: "var(--ink-300)" }}
        >
          Coming next
        </div>
        <ul className="mt-3 space-y-3">
          {planned.map((item) => (
            <li key={item.heading}>
              <div className="text-[14px] font-semibold" style={{ color: "var(--ink-900)" }}>
                {item.heading}
              </div>
              <div className="text-[13px]" style={{ color: "var(--ink-500)" }}>
                {item.body}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
