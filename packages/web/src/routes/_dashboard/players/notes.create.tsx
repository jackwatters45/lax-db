import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_dashboard/players/notes/create')({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/_dashboard/players/notes/create"!</div>;
}
