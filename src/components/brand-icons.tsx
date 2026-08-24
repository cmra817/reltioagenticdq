// Inline SVG brand & UI icons for the Data Quality screen.
// Kept in one file so colors and sizes stay consistent with the design tokens.

import reltioWordmarkUrl from "@/assets/reltio-wordmark.png";

export function ReltioWordmark({ className }: { className?: string }) {
  return (
    <img
      src={reltioWordmarkUrl}
      alt="Reltio"
      className={className}
      style={{ height: 22, width: "auto", display: "block" }}
    />
  );
}

import agentflowLogoUrl from "@/assets/agentflow-logo.png";

export function AgentFlowLogo({ className }: { className?: string }) {
  return (
    <img
      src={agentflowLogoUrl}
      alt="AgentFlow"
      className={className}
      style={{ height: 24, width: "auto", display: "block" }}
    />
  );
}

/* ---------- warehouse logos ---------- */
export function DatabricksIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <path
        d="M20 4 4 12.5l4 2.1L20 8.3l12 6.3 4-2.1L20 4Z"
        fill="#FF3621"
      />
      <path
        d="M4 19.4 20 27.9l16-8.5-4-2.1-12 6.3-12-6.3-4 2.1Z"
        fill="#FF3621"
        opacity="0.85"
      />
      <path
        d="M4 26.4 20 34.9l16-8.5-4-2.1-12 6.3-12-6.3-4 2.1Z"
        fill="#FF3621"
        opacity="0.65"
      />
    </svg>
  );
}

export function SnowflakeIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <g stroke="#29B5E8" strokeWidth="2.4" strokeLinecap="round">
        <line x1="20" y1="4" x2="20" y2="36" />
        <line x1="6" y1="12" x2="34" y2="28" />
        <line x1="6" y1="28" x2="34" y2="12" />
        <line x1="20" y1="4" x2="16" y2="8" />
        <line x1="20" y1="4" x2="24" y2="8" />
        <line x1="20" y1="36" x2="16" y2="32" />
        <line x1="20" y1="36" x2="24" y2="32" />
        <line x1="6" y1="12" x2="6" y2="17" />
        <line x1="6" y1="12" x2="11" y2="12" />
        <line x1="34" y1="28" x2="34" y2="23" />
        <line x1="34" y1="28" x2="29" y2="28" />
        <line x1="6" y1="28" x2="11" y2="28" />
        <line x1="6" y1="28" x2="6" y2="23" />
        <line x1="34" y1="12" x2="29" y2="12" />
        <line x1="34" y1="12" x2="34" y2="17" />
      </g>
      <circle cx="20" cy="20" r="3" fill="#29B5E8" />
    </svg>
  );
}

export function BigQueryIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <path
        d="M20 3 4.5 12v16L20 37l15.5-9V12L20 3Z"
        fill="#4386FA"
      />
      <circle cx="18" cy="18" r="6" stroke="white" strokeWidth="2.4" fill="none" />
      <line x1="22.5" y1="22.5" x2="27" y2="27" stroke="white" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

export function RedshiftIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <ellipse cx="20" cy="9" rx="11" ry="3.5" fill="#1A3D7C" />
      <path d="M9 9v22c0 1.9 4.9 3.5 11 3.5s11-1.6 11-3.5V9" fill="#2A5BB0" />
      <ellipse cx="20" cy="9" rx="11" ry="3.5" fill="#1A3D7C" />
      <path
        d="M9 16c0 1.9 4.9 3.5 11 3.5S31 17.9 31 16M9 23c0 1.9 4.9 3.5 11 3.5S31 24.9 31 23"
        stroke="#0E0E25"
        strokeWidth="1"
        opacity="0.25"
        fill="none"
      />
    </svg>
  );
}

/* ---------- UI icons ---------- */
type IconProps = { className?: string; size?: number };

const I = ({ children, size = 20, className }: IconProps & { children: React.ReactNode }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    {children}
  </svg>
);

export const SidebarToggleIcon = (p: IconProps) => (
  <I {...p}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <line x1="9" y1="4" x2="9" y2="20" />
  </I>
);
export const PlusCircleIcon = (p: IconProps) => (
  <I {...p}>
    <circle cx="12" cy="12" r="9" />
    <line x1="12" y1="8" x2="12" y2="16" />
    <line x1="8" y1="12" x2="16" y2="12" />
  </I>
);
export const HealthIcon = (p: IconProps) => (
  <I {...p}>
    <path d="M3 12h4l2-5 4 10 2-5h6" />
  </I>
);
export const DollarIcon = (p: IconProps) => (
  <I {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M15 9.5c-.7-.9-2-1.5-3.2-1.5-1.7 0-3 .9-3 2.2 0 3 6 1.6 6 4.6 0 1.4-1.4 2.2-3.1 2.2-1.4 0-2.7-.6-3.4-1.6M12 6v12" />
  </I>
);
export const ChevronDownIcon = (p: IconProps) => (
  <I {...p}>
    <polyline points="6 9 12 15 18 9" />
  </I>
);
export const PlusIcon = (p: IconProps) => (
  <I {...p}>
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </I>
);
export const CompassIcon = (p: IconProps) => (
  <I {...p}>
    <circle cx="12" cy="12" r="9" />
    <polygon points="15.5 8.5 13 13 8.5 15.5 11 11" fill="currentColor" stroke="none" />
  </I>
);
export const FolderIcon = (p: IconProps) => (
  <I {...p}>
    <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
  </I>
);
export const BarsIcon = (p: IconProps) => (
  <I {...p}>
    <line x1="6" y1="20" x2="6" y2="12" />
    <line x1="12" y1="20" x2="12" y2="6" />
    <line x1="18" y1="20" x2="18" y2="14" />
  </I>
);
export const SearchIcon = (p: IconProps) => (
  <I {...p}>
    <circle cx="11" cy="11" r="7" />
    <line x1="21" y1="21" x2="16.5" y2="16.5" />
  </I>
);
export const UsersGearIcon = (p: IconProps) => (
  <I {...p}>
    <circle cx="9" cy="9" r="3" />
    <path d="M3 19c0-3 3-5 6-5s6 2 6 5" />
    <circle cx="18" cy="16" r="2" />
  </I>
);
export const UserIcon = (p: IconProps) => (
  <I {...p}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
  </I>
);
export const AppsGridIcon = (p: IconProps) => (
  <I {...p}>
    {[4, 12, 20].map((y) =>
      [4, 12, 20].map((x) => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.4" fill="currentColor" stroke="none" />),
    )}
  </I>
);
export const MicIcon = (p: IconProps) => (
  <I {...p}>
    <rect x="9" y="3" width="6" height="11" rx="3" />
    <path d="M5 11a7 7 0 0 0 14 0" />
    <line x1="12" y1="18" x2="12" y2="22" />
  </I>
);
export const SendIcon = ({ size = 18 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M5 12 19 5l-4 14-3-6-7-1Z" fill="white" />
  </svg>
);
