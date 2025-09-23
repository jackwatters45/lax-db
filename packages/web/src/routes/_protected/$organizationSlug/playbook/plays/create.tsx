import { createFileRoute, Link, useRouter } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  Plus,
  Save,
  Trash2,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Types for play creation
interface PlayStep {
  id: string;
  stepNumber: number;
  title: string;
  description: string;
  duration: number;
  playerPositions: string[];
  instructions: string;
  keyPoints: string[];
}

interface PlayFormData {
  name: string;
  description: string;
  category: string;
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
  estimatedDuration: number;
  playerPositions: string[];
  tags: string[];
  steps: PlayStep[];
}

// Mock data for dropdowns
const mockFormData = {
  categories: [
    { value: 'offensive', label: 'Offensive', color: '#10b981' },
    { value: 'defensive', label: 'Defensive', color: '#ef4444' },
    {
      value: 'special_situations',
      label: 'Special Situations',
      color: '#f59e0b',
    },
    { value: 'transition', label: 'Transition', color: '#3b82f6' },
    { value: 'set_pieces', label: 'Set Pieces', color: '#8b5cf6' },
  ],
  positions: [
    'Attack',
    'Midfield',
    'Defense',
    'LSM',
    'Goalie',
    'Face-off',
    'Wing',
  ],
  commonTags: [
    'fast-break',
    'scoring',
    'transition',
    'pressure',
    'zone',
    'turnover',
    'man-up',
    'motion',
    'extra-man',
    'clearing',
    'possession',
    'face-off',
    'dodging',
    'individual',
  ],
};

// Server function for creating play
const createPlay = createServerFn({ method: 'POST' })
  .validator((data: PlayFormData) => data)
  .handler(async ({ data }) => {
    // TODO: Replace with actual API call
    // const { PlaybookAPI } = await import('@lax-db/core/playbook/index');
    // const request = getWebRequest();
    // return await PlaybookAPI.createPlay(teamId, data, request.headers);

    console.log('Creating play:', data);
    return { success: true, playId: 'new-play-id' };
  });

// Server function for permissions
const getCreatePermissions = createServerFn().handler(async () => {
  return {
    canCreatePlays: true,
    canEditCategories: true,
  };
});

export const Route = createFileRoute(
  '/_protected/$organizationSlug/playbook/plays/create',
)({
  component: CreatePlay,
  loader: async () => {
    const permissions = await getCreatePermissions();
    return { permissions, formData: mockFormData };
  },
});

