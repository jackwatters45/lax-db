import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_dashboard/games/$gameId/edit')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_dashboard/games/$gameId/edit"!</div>
}
