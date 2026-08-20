import type { DashboardTab } from "@/app/components/dashboard/constants";

export function DashboardTabIcon({ tab }: { tab: DashboardTab }) {
  const paths: Record<DashboardTab, React.ReactNode> = {
    SWIMLANE: <><path d="M4 5h16M4 12h16M4 19h16" /><path d="M8 3v18M15 3v18" /></>,
    LIST: <><path d="M9 6h11M9 12h11M9 18h11" /><path d="M4 6h.01M4 12h.01M4 18h.01" /></>,
    SCHEDULE: <><path d="M4 19V5M4 19h16" /><path d="m7 15 4-5 3 2 5-7" /></>,
    LEGAL: <><path d="M6 3h9l3 3v15H6z" /><path d="M9 9h6M9 13h6M9 17h4" /></>,
    GAPS: <><path d="M12 3 3 20h18z" /><path d="M12 9v5M12 17h.01" /></>,
  };
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[tab]}</svg>;
}
