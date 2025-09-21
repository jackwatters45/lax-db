import { createFileRoute, Link } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import {
  Clock,
  Dumbbell,
  Filter,
  Plus,
  Search,
  Star,
  Target,
  Timer,
  Users,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

// Mock data for drill bank
const mockDrillsData = {
  drills: [
    {
      id: '1',
      name: 'Fast Break Finish',
      description:
        'Practice finishing shots on fast break opportunities with defensive pressure. Focus on accuracy under pressure.',
      category: 'Shooting',
      categoryColor: '#ef4444',
      difficulty: 'intermediate',
      duration: 20,
      playerCountMin: 6,
      playerCountMax: 12,
      equipment: ['Cones', 'Balls', 'Goals'],
      skillsFocus: ['Shooting', 'Ball Handling', 'Speed'],
      tags: ['fast-break', 'finishing', 'pressure'],
      isFavorite: true,
      usageCount: 12,
      effectiveness: 8.5,
      lastUsed: new Date('2024-09-23'),
      createdBy: 'Coach Johnson',
    },
    {
      id: '2',
      name: 'Ground Ball Battles',
      description:
        'Competitive ground ball drills to improve technique and aggressiveness in 50/50 situations.',
      category: 'Fundamentals',
      categoryColor: '#10b981',
      difficulty: 'beginner',
      duration: 15,
      playerCountMin: 8,
      playerCountMax: 16,
      equipment: ['Balls', 'Cones'],
      skillsFocus: ['Ground Balls', 'Body Position', 'Aggression'],
      tags: ['ground-balls', 'fundamentals', 'competitive'],
      isFavorite: false,
      usageCount: 8,
      effectiveness: 9.2,
      lastUsed: new Date('2024-09-21'),
      createdBy: 'Coach Smith',
    },
    {
      id: '3',
      name: 'Man Down Defense',
      description:
        'Structured defensive drill for man-down situations. Practice communication and positioning.',
      category: 'Defense',
      categoryColor: '#3b82f6',
      difficulty: 'advanced',
      duration: 25,
      playerCountMin: 10,
      playerCountMax: null,
      equipment: ['Goals', 'Balls'],
      skillsFocus: ['Team Defense', 'Communication', 'Positioning'],
      tags: ['man-down', 'defense', 'communication'],
      isFavorite: true,
      usageCount: 6,
      effectiveness: 7.8,
      lastUsed: new Date('2024-09-19'),
      createdBy: 'Coach Johnson',
    },
    {
      id: '4',
      name: 'Dodge and Shoot',
      description:
        'Individual offensive skill drill focusing on dodging defenders and quick release shots.',
      category: 'Shooting',
      categoryColor: '#ef4444',
      difficulty: 'intermediate',
      duration: 18,
      playerCountMin: 4,
      playerCountMax: 8,
      equipment: ['Cones', 'Balls', 'Goals'],
      skillsFocus: ['Dodging', 'Shooting', 'Footwork'],
      tags: ['dodging', 'shooting', 'individual'],
      isFavorite: false,
      usageCount: 10,
      effectiveness: 8.1,
      lastUsed: new Date('2024-09-17'),
      createdBy: 'Coach Davis',
    },
    {
      id: '5',
      name: 'Passing in Traffic',
      description:
        'Improve passing accuracy and decision-making in congested areas of the field.',
      category: 'Passing',
      categoryColor: '#f59e0b',
      difficulty: 'intermediate',
      duration: 20,
      playerCountMin: 8,
      playerCountMax: 12,
      equipment: ['Balls', 'Cones'],
      skillsFocus: ['Passing', 'Vision', 'Decision Making'],
      tags: ['passing', 'traffic', 'vision'],
      isFavorite: true,
      usageCount: 14,
      effectiveness: 8.9,
      lastUsed: new Date('2024-09-22'),
      createdBy: 'Coach Martinez',
    },
    {
      id: '6',
      name: 'Transition Sprints',
      description:
        'Conditioning drill that simulates game transitions while maintaining possession.',
      category: 'Conditioning',
      categoryColor: '#8b5cf6',
      difficulty: 'beginner',
      duration: 12,
      playerCountMin: 6,
      playerCountMax: 20,
      equipment: ['Cones', 'Balls'],
      skillsFocus: ['Conditioning', 'Ball Control', 'Transition'],
      tags: ['conditioning', 'transition', 'endurance'],
      isFavorite: false,
      usageCount: 9,
      effectiveness: 7.5,
      lastUsed: new Date('2024-09-20'),
      createdBy: 'Coach Wilson',
    },
  ],
  categories: [
    { name: 'All', count: 45, color: '#6b7280' },
    { name: 'Shooting', count: 8, color: '#ef4444' },
    { name: 'Passing', count: 7, color: '#f59e0b' },
    { name: 'Defense', count: 6, color: '#3b82f6' },
    { name: 'Fundamentals', count: 9, color: '#10b981' },
    { name: 'Conditioning', count: 5, color: '#8b5cf6' },
    { name: 'Goalie', count: 4, color: '#ec4899' },
    { name: 'Face-offs', count: 3, color: '#14b8a6' },
    { name: 'Transition', count: 3, color: '#f97316' },
  ],
  difficultyLevels: ['All', 'Beginner', 'Intermediate', 'Advanced'],
};

// Server function for getting drills data
const getDrillsData = createServerFn().handler(async () => {
  // TODO: Replace with actual API call
  // const { DrillAPI } = await import('@lax-db/core/practice/drills');
  // const request = getWebRequest();
  // return await DrillAPI.getDrills(teamId, filters, request.headers);

  return mockDrillsData;
});

// Server function for permissions
const getDrillsPermissions = createServerFn().handler(async () => {
  return {
    canCreateDrills: true,
    canEditDrills: true,
    canDeleteDrills: true,
    canManageCategories: true,
  };
});

export const Route = createFileRoute('/_dashboard/practice/drills/')({
  component: DrillsList,
  validateSearch: (search: Record<string, unknown>) => ({
    search: (search.search as string) || '',
    category: (search.category as string) || 'All',
    difficulty: (search.difficulty as string) || 'All',
    favorites: search.favorites === 'true',
  }),
  loader: async () => {
    const [data, permissions] = await Promise.all([
      getDrillsData(),
      getDrillsPermissions(),
    ]);

    return { data, permissions };
  },
});

function DrillsList() {
  const { data, permissions } = Route.useLoaderData();
  const search = Route.useSearch();

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'secondary';
      case 'intermediate':
        return 'default';
      case 'advanced':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const formatPlayerCount = (min: number, max: number | null) => {
    return max ? `${min}-${max}` : `${min}+`;
  };

  // Filter drills based on search criteria
  const filteredDrills = data.drills.filter((drill) => {
    const matchesSearch =
      search.search === '' ||
      drill.name.toLowerCase().includes(search.search.toLowerCase()) ||
      drill.description.toLowerCase().includes(search.search.toLowerCase()) ||
      drill.tags.some((tag) =>
        tag.toLowerCase().includes(search.search.toLowerCase()),
      );

    const matchesCategory =
      search.category === 'All' || drill.category === search.category;

    const matchesDifficulty =
      search.difficulty === 'All' ||
      drill.difficulty.toLowerCase() === search.difficulty.toLowerCase();

    const matchesFavorites = !search.favorites || drill.isFavorite;

    return (
      matchesSearch && matchesCategory && matchesDifficulty && matchesFavorites
    );
  });

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl">Drill Bank</h1>
          <p className="text-muted-foreground">
            Browse and manage your team's drill library
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to="/practice">
              <Target className="mr-2 h-4 w-4" />
              Dashboard
            </Link>
          </Button>
          {permissions.canCreateDrills && (
            <Button disabled>
              <Plus className="mr-2 h-4 w-4" />
              New Drill
            </Button>
          )}
        </div>
      </div>

      {/* Filters and Search */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search drills..." className="pl-10" />
            </div>

            {/* Category Filter */}
            <select className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50">
              {data.categories.map((category) => (
                <option key={category.name} value={category.name}>
                  {category.name} ({category.count})
                </option>
              ))}
            </select>

            {/* Difficulty Filter */}
            <select className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50">
              {data.difficultyLevels.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>

            {/* Favorites Toggle */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="favorites"
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label htmlFor="favorites" className="text-sm font-medium">
                Favorites only
              </label>
            </div>
          </div>

          {/* Results count */}
          <div className="mt-4 text-muted-foreground text-sm">
            Showing {filteredDrills.length} of {data.drills.length} drills
          </div>
        </CardContent>
      </Card>

      {/* Drills Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredDrills.map((drill) => (
          <Card
            key={drill.id}
            className="group hover:shadow-lg transition-shadow"
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-lg text-white"
                    style={{ backgroundColor: drill.categoryColor }}
                  >
                    <Dumbbell className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      <span className="hover:underline cursor-pointer">
                        {drill.name}
                      </span>
                      {drill.isFavorite && (
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      )}
                    </CardTitle>
                    <p className="text-muted-foreground text-sm">
                      {drill.category}
                    </p>
                  </div>
                </div>
                <Badge variant={getDifficultyColor(drill.difficulty)}>
                  {drill.difficulty}
                </Badge>
              </div>
            </CardHeader>

            <CardContent>
              <p className="mb-4 text-muted-foreground text-sm line-clamp-2">
                {drill.description}
              </p>

              {/* Key Stats */}
              <div className="mb-4 grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="font-bold text-sm">{drill.duration}min</div>
                  <div className="text-muted-foreground text-xs">Duration</div>
                </div>
                <div>
                  <div className="font-bold text-sm">
                    {formatPlayerCount(
                      drill.playerCountMin,
                      drill.playerCountMax,
                    )}
                  </div>
                  <div className="text-muted-foreground text-xs">Players</div>
                </div>
                <div>
                  <div className="font-bold text-sm">
                    {drill.effectiveness}/10
                  </div>
                  <div className="text-muted-foreground text-xs">Rating</div>
                </div>
              </div>

              {/* Equipment */}
              <div className="mb-4">
                <div className="mb-1 text-xs font-medium">Equipment:</div>
                <div className="flex flex-wrap gap-1">
                  {drill.equipment.slice(0, 3).map((item) => (
                    <Badge key={item} variant="outline" className="text-xs">
                      {item}
                    </Badge>
                  ))}
                  {drill.equipment.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{drill.equipment.length - 3}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Skills Focus */}
              <div className="mb-4">
                <div className="mb-1 text-xs font-medium">Skills:</div>
                <div className="flex flex-wrap gap-1">
                  {drill.skillsFocus.slice(0, 2).map((skill) => (
                    <Badge key={skill} variant="secondary" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                  {drill.skillsFocus.length > 2 && (
                    <Badge variant="secondary" className="text-xs">
                      +{drill.skillsFocus.length - 2}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Meta info */}
              <div className="mb-4 space-y-1 text-muted-foreground text-xs">
                <div className="flex items-center gap-1">
                  <Timer className="h-3 w-3" />
                  <span>Used {drill.usageCount} times</span>
                </div>
                <div>Last used: {formatDate(drill.lastUsed)}</div>
                <div>Created by: {drill.createdBy}</div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button size="sm" className="flex-1" disabled>
                  View Details
                </Button>
                {permissions.canEditDrills && (
                  <Button size="sm" variant="outline" disabled>
                    Edit
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredDrills.length === 0 && (
        <Card className="py-12">
          <CardContent className="text-center">
            <Dumbbell className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 font-semibold text-lg">No drills found</h3>
            <p className="mb-4 text-muted-foreground">
              Try adjusting your search criteria or create a new drill.
            </p>
            {permissions.canCreateDrills && (
              <Button disabled>
                <Plus className="mr-2 h-4 w-4" />
                Create New Drill
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
