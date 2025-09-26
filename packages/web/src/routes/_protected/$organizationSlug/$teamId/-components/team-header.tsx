import type { Team } from 'better-auth/plugins';
import { DashboardHeader } from '@/components/sidebar/dashboard-header';
import { TeamSubNav } from './team-sub-nav';

/**
 * Props for the TeamHeader component
 */
type TeamHeaderProps = {
  /** The organization slug from the URL */
  organizationSlug: string;
  /** The active team object containing team data */
  activeTeam: Team;
  /** Child elements to render in the dashboard header */
  children: React.ReactNode;
};

/**
 * TeamHeader component that renders a header section for team pages.
 *
 * Combines a dashboard header with team-specific sub-navigation,
 * providing a consistent layout for all team-related pages.
 *
 * @param props - The component props
 * @param props.organizationSlug - Organization identifier from URL
 * @param props.activeTeam - Current team data
 * @param props.children - Dashboard Header Items
 * @returns JSX element containing the team header layout
 */
export function TeamHeader({
  organizationSlug,
  activeTeam,
  children,
}: TeamHeaderProps) {
  return (
    <div>
      <DashboardHeader>{children}</DashboardHeader>
      <TeamSubNav organizationSlug={organizationSlug} teamId={activeTeam.id} />
    </div>
  );
}
