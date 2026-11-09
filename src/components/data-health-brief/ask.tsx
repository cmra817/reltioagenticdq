import * as React from "react";

/**
 * Anything on a dashboard that can be discussed. Selecting it opens that
 * dashboard's chat for the day with a question about it already sent.
 * Outside a provider (no `onAsk`) items are plain, so panels stay reusable.
 */
type AskState = { onAsk?: (topic: string) => void; focus?: string | null };
const AskContext = React.createContext<AskState>({});
export const AskProvider = AskContext.Provider;
export const useAsk = () => React.useContext(AskContext);

export function AskItem({
  topic,
  children,
  className = "",
  style,
}: {
  topic: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  const { onAsk, focus } = useAsk();
  const ref = React.useRef<HTMLDivElement>(null);
  const active = focus === topic;
  React.useEffect(() => {
    if (active) ref.current?.scrollIntoView?.({ block: "center", behavior: "smooth" });
  }, [active]);

  if (!onAsk) {
    return (
      <div className={className} style={style}>
        {children}
      </div>
    );
  }
  return (
    <div
      ref={ref}
      role="button"
      tabIndex={0}
      title="Discuss in chat"
      onClick={() => onAsk(topic)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onAsk(topic);
        }
      }}
      className={`cursor-pointer transition-colors hover:bg-[color:var(--surface-soft)] focus-visible:outline-2 focus-visible:outline-[color:var(--brand-blue)] ${className}`}
      style={{
        ...style,
        boxShadow: active ? "0 0 0 2px var(--brand-blue)" : undefined,
        background: active ? "var(--surface-soft)" : style?.background,
      }}
    >
      {children}
    </div>
  );
}
