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
  ArrowLeft,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Maximize,
  Settings,
  Plus,
  Tag,
  Clock,
  Users,
  Target,
  MessageSquare,
  Bookmark,
  Download,
  Share,
  Edit,
  Trash2,
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export const Route = createFileRoute('/_dashboard/film/$filmId')({
  component: FilmViewerPage,
});

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
    | 'highlight'
    | 'note';
  player?: string;
  description: string;
  quarter: number;
  createdBy: string;
  createdAt: string;
  tags: string[];
}

interface FilmData {
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
  videoUrl: string;
  description: string;
  tags: string[];
  events: FilmEvent[];
  views: number;
}

const mockFilm: FilmData = {
  id: '1',
  title: 'vs Eagles - Championship Game',
  gameDate: '2024-03-22',
  opponent: 'Central Eagles',
  gameType: 'Playoff',
  duration: 3600,
  uploadDate: '2024-03-23',
  uploadedBy: 'Coach Johnson',
  fileSize: '2.4 GB',
  resolution: '1080p',
  format: 'MP4',
  videoUrl: '/api/placeholder/video',
  description:
    'Championship game footage with complete game coverage. Excellent defensive play in 2nd half.',
  tags: ['championship', 'defense', 'playoff'],
  views: 87,
  events: [
    {
      id: 'e1',
      timestamp: 300,
      type: 'goal',
      player: 'Jake Smith',
      description: 'First goal of the game - great individual effort',
      quarter: 1,
      createdBy: 'Coach Johnson',
      createdAt: '2024-03-23T10:30:00Z',
      tags: ['individual-effort', 'fast-break'],
    },
    {
      id: 'e2',
      timestamp: 850,
      type: 'save',
      player: 'Mike Wilson',
      description: 'Outstanding save on 1v1 opportunity',
      quarter: 1,
      createdBy: 'Assistant Coach Brown',
      createdAt: '2024-03-23T10:32:00Z',
      tags: ['clutch', 'one-on-one'],
    },
    {
      id: 'e3',
      timestamp: 1200,
      type: 'penalty',
      player: 'Tom Davis',
      description: 'Slashing penalty - unnecessary contact',
      quarter: 2,
      createdBy: 'Coach Johnson',
      createdAt: '2024-03-23T10:35:00Z',
      tags: ['discipline', 'unnecessary'],
    },
    {
      id: 'e4',
      timestamp: 1800,
      type: 'timeout',
      description: 'Strategic timeout before crucial face-off',
      quarter: 2,
      createdBy: 'Coach Johnson',
      createdAt: '2024-03-23T10:40:00Z',
      tags: ['strategy', 'momentum'],
    },
    {
      id: 'e5',
      timestamp: 2400,
      type: 'highlight',
      player: 'Alex Johnson',
      description: 'Amazing behind-the-back assist',
      quarter: 3,
      createdBy: 'Manager Steve',
      createdAt: '2024-03-23T10:45:00Z',
      tags: ['highlight-reel', 'creativity'],
    },
    {
      id: 'e6',
      timestamp: 3000,
      type: 'note',
      description: 'Defense starts to tighten up - notice the communication',
      quarter: 3,
      createdBy: 'Coach Johnson',
      createdAt: '2024-03-23T10:50:00Z',
      tags: ['defense', 'communication'],
    },
    {
      id: 'e7',
      timestamp: 3300,
      type: 'substitution',
      player: 'Ryan Lee',
      description: 'Fresh legs for final push',
      quarter: 4,
      createdBy: 'Assistant Coach Brown',
      createdAt: '2024-03-23T10:55:00Z',
      tags: ['fresh-legs', 'strategy'],
    },
  ],
};

