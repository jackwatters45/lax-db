import { createFileRoute, Link } from '@tanstack/react-router';
import {
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { usage } from '../settings/-data';
import { columns } from './-components/data-table/columns';
import { DataTable } from './-components/data-table/DataTable';
import { TeamHeader } from './-components/team-header';

export const Route = createFileRoute(
  '/_protected/$organizationSlug/$teamId/meep',
)({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <>
      <Header />
      <div className="py-4">
        <DataTable data={usage} columns={columns} />
      </div>
    </>
  );
}

function Header() {
  const { organizationSlug } = Route.useParams();
  const { activeTeam } = Route.useRouteContext();

  return (
    <TeamHeader organizationSlug={organizationSlug} activeTeam={activeTeam}>
      <BreadcrumbItem>
        <BreadcrumbLink className="max-w-full truncate" title="Teams" asChild>
          <Link to="/$organizationSlug" params={{ organizationSlug }}>
            Teams
          </Link>
        </BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbSeparator />
      <BreadcrumbItem>
        <BreadcrumbLink title={activeTeam.name} asChild>
          <Link
            to="/$organizationSlug/$teamId"
            params={{ organizationSlug, teamId: activeTeam.id }}
          >
            {activeTeam.name}
          </Link>
        </BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbSeparator />
      <BreadcrumbItem>
        <BreadcrumbLink title="Players" asChild>
          <Link
            to="/$organizationSlug/$teamId/players"
            params={{ organizationSlug, teamId: activeTeam.id }}
          >
            Players
          </Link>
        </BreadcrumbLink>
      </BreadcrumbItem>
    </TeamHeader>
  );
}
