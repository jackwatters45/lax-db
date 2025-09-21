import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_dashboard/players/assessments/create')({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/_dashboard/players/assesments/creat"!</div>;
}
