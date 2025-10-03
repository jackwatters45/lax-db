import { Phone } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { PlayerDetails } from '../-utils';

type ContactInformationProps = {
  player: PlayerDetails;
};

export function ContactInformation({ player }: ContactInformationProps) {
  if (!player.emergencyContactName && !player.emergencyContactPhone) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Contact Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        {player.emergencyContactName && (
          <div>
            <div className="font-medium">Emergency Contact</div>
            <div className="text-muted-foreground">
              {player.emergencyContactName}
            </div>
          </div>
        )}
        {player.emergencyContactPhone && (
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <a
              href={`tel:${player.emergencyContactPhone}`}
              className="text-blue-600 hover:underline"
            >
              {player.emergencyContactPhone}
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
