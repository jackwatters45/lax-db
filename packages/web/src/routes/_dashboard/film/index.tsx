import { createFileRoute } from '@tanstack/react-router';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import {
  Upload,
  Play,
  Search,
  Filter,
  Calendar,
  Clock,
  Users,
  Eye,
  Download,
  MoreHorizontal,
  PlayCircle,
  FileVideo,
} from 'lucide-react';
import { useState } from 'react';

export const Route = createFileRoute('/_dashboard/film/')({
  component: FilmLibraryPage,
});

interface GameFilm {
  id: string;
  title: string;
  gameDate: string;
  opponent: string;
  gameType: 'Regular Season' | 'Playoff' | 'Scrimmage' | 'Practice';
  duration: number;
  uploadDate: string;
  uploadedBy: string;
  fileSize: string;
  resolution: string;
  format: string;
  thumbnail: string;
  description: string;
  tags: string[];
  events: FilmEvent[];
  views: number;
  isAnalyzed: boolean;
}

interface FilmEvent {
  id: string;
  timestamp: number;
  type:
    | 'goal'
    | 'assist'
    | 'save'
    | 'penalty'
    | 'substitution'
    | 'timeout'
    | 'highlight';
  player?: string;
  description: string;
  quarter: number;
}

const mockFilms: GameFilm[] = [
  {
    id: '1',
    title: 'vs Eagles - Championship Game',
    gameDate: '2024-03-22',
    opponent: 'Central Eagles',
    gameType: 'Playoff',
    duration: 3600, // 60 minutes
    uploadDate: '2024-03-23',
    uploadedBy: 'Coach Johnson',
    fileSize: '2.4 GB',
    resolution: '1080p',
    format: 'MP4',
    thumbnail: '/api/placeholder/320/180',
    description:
      'Championship game footage with complete game coverage. Excellent defensive play in 2nd half.',
    tags: ['championship', 'defense', 'playoff'],
    events: [
      {
        id: 'e1',
        timestamp: 300,
        type: 'goal',
        player: 'Jake Smith',
        description: 'First goal of the game',
        quarter: 1,
      },
      {
        id: 'e2',
        timestamp: 850,
        type: 'save',
        player: 'Mike Wilson',
        description: 'Outstanding save',
        quarter: 1,
      },
      {
        id: 'e3',
        timestamp: 1200,
        type: 'penalty',
        player: 'Tom Davis',
        description: 'Slashing penalty',
        quarter: 2,
      },
    ],
    views: 87,
    isAnalyzed: true,
  },
  {
    id: '2',
    title: 'vs Wildcats - Regular Season',
    gameDate: '2024-03-15',
    opponent: 'North Wildcats',
    gameType: 'Regular Season',
    duration: 3480,
    uploadDate: '2024-03-16',
    uploadedBy: 'Assistant Coach Brown',
    fileSize: '1.9 GB',
    resolution: '720p',
    format: 'MP4',
    thumbnail: '/api/placeholder/320/180',
    description:
      'Strong offensive performance. Multiple fast break opportunities.',
    tags: ['offense', 'fast-break', 'regular-season'],
    events: [
      {
        id: 'e4',
        timestamp: 420,
        type: 'goal',
        player: 'Alex Johnson',
        description: 'Fast break goal',
        quarter: 1,
      },
      {
        id: 'e5',
        timestamp: 1800,
        type: 'assist',
        player: 'Ryan Lee',
        description: 'Behind-the-back assist',
        quarter: 2,
      },
    ],
    views: 52,
    isAnalyzed: true,
  },
  {
    id: '3',
    title: 'Practice Scrimmage - Red vs Blue',
    gameDate: '2024-03-10',
    opponent: 'Internal Scrimmage',
    gameType: 'Practice',
    duration: 2700,
    uploadDate: '2024-03-10',
    uploadedBy: 'Coach Johnson',
    fileSize: '1.2 GB',
    resolution: '1080p',
    format: 'MP4',
    thumbnail: '/api/placeholder/320/180',
    description: 'Internal scrimmage focusing on new offensive sets.',
    tags: ['scrimmage', 'practice', 'offense-sets'],
    events: [],
    views: 23,
    isAnalyzed: false,
  },
  {
    id: '4',
    title: 'vs Thunder - Overtime Thriller',
    gameDate: '2024-03-08',
    opponent: 'Western Thunder',
    gameType: 'Regular Season',
    duration: 4200,
    uploadDate: '2024-03-09',
    uploadedBy: 'Manager Steve',
    fileSize: '3.1 GB',
    resolution: '1080p',
    format: 'MP4',
    thumbnail: '/api/placeholder/320/180',
    description:
      'Intense overtime game with clutch performances. Great learning material.',
    tags: ['overtime', 'clutch', 'high-pressure'],
    events: [
      {
        id: 'e6',
        timestamp: 3900,
        type: 'goal',
        player: 'Marcus Williams',
        description: 'Overtime winner',
        quarter: 5,
      },
      {
        id: 'e7',
        timestamp: 3600,
        type: 'timeout',
        description: 'Crucial timeout before OT',
        quarter: 4,
      },
    ],
    views: 104,
    isAnalyzed: true,
  },
  {
    id: '5',
    title: 'vs Lions - Season Opener',
    gameDate: '2024-02-28',
    opponent: 'Metro Lions',
    gameType: 'Regular Season',
    duration: 3300,
    uploadDate: '2024-03-01',
    uploadedBy: 'Coach Johnson',
    fileSize: '2.0 GB',
    resolution: '720p',
    format: 'MP4',
    thumbnail: '/api/placeholder/320/180',
    description:
      'First game of the season. Good baseline for player development tracking.',
    tags: ['season-opener', 'baseline', 'development'],
    events: [
      {
        id: 'e8',
        timestamp: 600,
        type: 'goal',
        player: 'David Chen',
        description: 'First goal of season',
        quarter: 1,
      },
    ],
    views: 67,
    isAnalyzed: true,
  },
];

