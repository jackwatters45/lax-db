import { createFileRoute, Link } from '@tanstack/react-router';
import { Pencil } from 'lucide-react';
import { useState } from 'react';
import { PageBody, PageContainer } from '@/components/layout/page-content';
import { TeamBreadcrumbSwitcher } from '@/components/nav/team-breadcrumb-switcher';
import {
  ContactInfoEdit,
  ContactInfoView,
} from '@/components/players/contact-info';
import {
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlayerHeader } from './-components/player-header';
import { contactInfo } from './-data-2';

export const Route = createFileRoute(
  '/_protected/$organizationSlug/$teamId/players/$playerId/contact-info',
)({
  component: ContactInfo,
  loader: async () => {
    return { contactInfo };
  },
});

// TODO: update edit version
// TODO: backend
function ContactInfo() {
  const { contactInfo } = Route.useLoaderData();

  const [isEditing, setIsEditing] = useState(false);

  return (
    <>
      <Header />
      <PageBody>
        <PageContainer>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 h-16">
              <CardTitle>Contact Information</CardTitle>
              {!isEditing && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <ContactInfoEdit
                  contactInfo={contactInfo}
                  setIsEditing={setIsEditing}
                />
              ) : (
                <ContactInfoView
                  contactInfo={contactInfo}
                  setIsEditing={setIsEditing}
                />
              )}
            </CardContent>
          </Card>
        </PageContainer>
      </PageBody>
    </>
  );
}

function Header() {
  const { organizationSlug } = Route.useParams();
  const { activeTeam, teams } = Route.useRouteContext();
  const { contactInfo } = Route.useLoaderData();

  return (
    <PlayerHeader
      organizationSlug={organizationSlug}
      teamId={activeTeam.id}
      playerId={contactInfo.id}
    >
      <BreadcrumbItem>
        <BreadcrumbLink className="max-w-full truncate" title="Teams" asChild>
          <Link to="/$organizationSlug" params={{ organizationSlug }}>
            Teams
          </Link>
        </BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbSeparator />
      <TeamBreadcrumbSwitcher
        activeTeam={activeTeam}
        teams={teams}
        organizationSlug={organizationSlug}
      >
        {({ team }) => (
          <Link
            to="/$organizationSlug/$teamId/players/$playerId/contact-info"
            params={{
              organizationSlug,
              teamId: activeTeam.id,
              playerId: contactInfo.id,
            }}
          >
            {team.name}
          </Link>
        )}
      </TeamBreadcrumbSwitcher>
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
      <BreadcrumbSeparator />
      <BreadcrumbItem>
        <BreadcrumbLink title={contactInfo.name!} asChild>
          <Link
            to="/$organizationSlug/$teamId/players/$playerId"
            params={{
              organizationSlug,
              teamId: activeTeam.id,
              playerId: contactInfo.id,
            }}
          >
            {contactInfo.name}
          </Link>
        </BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbItem>
        <BreadcrumbLink title={'Contact Info'} asChild>
          <Link
            to="/$organizationSlug/$teamId/players/$playerId/contact-info"
            params={{
              organizationSlug,
              teamId: activeTeam.id,
              playerId: contactInfo.id,
            }}
          >
            Contact Info
          </Link>
        </BreadcrumbLink>
      </BreadcrumbItem>
    </PlayerHeader>
  );
}
