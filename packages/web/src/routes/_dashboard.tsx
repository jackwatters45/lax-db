import { createFileRoute, Outlet } from '@tanstack/react-router';
import { DashboardHeader } from '@/components/nav/header';

export const Route = createFileRoute('/_dashboard')({
  component: DashboardLayout,
});

function DashboardLayout() {
  return (
    <>
      <DashboardHeader />
      <Outlet />
    </>
  );
}