const gameTypes = [
  'All Types',
  'Regular Season',
  'Playoff',
  'Scrimmage',
  'Practice',
];
const sortOptions = [
  'Recent Upload',
  'Game Date',
  'Most Viewed',
  'Title A-Z',
  'Duration',
];

function FilmLibraryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGameType, setSelectedGameType] = useState('All Types');
  const [sortBy, setSortBy] = useState('Recent Upload');
  const [showAnalyzedOnly, setShowAnalyzedOnly] = useState(false);

  const filteredFilms = mockFilms
    .filter((film) => {
      const matchesSearch =
        film.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        film.opponent.toLowerCase().includes(searchQuery.toLowerCase()) ||
        film.tags.some((tag) =>
          tag.toLowerCase().includes(searchQuery.toLowerCase()),
        );
      const matchesType =
        selectedGameType === 'All Types' || film.gameType === selectedGameType;
      const matchesAnalyzed = !showAnalyzedOnly || film.isAnalyzed;

      return matchesSearch && matchesType && matchesAnalyzed;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'Recent Upload':
          return (
            new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
          );
        case 'Game Date':
          return (
            new Date(b.gameDate).getTime() - new Date(a.gameDate).getTime()
          );
        case 'Most Viewed':
          return b.views - a.views;
        case 'Title A-Z':
          return a.title.localeCompare(b.title);
        case 'Duration':
          return b.duration - a.duration;
        default:
          return 0;
      }
    });

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getGameTypeColor = (type: string) => {
    switch (type) {
      case 'Playoff':
        return 'bg-red-100 text-red-800';
      case 'Regular Season':
        return 'bg-blue-100 text-blue-800';
      case 'Scrimmage':
        return 'bg-green-100 text-green-800';
      case 'Practice':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const totalDuration = mockFilms.reduce((sum, film) => sum + film.duration, 0);
  const analyzedCount = mockFilms.filter((film) => film.isAnalyzed).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Game Film Library</h1>
          <p className="text-muted-foreground">
            Manage and analyze game footage with timestamped events
          </p>
        </div>
        <Button>
          <Upload className="mr-2 h-4 w-4" />
          Upload Film
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Films</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockFilms.length}</div>
            <p className="text-xs text-muted-foreground">
              {formatDuration(totalDuration)} total
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Analyzed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyzedCount}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((analyzedCount / mockFilms.length) * 100)}% complete
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockFilms.reduce((sum, film) => sum + film.views, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Across all films</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">10.6 GB</div>
            <p className="text-xs text-muted-foreground">~2.1 GB average</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search films, opponents, tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <select
            value={selectedGameType}
            onChange={(e) => setSelectedGameType(e.target.value)}
            className="px-3 py-2 border border-input bg-background rounded-md text-sm w-40"
          >
            {gameTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showAnalyzedOnly}
              onChange={(e) => setShowAnalyzedOnly(e.target.checked)}
              className="rounded"
            />
            Analyzed only
          </label>
        </div>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-3 py-2 border border-input bg-background rounded-md text-sm w-40"
        >
          {sortOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredFilms.map((film) => (
          <Card
            key={film.id}
            className="overflow-hidden hover:shadow-lg transition-shadow"
          >
            <div className="relative">
              <div className="aspect-video bg-muted flex items-center justify-center">
                <FileVideo className="h-12 w-12 text-muted-foreground" />
              </div>
              <div className="absolute top-2 left-2">
                <Badge className={getGameTypeColor(film.gameType)}>
                  {film.gameType}
                </Badge>
              </div>
              <div className="absolute top-2 right-2">
                {film.isAnalyzed && (
                  <Badge variant="secondary" className="text-xs">
                    Analyzed
                  </Badge>
                )}
              </div>
              <div className="absolute bottom-2 right-2">
                <Badge
                  variant="outline"
                  className="text-xs bg-black/50 text-white border-white/20"
                >
                  {formatDuration(film.duration)}
                </Badge>
              </div>
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                <Button size="sm" variant="secondary">
                  <Play className="mr-2 h-4 w-4" />
                  Watch
                </Button>
              </div>
            </div>

            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg leading-tight">
                    {film.title}
                  </CardTitle>
                  <CardDescription className="text-sm">
                    {formatDate(film.gameDate)} • vs {film.opponent}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground line-clamp-2">
                {film.description}
              </p>

              <div className="flex flex-wrap gap-1">
                {film.tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {film.tags.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{film.tags.length - 3}
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  <span>{film.views} views</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>{formatDate(film.uploadDate)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  <span>{film.uploadedBy}</span>
                </div>
                <div className="flex items-center gap-1">
                  <FileVideo className="h-3 w-3" />
                  <span>{film.fileSize}</span>
                </div>
              </div>

              {film.events.length > 0 && (
                <div className="pt-2 border-t">
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    {film.events.length} events tagged
                  </p>
                  <div className="flex gap-1">
                    {film.events.slice(0, 3).map((event) => (
                      <Badge
                        key={event.id}
                        variant="outline"
                        className="text-xs"
                      >
                        {event.type}
                      </Badge>
                    ))}
                    {film.events.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{film.events.length - 3}
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button size="sm" className="flex-1">
                  <PlayCircle className="mr-2 h-4 w-4" />
                  Watch
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredFilms.length === 0 && (
        <div className="text-center py-12">
          <div className="mx-auto h-24 w-24 bg-muted rounded-full flex items-center justify-center mb-4">
            <FileVideo className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No films found</h3>
          <p className="text-muted-foreground mb-4">
            Try adjusting your search criteria or upload new game footage.
          </p>
          <Button>
            <Upload className="mr-2 h-4 w-4" />
            Upload Film
          </Button>
        </div>
      )}
    </div>
  );
}