function CreatePlay() {
  const { organizationSlug } = Route.useParams();
  const { formData } = Route.useLoaderData();
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState(1);
  const [playData, setPlayData] = useState<PlayFormData>({
    name: '',
    description: '',
    category: '',
    difficultyLevel: 'beginner',
    estimatedDuration: 60,
    playerPositions: [],
    tags: [],
    steps: [],
  });

  const [newTag, setNewTag] = useState('');
  const [isCreatingStep, setIsCreatingStep] = useState(false);
  const [newStep, setNewStep] = useState<Partial<PlayStep>>({
    title: '',
    description: '',
    duration: 30,
    playerPositions: [],
    instructions: '',
    keyPoints: [],
  });
  const [newKeyPoint, setNewKeyPoint] = useState('');

  const totalSteps = 3; // Basic Info, Steps, Review

  const handleBasicInfoChange = (
    field: keyof PlayFormData,
    value: string | number | string[],
  ) => {
    setPlayData((prev) => ({ ...prev, [field]: value }));
  };

  const addTag = () => {
    if (newTag.trim() && !playData.tags.includes(newTag.trim())) {
      setPlayData((prev) => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setPlayData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const addPosition = (position: string) => {
    if (!playData.playerPositions.includes(position)) {
      setPlayData((prev) => ({
        ...prev,
        playerPositions: [...prev.playerPositions, position],
      }));
    }
  };

  const removePosition = (position: string) => {
    setPlayData((prev) => ({
      ...prev,
      playerPositions: prev.playerPositions.filter((p) => p !== position),
    }));
  };

  const addKeyPoint = () => {
    if (newKeyPoint.trim()) {
      setNewStep((prev) => ({
        ...prev,
        keyPoints: [...(prev.keyPoints || []), newKeyPoint.trim()],
      }));
      setNewKeyPoint('');
    }
  };

  const removeKeyPoint = (index: number) => {
    setNewStep((prev) => ({
      ...prev,
      keyPoints: prev.keyPoints?.filter((_, i) => i !== index) || [],
    }));
  };

  const addStepPosition = (position: string) => {
    if (!newStep.playerPositions?.includes(position)) {
      setNewStep((prev) => ({
        ...prev,
        playerPositions: [...(prev.playerPositions || []), position],
      }));
    }
  };

  const removeStepPosition = (position: string) => {
    setNewStep((prev) => ({
      ...prev,
      playerPositions:
        prev.playerPositions?.filter((p) => p !== position) || [],
    }));
  };

  const saveStep = () => {
    if (newStep.title && newStep.description) {
      const step: PlayStep = {
        id: `step-${Date.now()}`,
        stepNumber: playData.steps.length + 1,
        title: newStep.title!,
        description: newStep.description!,
        duration: newStep.duration || 30,
        playerPositions: newStep.playerPositions || [],
        instructions: newStep.instructions || '',
        keyPoints: newStep.keyPoints || [],
      };

      setPlayData((prev) => ({
        ...prev,
        steps: [...prev.steps, step],
      }));

      setNewStep({
        title: '',
        description: '',
        duration: 30,
        playerPositions: [],
        instructions: '',
        keyPoints: [],
      });
      setIsCreatingStep(false);
    }
  };

  const removeStep = (stepId: string) => {
    setPlayData((prev) => ({
      ...prev,
      steps: prev.steps
        .filter((step) => step.id !== stepId)
        .map((step, index) => ({
          ...step,
          stepNumber: index + 1,
        })),
    }));
  };

  const handleSubmit = async () => {
    try {
      const result = await createPlay({ data: playData });
      if (result.success) {
        router.navigate({
          to: '/$organizationSlug/playbook/plays',
          params: { organizationSlug },
          search: {
            search: '',
            category: 'All',
            difficulty: 'All',
            favorites: false,
          },
        });
      }
    } catch (error) {
      console.error('Error creating play:', error);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return playData.name && playData.description && playData.category;
      case 2:
        return playData.steps.length > 0;
      case 3:
        return true;
      default:
        return false;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="playName">Play Name *</Label>
                <Input
                  id="playName"
                  value={playData.name}
                  onChange={(e) =>
                    handleBasicInfoChange('name', e.target.value)
                  }
                  placeholder="Enter play name"
                />
              </div>

              <div>
                <Label htmlFor="playDescription">Description *</Label>
                <textarea
                  id="playDescription"
                  value={playData.description}
                  onChange={(e) =>
                    handleBasicInfoChange('description', e.target.value)
                  }
                  placeholder="Describe the purpose and strategy of this play"
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              <div>
                <Label htmlFor="category">Category *</Label>
                <select
                  id="category"
                  value={playData.category}
                  onChange={(e) =>
                    handleBasicInfoChange('category', e.target.value)
                  }
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Select category</option>
                  {formData.categories.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="difficulty">Difficulty Level</Label>
                <select
                  id="difficulty"
                  value={playData.difficultyLevel}
                  onChange={(e) =>
                    handleBasicInfoChange('difficultyLevel', e.target.value)
                  }
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>

              <div>
                <Label htmlFor="duration">Estimated Duration (seconds)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={playData.estimatedDuration}
                  onChange={(e) =>
                    handleBasicInfoChange(
                      'estimatedDuration',
                      Number(e.target.value),
                    )
                  }
                  min="10"
                  max="300"
                />
              </div>
            </div>

            {/* Player Positions */}
            <div>
              <Label>Player Positions Involved</Label>
              <div className="mt-2 space-y-2">
                <div className="flex flex-wrap gap-2">
                  {formData.positions.map((position) => (
                    <Button
                      key={position}
                      type="button"
                      variant={
                        playData.playerPositions.includes(position)
                          ? 'default'
                          : 'outline'
                      }
                      size="sm"
                      onClick={() =>
                        playData.playerPositions.includes(position)
                          ? removePosition(position)
                          : addPosition(position)
                      }
                    >
                      {position}
                    </Button>
                  ))}
                </div>
                {playData.playerPositions.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {playData.playerPositions.map((position) => (
                      <Badge key={position} variant="secondary">
                        {position}
                        <button
                          type="button"
                          onClick={() => removePosition(position)}
                          className="ml-1 hover:text-red-500"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Tags */}
            <div>
              <Label>Tags</Label>
              <div className="mt-2 space-y-2">
                <div className="flex gap-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add a tag"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                  />
                  <Button type="button" onClick={addTag} size="sm">
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {formData.commonTags.map((tag) => (
                    <Button
                      key={tag}
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        !playData.tags.includes(tag) &&
                        handleBasicInfoChange('tags', [...playData.tags, tag])
                      }
                      className="h-auto p-1 text-xs"
                      disabled={playData.tags.includes(tag)}
                    >
                      {tag}
                    </Button>
                  ))}
                </div>
                {playData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {playData.tags.map((tag) => (
                      <Badge key={tag} variant="outline">
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="ml-1 hover:text-red-500"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">Play Steps</h3>
              <Button
                type="button"
                onClick={() => setIsCreatingStep(true)}
                disabled={isCreatingStep}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Step
              </Button>
            </div>

            {/* Existing Steps */}
            <div className="space-y-4">
              {playData.steps.map((step) => (
                <Card key={step.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">
                        Step {step.stepNumber}: {step.title}
                      </CardTitle>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeStep(step.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-2 text-muted-foreground text-sm">
                      {step.description}
                    </p>
                    <div className="mb-2 text-xs">
                      Duration: {step.duration}s
                    </div>
                    {step.playerPositions.length > 0 && (
                      <div className="mb-2 flex flex-wrap gap-1">
                        {step.playerPositions.map((pos) => (
                          <Badge
                            key={pos}
                            variant="outline"
                            className="text-xs"
                          >
                            {pos}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {step.instructions && (
                      <div className="mb-2">
                        <strong className="text-xs">Instructions:</strong>
                        <p className="text-muted-foreground text-xs">
                          {step.instructions}
                        </p>
                      </div>
                    )}
                    {step.keyPoints.length > 0 && (
                      <div>
                        <strong className="text-xs">Key Points:</strong>
                        <ul className="ml-4 list-disc text-muted-foreground text-xs">
                          {step.keyPoints.map((point) => (
                            <li key={point}>{point}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Add New Step Form */}
            {isCreatingStep && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Add New Step</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="stepTitle">Step Title *</Label>
                    <Input
                      id="stepTitle"
                      value={newStep.title || ''}
                      onChange={(e) =>
                        setNewStep((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                      placeholder="Enter step title"
                    />
                  </div>

                  <div>
                    <Label htmlFor="stepDescription">Description *</Label>
                    <textarea
                      id="stepDescription"
                      value={newStep.description || ''}
                      onChange={(e) =>
                        setNewStep((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      placeholder="Describe what happens in this step"
                      className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <Label htmlFor="stepDuration">Duration (seconds)</Label>
                    <Input
                      id="stepDuration"
                      type="number"
                      value={newStep.duration || 30}
                      onChange={(e) =>
                        setNewStep((prev) => ({
                          ...prev,
                          duration: Number(e.target.value),
                        }))
                      }
                      min="5"
                      max="120"
                    />
                  </div>

                  <div>
                    <Label>Player Positions for This Step</Label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {formData.positions.map((position) => (
                        <Button
                          key={position}
                          type="button"
                          variant={
                            newStep.playerPositions?.includes(position)
                              ? 'default'
                              : 'outline'
                          }
                          size="sm"
                          onClick={() =>
                            newStep.playerPositions?.includes(position)
                              ? removeStepPosition(position)
                              : addStepPosition(position)
                          }
                        >
                          {position}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="stepInstructions">Instructions</Label>
                    <textarea
                      id="stepInstructions"
                      value={newStep.instructions || ''}
                      onChange={(e) =>
                        setNewStep((prev) => ({
                          ...prev,
                          instructions: e.target.value,
                        }))
                      }
                      placeholder="Detailed instructions for executing this step"
                      className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <Label>Key Points</Label>
                    <div className="mt-2 space-y-2">
                      <div className="flex gap-2">
                        <Input
                          value={newKeyPoint}
                          onChange={(e) => setNewKeyPoint(e.target.value)}
                          placeholder="Add a key point"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addKeyPoint();
                            }
                          }}
                        />
                        <Button type="button" onClick={addKeyPoint} size="sm">
                          Add
                        </Button>
                      </div>
                      {newStep.keyPoints && newStep.keyPoints.length > 0 && (
                        <div className="space-y-1">
                          {newStep.keyPoints.map((point, index) => (
                            <div
                              key={point}
                              className="flex items-center justify-between rounded border p-2"
                            >
                              <span className="text-sm">{point}</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeKeyPoint(index)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button type="button" onClick={saveStep}>
                      <Save className="mr-2 h-4 w-4" />
                      Save Step
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsCreatingStep(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {playData.steps.length === 0 && !isCreatingStep && (
              <div className="py-8 text-center text-muted-foreground">
                No steps added yet. Click "Add Step" to create your first play
                step.
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h3 className="font-semibold text-lg">Review Your Play</h3>

            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <strong>Name:</strong> {playData.name}
                </div>
                <div>
                  <strong>Description:</strong> {playData.description}
                </div>
                <div>
                  <strong>Category:</strong>{' '}
                  {
                    formData.categories.find(
                      (c) => c.value === playData.category,
                    )?.label
                  }
                </div>
                <div>
                  <strong>Difficulty:</strong> {playData.difficultyLevel}
                </div>
                <div>
                  <strong>Estimated Duration:</strong>{' '}
                  {playData.estimatedDuration} seconds
                </div>
                {playData.playerPositions.length > 0 && (
                  <div>
                    <strong>Positions:</strong>{' '}
                    {playData.playerPositions.join(', ')}
                  </div>
                )}
                {playData.tags.length > 0 && (
                  <div>
                    <strong>Tags:</strong> {playData.tags.join(', ')}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Play Steps ({playData.steps.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {playData.steps.map((step) => (
                    <div key={step.id} className="rounded border p-3">
                      <div className="font-medium">
                        Step {step.stepNumber}: {step.title}
                      </div>
                      <div className="text-muted-foreground text-sm">
                        {step.description}
                      </div>
                      <div className="mt-1 text-xs">
                        Duration: {step.duration}s
                        {step.playerPositions.length > 0 &&
                          ` • Positions: ${step.playerPositions.join(', ')}`}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto max-w-4xl py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl">Create New Play</h1>
          <p className="text-muted-foreground">
            Build a new play for your team's playbook
          </p>
        </div>

        <Button variant="outline" asChild>
          <Link
            to="/$organizationSlug/playbook/plays"
            params={{ organizationSlug }}
            search={{
              search: '',
              category: 'All',
              difficulty: 'All',
              favorites: false,
            }}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Plays
          </Link>
        </Button>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-center space-x-4">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full ${
                  step === currentStep
                    ? 'bg-primary text-primary-foreground'
                    : step < currentStep
                      ? 'bg-green-500 text-white'
                      : 'bg-muted text-muted-foreground'
                }`}
              >
                {step < currentStep ? <Check className="h-4 w-4" /> : step}
              </div>
              <div className="ml-2 font-medium text-sm">
                {step === 1 ? 'Basic Info' : step === 2 ? 'Steps' : 'Review'}
              </div>
              {step < totalSteps && <div className="mx-4 h-px w-12 bg-muted" />}
            </div>
          ))}
        </div>
      </div>

      {/* Form Content */}
      <Card>
        <CardHeader>
          <CardTitle>
            {currentStep === 1
              ? 'Basic Information'
              : currentStep === 2
                ? 'Play Steps'
                : 'Review'}
          </CardTitle>
        </CardHeader>
        <CardContent>{renderStepContent()}</CardContent>
      </Card>

      {/* Navigation */}
      <div className="mt-8 flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
          disabled={currentStep === 1}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Previous
        </Button>

        <div className="flex gap-2">
          {currentStep < totalSteps ? (
            <Button
              onClick={() => setCurrentStep((prev) => prev + 1)}
              disabled={!canProceed()}
            >
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={!canProceed()}>
              <BookOpen className="mr-2 h-4 w-4" />
              Create Play
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
