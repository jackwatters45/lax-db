import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_dashboard/players/$playerId/edit')({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/_dashboard/players/$playerId/edit"!</div>;
}
