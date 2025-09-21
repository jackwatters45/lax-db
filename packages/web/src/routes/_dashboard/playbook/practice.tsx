import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_dashboard/playbook/practice')({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/_dashboard/playbook/practice"!</div>;
}
