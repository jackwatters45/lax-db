import { Link } from '@tanstack/react-router';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { PlayerDetails } from '../-utils';
import { formatDate, getStatusColor } from '../-utils';

type AssignedResourcesProps = {
  player: PlayerDetails;
  organizationSlug: string;
};

export function AssignedResources({
  player,
  organizationSlug,
}: AssignedResourcesProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Assigned Resources</CardTitle>
      </CardHeader>
      <CardContent>
        {player.assignedResources.length > 0 ? (
          <div className="space-y-2">
            {player.assignedResources.slice(0, 3).map((resource) => (
              <div
                key={resource.id}
                className="flex items-center justify-between text-sm"
              >
                <div className="flex-1">
                  <div className="font-medium">{resource.title}</div>
                  <div className="text-muted-foreground text-xs">
                    Due: {formatDate(resource.dueDate)}
                  </div>
                </div>
                <Badge variant={getStatusColor(resource.status)}>
                  {resource.status.replace('_', ' ')}
                </Badge>
              </div>
            ))}
            {player.assignedResources.length > 3 && (
              <Button variant="ghost" size="sm" className="w-full" asChild>
                <Link
                  to="/$organizationSlug/players/$playerId/resources"
                  params={{
                    organizationSlug,
                    playerId: player.id,
                  }}
                >
                  View All ({player.assignedResources.length})
                </Link>
              </Button>
            )}
          </div>
        ) : (
          <p className="text-center text-muted-foreground text-sm">
            No resources assigned
          </p>
        )}
      </CardContent>
    </Card>
  );
}
