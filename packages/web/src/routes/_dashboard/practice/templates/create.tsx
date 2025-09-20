import { createFileRoute } from '@tanstack/react-router';
import { Badge } from '../../../../components/ui/badge';
import { Button } from '../../../../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../../components/ui/card';
import { Input } from '../../../../components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../../../../components/ui/form';
import {
  ArrowLeft,
  Plus,
  Search,
  Clock,
  Target,
  Users,
  X,
  Check,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

interface TemplateFormData {
  name: string;
  description: string;
  category: string;
  difficulty: string;
  duration: number;
  focus: string[];
  selectedDrills: SelectedDrill[];
  notes: string;
}

interface SelectedDrill {
  id: string;
  name: string;
  category: string;
  duration: number;
  order: number;
}

interface Drill {
  id: string;
  name: string;
  description: string;
  category: string;
  duration: number;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  equipment: string[];
  skills: string[];
  playerCount: { min: number; max: number };
  effectiveness: number;
}

const createTemplate = async (templateData: TemplateFormData) => {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  console.log('Creating template:', templateData);
  return { success: true, templateId: 'new-template-id' };
};

export const Route = createFileRoute('/_dashboard/practice/templates/create')({
  component: CreateTemplatePage,
});

const mockDrills: Drill[] = [
  {
    id: '1',
    name: 'Wall Ball Basics',
    description: 'Fundamental wall ball technique for developing stick skills',
    category: 'Stick Skills',
    duration: 15,
    difficulty: 'Beginner',
    equipment: ['Wall', 'Lacrosse Ball'],
    skills: ['Catching', 'Throwing', 'Hand-Eye Coordination'],
    playerCount: { min: 1, max: 1 },
    effectiveness: 4.8,
  },
  {
    id: '2',
    name: 'Partner Passing',
    description: 'Basic passing and catching with a partner',
    category: 'Passing',
    duration: 20,
    difficulty: 'Beginner',
    equipment: ['Lacrosse Ball'],
    skills: ['Passing', 'Catching', 'Communication'],
    playerCount: { min: 2, max: 2 },
    effectiveness: 4.5,
  },
  {
    id: '3',
    name: 'Ground Ball Pickup',
    description: 'Proper technique for scooping ground balls',
    category: 'Ground Balls',
    duration: 15,
    difficulty: 'Beginner',
    equipment: ['Lacrosse Ball'],
    skills: ['Ground Balls', 'Body Position', 'Stick Position'],
    playerCount: { min: 1, max: 12 },
    effectiveness: 4.6,
  },
  {
    id: '4',
    name: 'Basic Shooting Form',
    description: 'Fundamental shooting technique and accuracy',
    category: 'Shooting',
    duration: 20,
    difficulty: 'Beginner',
    equipment: ['Goal', 'Lacrosse Ball'],
    skills: ['Shooting', 'Accuracy', 'Follow Through'],
    playerCount: { min: 1, max: 6 },
    effectiveness: 4.7,
  },
  {
    id: '5',
    name: '4v3 Fast Break',
    description: 'Fast break execution with numerical advantage',
    category: 'Fast Break',
    duration: 20,
    difficulty: 'Advanced',
    equipment: ['Goals', 'Lacrosse Ball'],
    skills: ['Fast Break', 'Decision Making', 'Ball Movement'],
    playerCount: { min: 7, max: 7 },
    effectiveness: 4.9,
  },
  {
    id: '6',
    name: 'Clear Situations',
    description: 'Clearing the ball from defensive end',
    category: 'Clearing',
    duration: 25,
    difficulty: 'Intermediate',
    equipment: ['Full Field', 'Lacrosse Ball'],
    skills: ['Clearing', 'Ball Security', 'Field Vision'],
    playerCount: { min: 6, max: 12 },
    effectiveness: 4.4,
  },
  {
    id: '7',
    name: '6v6 Settled',
    description: 'Full field settled offense vs defense',
    category: 'Offense',
    duration: 30,
    difficulty: 'Advanced',
    equipment: ['Full Field', 'Goals', 'Lacrosse Ball'],
    skills: ['Offense', 'Defense', 'Ball Movement', 'Communication'],
    playerCount: { min: 12, max: 12 },
    effectiveness: 4.8,
  },
  {
    id: '8',
    name: '1v1 Defense',
    description: 'Individual defensive fundamentals',
    category: 'Defense',
    duration: 15,
    difficulty: 'Intermediate',
    equipment: ['Lacrosse Ball'],
    skills: ['Individual Defense', 'Body Position', 'Stick Checks'],
    playerCount: { min: 2, max: 8 },
    effectiveness: 4.5,
  },
];

const categories = [
  'Skills Development',
  'Game Situations',
  'Defense',
  'Conditioning',
  'Warmup',
  'Offense',
];
const difficulties = ['Beginner', 'Intermediate', 'Advanced'];
const drillCategories = [
  'All Categories',
  'Stick Skills',
  'Passing',
  'Ground Balls',
  'Shooting',
  'Fast Break',
  'Clearing',
  'Offense',
  'Defense',
];
const focusAreas = [
  'Catching',
  'Throwing',
  'Stick Skills',
  'Decision Making',
  'Fast Break',
  '6v6 Situations',
  'Individual Defense',
  'Team Defense',
  'Communication',
  'Endurance',
  'Speed',
  'Agility',
  'Warmup',
  'Dynamic Movement',
  'Skill Activation',
  'Motion Offense',
  'Set Plays',
  'Ball Movement',
];

function CreateTemplatePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDrillCategory, setSelectedDrillCategory] =
    useState('All Categories');
  const [selectedDrills, setSelectedDrills] = useState<SelectedDrill[]>([]);
  const [currentFocus, setCurrentFocus] = useState('');
  const [showDrillSelector, setShowDrillSelector] = useState(false);

  const form = useForm<TemplateFormData>({
    defaultValues: {
      name: '',
      description: '',
      category: 'Skills Development',
      difficulty: 'Beginner',
      duration: 90,
      focus: [],
      selectedDrills: [],
      notes: '',
    },
  });

  const filteredDrills = mockDrills.filter((drill) => {
    const matchesSearch =
      drill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      drill.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedDrillCategory === 'All Categories' ||
      drill.category === selectedDrillCategory;
    const notAlreadySelected = !selectedDrills.some(
      (selected) => selected.id === drill.id,
    );

    return matchesSearch && matchesCategory && notAlreadySelected;
  });

  const addDrill = (drill: Drill) => {
    const selectedDrill: SelectedDrill = {
      id: drill.id,
      name: drill.name,
      category: drill.category,
      duration: drill.duration,
      order: selectedDrills.length,
    };
    setSelectedDrills([...selectedDrills, selectedDrill]);
  };

  const removeDrill = (drillId: string) => {
    setSelectedDrills(selectedDrills.filter((drill) => drill.id !== drillId));
  };

  const moveDrill = (drillId: string, direction: 'up' | 'down') => {
    const currentIndex = selectedDrills.findIndex(
      (drill) => drill.id === drillId,
    );
    if (currentIndex === -1) return;

    const newDrills = [...selectedDrills];
    const targetIndex =
      direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    if (targetIndex >= 0 && targetIndex < newDrills.length) {
      [newDrills[currentIndex], newDrills[targetIndex]] = [
        newDrills[targetIndex],
        newDrills[currentIndex],
      ];
      setSelectedDrills(newDrills);
    }
  };

  const addFocusArea = () => {
    if (currentFocus && !form.getValues('focus').includes(currentFocus)) {
      const currentFocusAreas = form.getValues('focus');
      form.setValue('focus', [...currentFocusAreas, currentFocus]);
      setCurrentFocus('');
    }
  };

  const removeFocusArea = (focusToRemove: string) => {
    const currentFocusAreas = form.getValues('focus');
    form.setValue(
      'focus',
      currentFocusAreas.filter((focus) => focus !== focusToRemove),
    );
  };

  const totalDuration = selectedDrills.reduce(
    (sum, drill) => sum + drill.duration,
    0,
  );

  const onSubmit = async (data: TemplateFormData) => {
    const templateData = {
      ...data,
      selectedDrills,
    };

    try {
      const result = await createTemplate(templateData);
      if (result.success) {
        console.log('Template created successfully');
      }
    } catch (error) {
      console.error('Failed to create template:', error);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner':
        return 'bg-green-100 text-green-800';
      case 'Intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'Advanced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Templates
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Create Practice Template</h1>
          <p className="text-muted-foreground">
            Build a reusable practice plan with drills and timing
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Template Details</CardTitle>
              <CardDescription>
                Basic information about your practice template
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Name</label>
                  <Input
                    placeholder="e.g., Beginner Skills Foundation"
                    {...form.register('name')}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Category</label>
                  <select
                    {...form.register('category')}
                    className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                  >
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <textarea
                  placeholder="Describe the purpose and focus of this template..."
                  rows={3}
                  className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                  {...form.register('description')}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Difficulty Level
                  </label>
                  <select
                    {...form.register('difficulty')}
                    className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                  >
                    {difficulties.map((difficulty) => (
                      <option key={difficulty} value={difficulty}>
                        {difficulty}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Target Duration (minutes)
                  </label>
                  <Input
                    type="number"
                    placeholder="90"
                    {...form.register('duration', { valueAsNumber: true })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Focus Areas</label>
                <div className="flex gap-2 mb-2">
                  <select
                    value={currentFocus}
                    onChange={(e) => setCurrentFocus(e.target.value)}
                    className="flex-1 px-3 py-2 border border-input bg-background rounded-md text-sm"
                  >
                    <option value="">Select focus area...</option>
                    {focusAreas.map((focus) => (
                      <option key={focus} value={focus}>
                        {focus}
                      </option>
                    ))}
                  </select>
                  <Button
                    type="button"
                    onClick={addFocusArea}
                    disabled={!currentFocus}
                    size="sm"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {form.watch('focus').map((focus) => (
                    <Badge key={focus} variant="secondary" className="text-xs">
                      {focus}
                      <button
                        type="button"
                        onClick={() => removeFocusArea(focus)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Practice Drills</span>
                <Badge variant="outline" className="text-sm">
                  {selectedDrills.length} drills, {totalDuration} min
                </Badge>
              </CardTitle>
              <CardDescription>
                Select and organize drills for your practice template
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedDrills.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Target className="mx-auto h-12 w-12 mb-2" />
                  <p>No drills selected yet</p>
                  <p className="text-sm">
                    Use the drill selector below to add drills
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedDrills.map((drill, index) => (
                    <div
                      key={drill.id}
                      className="flex items-center gap-3 p-3 border rounded-lg"
                    >
                      <div className="flex flex-col gap-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => moveDrill(drill.id, 'up')}
                          disabled={index === 0}
                          className="h-6 w-6 p-0"
                        >
                          <ChevronUp className="h-3 w-3" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => moveDrill(drill.id, 'down')}
                          disabled={index === selectedDrills.length - 1}
                          className="h-6 w-6 p-0"
                        >
                          <ChevronDown className="h-3 w-3" />
                        </Button>
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{drill.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {drill.category}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{drill.duration} min</span>
                        </div>
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeDrill(drill.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <div className="border-t pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowDrillSelector(!showDrillSelector)}
                  className="w-full"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {showDrillSelector ? 'Hide' : 'Add'} Drill Selector
                </Button>

                {showDrillSelector && (
                  <div className="mt-4 space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          placeholder="Search drills..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      <select
                        value={selectedDrillCategory}
                        onChange={(e) =>
                          setSelectedDrillCategory(e.target.value)
                        }
                        className="px-3 py-2 border border-input bg-background rounded-md text-sm w-48"
                      >
                        {drillCategories.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid gap-3 max-h-64 overflow-y-auto">
                      {filteredDrills.map((drill) => (
                        <div
                          key={drill.id}
                          className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{drill.name}</span>
                              <Badge variant="outline" className="text-xs">
                                {drill.category}
                              </Badge>
                              <Badge
                                className={`text-xs ${getDifficultyColor(drill.difficulty)}`}
                              >
                                {drill.difficulty}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {drill.description}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                <span>{drill.duration} min</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                <span>
                                  {drill.playerCount.min}-
                                  {drill.playerCount.max} players
                                </span>
                              </div>
                            </div>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => addDrill(drill)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      {filteredDrills.length === 0 && (
                        <p className="text-center text-muted-foreground py-4">
                          No drills found matching your criteria
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Additional Notes</CardTitle>
              <CardDescription>
                Any additional instructions or notes for this template
              </CardDescription>
            </CardHeader>
            <CardContent>
              <textarea
                placeholder="Add any coaching notes, setup instructions, or reminders..."
                rows={4}
                className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                {...form.register('notes')}
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Template Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Drills:</span>
                  <span className="font-medium">{selectedDrills.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Duration:</span>
                  <span className="font-medium">{totalDuration} minutes</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Target Duration:
                  </span>
                  <span className="font-medium">
                    {form.watch('duration')} minutes
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Time Difference:
                  </span>
                  <span
                    className={`font-medium ${Math.abs(totalDuration - form.watch('duration')) > 10 ? 'text-amber-600' : 'text-green-600'}`}
                  >
                    {totalDuration - form.watch('duration') > 0 ? '+' : ''}
                    {totalDuration - form.watch('duration')} min
                  </span>
                </div>
              </div>

              {Math.abs(totalDuration - form.watch('duration')) > 15 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                  <p className="font-medium mb-1">Duration Mismatch</p>
                  <p>
                    Your selected drills duration differs significantly from
                    your target duration.
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <p className="text-sm font-medium">Focus Areas:</p>
                <div className="flex flex-wrap gap-1">
                  {form.watch('focus').map((focus) => (
                    <Badge key={focus} variant="secondary" className="text-xs">
                      {focus}
                    </Badge>
                  ))}
                  {form.watch('focus').length === 0 && (
                    <span className="text-xs text-muted-foreground">
                      None selected
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-2">
            <Button
              type="submit"
              onClick={form.handleSubmit(onSubmit)}
              disabled={selectedDrills.length === 0 || !form.watch('name')}
              className="w-full"
            >
              <Check className="mr-2 h-4 w-4" />
              Create Template
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => console.log('Cancel')}
              className="w-full"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
