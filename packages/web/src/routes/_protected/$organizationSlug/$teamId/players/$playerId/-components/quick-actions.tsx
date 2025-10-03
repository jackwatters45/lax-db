import { Link } from '@tanstack/react-router';
import { BookOpen, FileText, Target, TrendingUp, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type QuickActionsProps = {
  playerId: string;
  organizationSlug: string;
  permissions: {
    canCreateNotes: boolean;
    canAssess: boolean;
    canAssignResources: boolean;
    canSetGoals: boolean;
  };
};

export function QuickActions({
  playerId,
  organizationSlug,
  permissions,
}: QuickActionsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {permissions.canCreateNotes && (
          <Button variant="outline" className="w-full justify-start" asChild>
            <Link
              to="/$organizationSlug/players/notes/create"
              params={{ organizationSlug }}
              search={{ playerId }}
            >
              <FileText className="mr-2 h-4 w-4" />
              Add Development Note
            </Link>
          </Button>
        )}

        {permissions.canAssess && (
          <Button variant="outline" className="w-full justify-start" asChild>
            <Link
              to="/$organizationSlug/players/assessments/create"
              params={{ organizationSlug }}
              search={{ playerId }}
            >
              <TrendingUp className="mr-2 h-4 w-4" />
              Create Assessment
            </Link>
          </Button>
        )}

        {permissions.canAssignResources && (
          <Button variant="outline" className="w-full justify-start" asChild>
            <Link
              to="/$organizationSlug/players/resources/create"
              params={{ organizationSlug }}
              search={{ playerId }}
            >
              <BookOpen className="mr-2 h-4 w-4" />
              Assign Resource
            </Link>
          </Button>
        )}

        {permissions.canSetGoals && (
          <Button variant="outline" className="w-full justify-start" asChild>
            <Link
              to="/$organizationSlug/players/goals/create"
              params={{ organizationSlug }}
              search={{ playerId }}
            >
              <Target className="mr-2 h-4 w-4" />
              Set Goal
            </Link>
          </Button>
        )}

        <Button variant="outline" className="w-full justify-start" asChild>
          <Link
            to="/$organizationSlug/players/$playerId/stats"
            params={{
              organizationSlug,
              playerId,
            }}
          >
            <Trophy className="mr-2 h-4 w-4" />
            Detailed Stats
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
