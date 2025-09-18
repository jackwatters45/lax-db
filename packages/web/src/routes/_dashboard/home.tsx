import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_dashboard/home')({
  component: Meep,
});

function Meep() {
  return <div />;
}