function FilmViewerPage() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showEventForm, setShowEventForm] = useState(false);
  const [selectedEventType, setSelectedEventType] =
    useState<FilmEvent['type']>('note');
  const [eventDescription, setEventDescription] = useState('');
  const [eventPlayer, setEventPlayer] = useState('');
  const [eventTags, setEventTags] = useState('');
  const [hoveredEvent, setHoveredEvent] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  const film = mockFilm;

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getQuarter = (timestamp: number) => {
    const quarterLength = film.duration / 4;
    return Math.ceil(timestamp / quarterLength);
  };

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const seekTo = (timestamp: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = timestamp;
      setCurrentTime(timestamp);
    }
  };

  const skipBackward = () => {
    seekTo(Math.max(0, currentTime - 10));
  };

  const skipForward = () => {
    seekTo(Math.min(film.duration, currentTime + 10));
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const changePlaybackRate = (rate: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
      setPlaybackRate(rate);
    }
  };

  const addEvent = () => {
    if (!eventDescription.trim()) return;

    const newEvent: FilmEvent = {
      id: `e${Date.now()}`,
      timestamp: currentTime,
      type: selectedEventType,
      player: eventPlayer || undefined,
      description: eventDescription,
      quarter: getQuarter(currentTime),
      createdBy: 'Current User',
      createdAt: new Date().toISOString(),
      tags: eventTags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
    };

    console.log('Adding event:', newEvent);

    // Reset form
    setEventDescription('');
    setEventPlayer('');
    setEventTags('');
    setShowEventForm(false);
  };

  const getEventTypeColor = (type: FilmEvent['type']) => {
    switch (type) {
      case 'goal':
        return 'bg-green-100 text-green-800';
      case 'assist':
        return 'bg-blue-100 text-blue-800';
      case 'save':
        return 'bg-orange-100 text-orange-800';
      case 'penalty':
        return 'bg-red-100 text-red-800';
      case 'substitution':
        return 'bg-purple-100 text-purple-800';
      case 'timeout':
        return 'bg-yellow-100 text-yellow-800';
      case 'highlight':
        return 'bg-pink-100 text-pink-800';
      case 'note':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getEventIcon = (type: FilmEvent['type']) => {
    switch (type) {
      case 'goal':
        return <Target className="h-3 w-3" />;
      case 'assist':
        return <Users className="h-3 w-3" />;
      case 'save':
        return <Target className="h-3 w-3" />;
      case 'penalty':
        return <Tag className="h-3 w-3" />;
      case 'substitution':
        return <Users className="h-3 w-3" />;
      case 'timeout':
        return <Clock className="h-3 w-3" />;
      case 'highlight':
        return <Bookmark className="h-3 w-3" />;
      case 'note':
        return <MessageSquare className="h-3 w-3" />;
      default:
        return <MessageSquare className="h-3 w-3" />;
    }
  };

  // Simulate video progress
  useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(() => {
        setCurrentTime((prev) => Math.min(prev + 1, film.duration));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isPlaying, film.duration]);

  const progressPercentage = (currentTime / film.duration) * 100;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Library
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{film.title}</h1>
          <p className="text-muted-foreground">
            {new Date(film.gameDate).toLocaleDateString()} • vs {film.opponent}{' '}
            • {film.gameType}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
          <Button variant="outline" size="sm">
            <Share className="mr-2 h-4 w-4" />
            Share
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        <div className="lg:col-span-3 space-y-4">
          <Card>
            <CardContent className="p-0">
              <div className="relative bg-black aspect-video rounded-t-lg overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center text-white">
                  <div className="text-center">
                    <Play className="mx-auto h-16 w-16 mb-4" />
                    <p className="text-lg">Video Player Placeholder</p>
                    <p className="text-sm opacity-75">
                      Click controls below to simulate playback
                    </p>
                  </div>
                </div>

                {/* Timeline with events */}
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <div className="relative">
                    <div
                      ref={progressRef}
                      className="w-full h-2 bg-black/50 rounded cursor-pointer"
                      onClick={(e) => {
                        if (progressRef.current) {
                          const rect =
                            progressRef.current.getBoundingClientRect();
                          const percent = (e.clientX - rect.left) / rect.width;
                          seekTo(percent * film.duration);
                        }
                      }}
                    >
                      <div
                        className="h-full bg-red-500 rounded"
                        style={{ width: `${progressPercentage}%` }}
                      />

                      {/* Event markers */}
                      {film.events.map((event) => (
                        <div
                          key={event.id}
                          className="absolute top-0 h-full w-1 cursor-pointer transform -translate-x-0.5"
                          style={{
                            left: `${(event.timestamp / film.duration) * 100}%`,
                          }}
                          onMouseEnter={() => setHoveredEvent(event.id)}
                          onMouseLeave={() => setHoveredEvent(null)}
                          onClick={() => seekTo(event.timestamp)}
                        >
                          <div
                            className={`h-full w-1 ${getEventTypeColor(event.type).includes('green') ? 'bg-green-400' : getEventTypeColor(event.type).includes('blue') ? 'bg-blue-400' : getEventTypeColor(event.type).includes('red') ? 'bg-red-400' : getEventTypeColor(event.type).includes('orange') ? 'bg-orange-400' : getEventTypeColor(event.type).includes('purple') ? 'bg-purple-400' : getEventTypeColor(event.type).includes('yellow') ? 'bg-yellow-400' : getEventTypeColor(event.type).includes('pink') ? 'bg-pink-400' : 'bg-gray-400'}`}
                          />

                          {hoveredEvent === event.id && (
                            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/90 text-white text-xs p-2 rounded whitespace-nowrap z-10">
                              <div className="font-medium">
                                {event.type.charAt(0).toUpperCase() +
                                  event.type.slice(1)}
                              </div>
                              <div>{formatTime(event.timestamp)}</div>
                              {event.player && <div>{event.player}</div>}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-black text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={skipBackward}
                      className="text-white hover:bg-white/20"
                    >
                      <SkipBack className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={togglePlayPause}
                      className="text-white hover:bg-white/20"
                    >
                      {isPlaying ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={skipForward}
                      className="text-white hover:bg-white/20"
                    >
                      <SkipForward className="h-4 w-4" />
                    </Button>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={toggleMute}
                        className="text-white hover:bg-white/20"
                      >
                        {isMuted ? (
                          <VolumeX className="h-4 w-4" />
                        ) : (
                          <Volume2 className="h-4 w-4" />
                        )}
                      </Button>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={isMuted ? 0 : volume}
                        onChange={(e) => setVolume(parseFloat(e.target.value))}
                        className="w-20"
                      />
                    </div>

                    <span className="text-sm">
                      {formatTime(currentTime)} / {formatTime(film.duration)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={playbackRate}
                      onChange={(e) =>
                        changePlaybackRate(parseFloat(e.target.value))
                      }
                      className="bg-white/20 text-white text-sm rounded px-2 py-1 border-0"
                    >
                      <option value={0.25}>0.25x</option>
                      <option value={0.5}>0.5x</option>
                      <option value={0.75}>0.75x</option>
                      <option value={1}>1x</option>
                      <option value={1.25}>1.25x</option>
                      <option value={1.5}>1.5x</option>
                      <option value={2}>2x</option>
                    </select>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white hover:bg-white/20"
                    >
                      <Settings className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white hover:bg-white/20"
                    >
                      <Maximize className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Add Event</CardTitle>
                <Button
                  size="sm"
                  onClick={() => setShowEventForm(!showEventForm)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Event
                </Button>
              </div>
            </CardHeader>
            {showEventForm && (
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Event Type</label>
                    <select
                      value={selectedEventType}
                      onChange={(e) =>
                        setSelectedEventType(
                          e.target.value as FilmEvent['type'],
                        )
                      }
                      className="w-full mt-1 px-3 py-2 border border-input bg-background rounded-md text-sm"
                    >
                      <option value="goal">Goal</option>
                      <option value="assist">Assist</option>
                      <option value="save">Save</option>
                      <option value="penalty">Penalty</option>
                      <option value="substitution">Substitution</option>
                      <option value="timeout">Timeout</option>
                      <option value="highlight">Highlight</option>
                      <option value="note">Note</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">
                      Player (Optional)
                    </label>
                    <Input
                      placeholder="Player name"
                      value={eventPlayer}
                      onChange={(e) => setEventPlayer(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Input
                    placeholder="Describe what happened..."
                    value={eventDescription}
                    onChange={(e) => setEventDescription(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">
                    Tags (comma-separated)
                  </label>
                  <Input
                    placeholder="fast-break, clutch, highlight-reel"
                    value={eventTags}
                    onChange={(e) => setEventTags(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={addEvent}
                    disabled={!eventDescription.trim()}
                  >
                    Add Event at {formatTime(currentTime)}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowEventForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Events Timeline
              </CardTitle>
              <CardDescription>
                {film.events.length} events • Click to jump to timestamp
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 max-h-96 overflow-y-auto">
              {film.events
                .sort((a, b) => a.timestamp - b.timestamp)
                .map((event) => (
                  <div
                    key={event.id}
                    className="p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => seekTo(event.timestamp)}
                  >
                    <div className="flex items-start gap-2 mb-2">
                      <Badge
                        className={`text-xs ${getEventTypeColor(event.type)}`}
                      >
                        <span className="flex items-center gap-1">
                          {getEventIcon(event.type)}
                          {event.type}
                        </span>
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        Q{event.quarter}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {formatTime(event.timestamp)}
                      </Badge>
                    </div>

                    <p className="text-sm font-medium mb-1">
                      {event.description}
                    </p>

                    {event.player && (
                      <p className="text-xs text-muted-foreground mb-1">
                        Player: {event.player}
                      </p>
                    )}

                    {event.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {event.tags.map((tag) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="text-xs"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>by {event.createdBy}</span>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-red-500"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}

              {film.events.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="mx-auto h-8 w-8 mb-2" />
                  <p className="text-sm">No events yet</p>
                  <p className="text-xs">
                    Add events to mark important moments
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Film Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Duration:</span>
                  <div className="font-medium">{formatTime(film.duration)}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Resolution:</span>
                  <div className="font-medium">{film.resolution}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">File Size:</span>
                  <div className="font-medium">{film.fileSize}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Views:</span>
                  <div className="font-medium">{film.views}</div>
                </div>
              </div>

              <div>
                <span className="text-muted-foreground text-sm">
                  Uploaded by:
                </span>
                <div className="font-medium">{film.uploadedBy}</div>
                <div className="text-xs text-muted-foreground">
                  {new Date(film.uploadDate).toLocaleDateString()}
                </div>
              </div>

              {film.tags.length > 0 && (
                <div>
                  <span className="text-muted-foreground text-sm">Tags:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {film.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <span className="text-muted-foreground text-sm">
                  Description:
                </span>
                <p className="text-sm mt-1">{film.description}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
