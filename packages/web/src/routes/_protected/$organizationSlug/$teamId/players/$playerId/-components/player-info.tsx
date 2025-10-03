import { Link } from '@tanstack/react-router';
import { Edit } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { PlayerInfoType } from '../-data-2';

type PlayerInfoProps = {
  organizationSlug: string;
  teamId: string;
  canEdit: boolean;
  playerInfo: PlayerInfoType;
};

export function PlayerInfo({
  organizationSlug,
  teamId,
  canEdit,
  playerInfo,
}: PlayerInfoProps) {
  return (
    <div className="mb-8">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="font-semibold text-xl">{playerInfo.name}</h1>
            <div className="flex items-center gap-2 text-muted-foreground">
              {[
                playerInfo.primaryPosition && (
                  <span key="position" className="capitalize">
                    {playerInfo.primaryPosition}
                  </span>
                ),
                playerInfo.gradeLevel && (
                  <span key="grade" className="capitalize">
                    {playerInfo.gradeLevel}
                  </span>
                ),
                playerInfo.heightFeet && playerInfo.heightInches && (
                  <span key="height">
                    {playerInfo.heightFeet}'{playerInfo.heightInches}"
                  </span>
                ),
                playerInfo.weightPounds && (
                  <span key="weight">{playerInfo.weightPounds} lbs</span>
                ),
              ]
                .filter(Boolean)
                .map((item, index, array) => (
                  <>
                    {item}
                    {index < array.length - 1 && (
                      <span key={item?.toString()}>{'•'}</span>
                    )}
                  </>
                ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {playerInfo.developmentTrend && (
            <Badge className="capitalize">{playerInfo.developmentTrend}</Badge>
          )}
          {canEdit && (
            <Button variant="outline" size="sm" asChild>
              <Link
                to="/$organizationSlug/$teamId/players/$playerId/edit"
                params={{
                  organizationSlug,
                  teamId,
                  playerId: playerInfo.id,
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
