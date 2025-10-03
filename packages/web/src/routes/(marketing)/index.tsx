import { createFileRoute, Navigate } from '@tanstack/react-router';

export const Route = createFileRoute('/(marketing)/')({
  component: RouteComponent,
});

function RouteComponent() {
  return <Navigate to="/login" />;
}
