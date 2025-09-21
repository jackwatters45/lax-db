import { useMutation } from '@tanstack/react-query';
import { createFileRoute, Link, useRouter } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { ArrowLeft, Globe, Mail, MapPin, Phone, Users } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Mock server function for creating opposing teams
const createOpposingTeam = createServerFn({ method: 'POST' })
  .validator((data: CreateOpposingTeamInput) => data)
  .handler(async ({ data }) => {
    console.log('Creating opposing team:', data);
    // TODO: Replace with actual API call
    // const { ScoutingAPI } = await import('@lax-db/core/scouting/index');
    // const request = getWebRequest();
    // return await ScoutingAPI.createOpposingTeam(data, request.headers);

    // Mock delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return {
      id: Math.random().toString(36).substr(2, 9),
      ...data,
      wins: 0,
      losses: 0,
      ties: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      reportsCount: 0,
      lastScoutedDate: null,
    };
  });

type CreateOpposingTeamInput = {
  name: string;
  leagueName?: string;
  division?: string;
  coachName?: string;
  assistantCoaches?: string[];
  homeField?: string;
  teamColors?: string;
  mascot?: string;
  coachEmail?: string;
  coachPhone?: string;
  teamWebsite?: string;
  typicalStyle?: 'aggressive' | 'fast_break' | 'possession' | 'defensive';
  strengths?: string[];
  weaknesses?: string[];
  keyPlayers?: string[];
  notes?: string;
};

export const Route = createFileRoute('/_dashboard/scouting/teams/create')({
  component: CreateOpposingTeamPage,
});

function CreateOpposingTeamPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<CreateOpposingTeamInput>({
    name: '',
    leagueName: '',
    division: '',
    coachName: '',
    assistantCoaches: [],
    homeField: '',
    teamColors: '',
    mascot: '',
    coachEmail: '',
    coachPhone: '',
    teamWebsite: '',
    typicalStyle: 'aggressive',
    strengths: [],
    weaknesses: [],
    keyPlayers: [],
    notes: '',
  });

  // Text input states for array fields
  const [strengthsText, setStrengthsText] = useState('');
  const [weaknessesText, setWeaknessesText] = useState('');
  const [keyPlayersText, setKeyPlayersText] = useState('');
  const [assistantCoachesText, setAssistantCoachesText] = useState('');

  const createTeamMutation = useMutation({
    mutationKey: ['createOpposingTeam'],
    mutationFn: (data: CreateOpposingTeamInput) => createOpposingTeam({ data }),
    onSuccess: (team) => {
      toast.success(`${team.name} added successfully!`);
      router.invalidate();
      router.navigate({ to: '/scouting/teams' });
    },
    onError: (error) => {
      toast.error('Failed to create team. Please try again.');
      console.error('Create team error:', error);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Team name is required.');
      return;
    }

    // Convert text inputs to arrays
    const finalData = {
      ...formData,
      strengths: strengthsText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      weaknesses: weaknessesText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      keyPlayers: keyPlayersText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      assistantCoaches: assistantCoachesText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    };

    createTeamMutation.mutate(finalData);
  };

  const handleInputChange = (
    field: keyof CreateOpposingTeamInput,
    value: string | undefined,
  ) => {
    if (value !== undefined) {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }
  };

  return (
    <div className="container mx-auto max-w-4xl py-8">
      <div className="mb-8">
        <Link to="/scouting/teams">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Opposing Teams
          </Button>
        </Link>

        <h1 className="font-bold text-3xl">Add Opposing Team</h1>
        <p className="text-muted-foreground">
          Create a new opposing team profile for scouting
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label
                  htmlFor="name"
                  className="mb-2 block font-medium text-sm"
                >
                  Team Name *
                </label>
                <input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="e.g., Riverside Hawks, Central Valley Eagles"
                  className="w-full rounded-md border border-input px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="leagueName"
                    className="mb-2 block font-medium text-sm"
                  >
                    League
                  </label>
                  <input
                    id="leagueName"
                    type="text"
                    value={formData.leagueName}
                    onChange={(e) =>
                      handleInputChange('leagueName', e.target.value)
                    }
                    placeholder="Metro Lacrosse League"
                    className="w-full rounded-md border border-input px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div>
                  <label
                    htmlFor="division"
                    className="mb-2 block font-medium text-sm"
                  >
                    Division
                  </label>
                  <input
                    id="division"
                    type="text"
                    value={formData.division}
                    onChange={(e) =>
                      handleInputChange('division', e.target.value)
                    }
                    placeholder="Division A"
                    className="w-full rounded-md border border-input px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="teamColors"
                    className="mb-2 block font-medium text-sm"
                  >
                    Team Colors
                  </label>
                  <input
                    id="teamColors"
                    type="text"
                    value={formData.teamColors}
                    onChange={(e) =>
                      handleInputChange('teamColors', e.target.value)
                    }
                    placeholder="Blue and Gold"
                    className="w-full rounded-md border border-input px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div>
                  <label
                    htmlFor="mascot"
                    className="mb-2 block font-medium text-sm"
                  >
                    Mascot
                  </label>
                  <input
                    id="mascot"
                    type="text"
                    value={formData.mascot}
                    onChange={(e) =>
                      handleInputChange('mascot', e.target.value)
                    }
                    placeholder="Hawks"
                    className="w-full rounded-md border border-input px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="homeField"
                  className="mb-2 block font-medium text-sm"
                >
                  <MapPin className="mr-1 inline h-4 w-4" />
                  Home Field
                </label>
                <input
                  id="homeField"
                  type="text"
                  value={formData.homeField}
                  onChange={(e) =>
                    handleInputChange('homeField', e.target.value)
                  }
                  placeholder="Memorial Stadium, Sports Complex"
                  className="w-full rounded-md border border-input px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div>
                <label
                  htmlFor="typicalStyle"
                  className="mb-2 block font-medium text-sm"
                >
                  Playing Style
                </label>
                <select
                  id="typicalStyle"
                  value={formData.typicalStyle}
                  onChange={(e) =>
                    handleInputChange(
                      'typicalStyle',
                      e.target.value as CreateOpposingTeamInput['typicalStyle'],
                    )
                  }
                  className="w-full rounded-md border border-input px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="aggressive">Aggressive</option>
                  <option value="fast_break">Fast Break</option>
                  <option value="possession">Possession</option>
                  <option value="defensive">Defensive</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label
                  htmlFor="coachName"
                  className="mb-2 block font-medium text-sm"
                >
                  Head Coach
                </label>
                <input
                  id="coachName"
                  type="text"
                  value={formData.coachName}
                  onChange={(e) =>
                    handleInputChange('coachName', e.target.value)
                  }
                  placeholder="John Smith"
                  className="w-full rounded-md border border-input px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div>
                <label
                  htmlFor="assistantCoaches"
                  className="mb-2 block font-medium text-sm"
                >
                  Assistant Coaches
                </label>
                <input
                  id="assistantCoaches"
                  type="text"
                  value={assistantCoachesText}
                  onChange={(e) => setAssistantCoachesText(e.target.value)}
                  placeholder="Mike Johnson, Sarah Wilson (comma separated)"
                  className="w-full rounded-md border border-input px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <p className="mt-1 text-muted-foreground text-xs">
                  Separate multiple coaches with commas
                </p>
              </div>

              <div>
                <label
                  htmlFor="coachEmail"
                  className="mb-2 block font-medium text-sm"
                >
                  <Mail className="mr-1 inline h-4 w-4" />
                  Coach Email
                </label>
                <input
                  id="coachEmail"
                  type="email"
                  value={formData.coachEmail}
                  onChange={(e) =>
                    handleInputChange('coachEmail', e.target.value)
                  }
                  placeholder="coach@team.com"
                  className="w-full rounded-md border border-input px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div>
                <label
                  htmlFor="coachPhone"
                  className="mb-2 block font-medium text-sm"
                >
                  <Phone className="mr-1 inline h-4 w-4" />
                  Coach Phone
                </label>
                <input
                  id="coachPhone"
                  type="tel"
                  value={formData.coachPhone}
                  onChange={(e) =>
                    handleInputChange('coachPhone', e.target.value)
                  }
                  placeholder="(555) 123-4567"
                  className="w-full rounded-md border border-input px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div>
                <label
                  htmlFor="teamWebsite"
                  className="mb-2 block font-medium text-sm"
                >
                  <Globe className="mr-1 inline h-4 w-4" />
                  Team Website
                </label>
                <input
                  id="teamWebsite"
                  type="url"
                  value={formData.teamWebsite}
                  onChange={(e) =>
                    handleInputChange('teamWebsite', e.target.value)
                  }
                  placeholder="https://team-website.com"
                  className="w-full rounded-md border border-input px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </CardContent>
          </Card>

          {/* Strategic Information */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Strategic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label
                    htmlFor="strengths"
                    className="mb-2 block font-medium text-sm"
                  >
                    Team Strengths
                  </label>
                  <input
                    id="strengths"
                    type="text"
                    value={strengthsText}
                    onChange={(e) => setStrengthsText(e.target.value)}
                    placeholder="Fast Break, Strong Defense, Experienced Players"
                    className="w-full rounded-md border border-input px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <p className="mt-1 text-muted-foreground text-xs">
                    Separate multiple strengths with commas
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="weaknesses"
                    className="mb-2 block font-medium text-sm"
                  >
                    Team Weaknesses
                  </label>
                  <input
                    id="weaknesses"
                    type="text"
                    value={weaknessesText}
                    onChange={(e) => setWeaknessesText(e.target.value)}
                    placeholder="Poor Face-offs, Weak Left Side, Penalties"
                    className="w-full rounded-md border border-input px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <p className="mt-1 text-muted-foreground text-xs">
                    Separate multiple weaknesses with commas
                  </p>
                </div>
              </div>

              <div>
                <label
                  htmlFor="keyPlayers"
                  className="mb-2 block font-medium text-sm"
                >
                  Key Players
                </label>
                <input
                  id="keyPlayers"
                  type="text"
                  value={keyPlayersText}
                  onChange={(e) => setKeyPlayersText(e.target.value)}
                  placeholder="#23 Johnson (Attack), #1 Smith (Goalie), #15 Davis (Midfield)"
                  className="w-full rounded-md border border-input px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <p className="mt-1 text-muted-foreground text-xs">
                  Include jersey numbers and positions, separate with commas
                </p>
              </div>

              <div>
                <label
                  htmlFor="notes"
                  className="mb-2 block font-medium text-sm"
                >
                  Additional Notes
                </label>
                <textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Any additional information about this team..."
                  rows={3}
                  className="w-full rounded-md border border-input px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Submit Buttons */}
        <div className="mt-6 flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.navigate({ to: '/scouting/teams' })}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={createTeamMutation.isPending}
            className="flex-1"
          >
            {createTeamMutation.isPending ? 'Creating Team...' : 'Create Team'}
          </Button>
        </div>
      </form>
    </div>
  );
}
