import { DashboardHeader } from '@/components/sidebar/dashboard-header';
import { SettingsSubNav } from './settings-sub-nav';

/**
 * Props for the SettingsHeader component
 */
type SettingsHeaderProps = {
  /** The organization slug from the URL */
  organizationSlug: string;
  /** Child elements to render in the dashboard header */
  children: React.ReactNode;
};

/**
 * SettingsHeader component that renders a header section for settings pages.
 *
 * Combines a dashboard header with settings-specific sub-navigation,
 * providing a consistent layout for all settings-related pages.
 *
 * @param props - The component props
 * @param props.organizationSlug - Organization identifier from URL
 * @param props.activeSettings - Current settings data
 * @param props.children - Dashboard Header Items
 * @returns JSX element containing the settings header layout
 */
export function SettingsHeader({
  organizationSlug,
  children,
}: SettingsHeaderProps) {
  return (
    <div>
      <DashboardHeader>{children}</DashboardHeader>
      <SettingsSubNav organizationSlug={organizationSlug} />
    </div>
  );
}
