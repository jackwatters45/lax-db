import { Link } from '@tanstack/react-router';
import { ArrowLeft, Edit } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getTrendColor, getTrendLabel } from '../-utils';

type PlayerHeaderProps = {
  player: any;
  organizationSlug: string;
  canEdit: boolean;
};

export function PlayerInfoHeader({
  player,
  organizationSlug,
  canEdit,
}: PlayerHeaderProps) {
  return (
    <div className="mb-8">
      <Link to="/$organizationSlug/players" params={{ organizationSlug }}>
        <Button variant="ghost" className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Players
        </Button>
      </Link>

      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground text-xl">
            {player.jerseyNumber}
          </div>
          <div>
            <h1 className="font-bold text-3xl">{player.name}</h1>
            <div className="flex items-center gap-2 text-muted-foreground">
              <span>
                {player.primaryPosition.charAt(0).toUpperCase() +
                  player.primaryPosition.slice(1)}
              </span>
              <span>•</span>
              <span>
                {player.gradeLevel.charAt(0).toUpperCase() +
                  player.gradeLevel.slice(1)}
              </span>
              <span>•</span>
              <span>
                {player.height}, {player.weight}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant={getTrendColor(player.developmentTrend)}>
            {getTrendLabel(player.developmentTrend)}
          </Badge>
          {canEdit && (
            <Button variant="outline" size="sm" asChild>
              <Link
                to="/$organizationSlug/players/$playerId/edit"
                params={{
                  organizationSlug,
                  playerId: player.id,
                }}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit Profile
              </Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
