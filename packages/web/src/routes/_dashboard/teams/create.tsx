import { useMutation } from '@tanstack/react-query';
import { createFileRoute, Link, useRouter } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Server function for creating teams
const createTeam = createServerFn({ method: 'POST' })
  .validator((data: { name: string }) => data)
  .handler(async ({ data }) => {
    const { TeamsAPI } = await import('@lax-db/core/teams/index');
    return await TeamsAPI.createTeam(data);
  });

export const Route = createFileRoute('/_dashboard/teams/create')({
  component: CreateTeamPage,
});

function CreateTeamPage() {
  const router = useRouter();
  const [teamName, setTeamName] = useState('');
  const [description, setDescription] = useState('');
  // Use React Query mutation for team creation
  const createTeamMutation = useMutation({
    mutationKey: ['createTeam'],
    mutationFn: (data: { name: string }) => createTeam({ data }),
    onSuccess: () => {
      toast.success(`Team "${teamName.trim()}" created successfully!`);
      router.navigate({ to: '/teams' });
    },
    onError: (error) => {
      toast.error('Failed to create team. Please try again.');
      console.error('Create team error:', error);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim()) return;

    createTeamMutation.mutate({
      name: teamName.trim(),
    });
  };

  const handleBack = () => {
    router.navigate({ to: '/teams' });
  };

  return (
    <div className="container mx-auto max-w-2xl py-8">
      <div className="mb-8">
        <Button variant="ghost" className="mb-4">
          <Link to="/teams">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Teams
          </Link>
        </Button>

        <h1 className="font-bold text-3xl">Create New Team</h1>
        <p className="text-muted-foreground">
          Add a new team to your organization
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Team Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="teamName"
                className="mb-2 block font-medium text-sm"
              >
                Team Name *
              </label>
              <input
                id="teamName"
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="e.g., U18s, Senior Men's A, Women's Team"
                className="w-full rounded-md border border-input px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
                required
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="mb-2 block font-medium text-sm"
              >
                Description (Optional)
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of the team..."
                rows={3}
                className="w-full rounded-md border border-input px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createTeamMutation.isPending || !teamName.trim()}
                className="flex-1"
              >
                {createTeamMutation.isPending ? 'Creating...' : 'Create Team'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
