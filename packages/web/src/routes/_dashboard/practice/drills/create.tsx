import { createFileRoute, Link, useRouter } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { ArrowLeft, Check, Dumbbell, Plus, Save, X } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Types for drill creation
interface DrillFormData {
  name: string;
  description: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number;
  playerCountMin: number;
  playerCountMax: number | null;
  equipment: string[];
  skillsFocus: string[];
  tags: string[];
  instructions: string;
  variations: string[];
  safetyNotes: string;
}

// Mock data for dropdowns
const mockFormData = {
  categories: [
    { value: 'shooting', label: 'Shooting', color: '#ef4444' },
    { value: 'passing', label: 'Passing', color: '#f59e0b' },
    { value: 'defense', label: 'Defense', color: '#3b82f6' },
    { value: 'fundamentals', label: 'Fundamentals', color: '#10b981' },
    { value: 'conditioning', label: 'Conditioning', color: '#8b5cf6' },
    { value: 'goalie', label: 'Goalie', color: '#ec4899' },
    { value: 'faceoffs', label: 'Face-offs', color: '#14b8a6' },
    { value: 'transition', label: 'Transition', color: '#f97316' },
  ],
  commonEquipment: [
    'Balls',
    'Cones',
    'Goals',
    'Pinnies',
    'Agility Ladders',
    'Rebounder',
    'Shooting Targets',
    'Face-off X',
    'Timer',
    'Whistle',
  ],
  commonSkills: [
    'Shooting',
    'Passing',
    'Catching',
    'Ground Balls',
    'Dodging',
    'Defense',
    'Communication',
    'Footwork',
    'Body Position',
    'Vision',
    'Decision Making',
    'Conditioning',
    'Teamwork',
    'Ball Handling',
  ],
  commonTags: [
    'competitive',
    'individual',
    'team',
    'game-situation',
    'pressure',
    'fast-paced',
    'technical',
    'conditioning',
    'beginner-friendly',
    'advanced',
  ],
};

// Server function for creating drill
const createDrill = createServerFn().handler(
  async (drillData: DrillFormData) => {
    // TODO: Replace with actual API call
    // const { DrillAPI } = await import('@lax-db/core/practice/drills');
    // const request = getWebRequest();
    // return await DrillAPI.createDrill(teamId, drillData, request.headers);

    console.log('Creating drill:', drillData);
    return { success: true, drillId: 'new-drill-id' };
  },
);

// Server function for permissions
const getCreatePermissions = createServerFn().handler(async () => {
  return {
    canCreateDrills: true,
    canCreateCategories: true,
  };
});

export const Route = createFileRoute('/_dashboard/practice/drills/create')({
  component: CreateDrill,
  loader: async () => {
    const permissions = await getCreatePermissions();
    return { permissions, formData: mockFormData };
  },
});

function CreateDrill() {
  const { permissions, formData } = Route.useLoaderData();
  const router = useRouter();

  const [drillData, setDrillData] = useState<DrillFormData>({
    name: '',
    description: '',
    category: '',
    difficulty: 'beginner',
    duration: 15,
    playerCountMin: 6,
    playerCountMax: 12,
    equipment: [],
    skillsFocus: [],
    tags: [],
    instructions: '',
    variations: [],
    safetyNotes: '',
  });

  const [newEquipment, setNewEquipment] = useState('');
  const [newSkill, setNewSkill] = useState('');
  const [newTag, setNewTag] = useState('');
  const [newVariation, setNewVariation] = useState('');

  const handleBasicChange = (field: keyof DrillFormData, value: any) => {
    setDrillData((prev) => ({ ...prev, [field]: value }));
  };

  const addEquipment = () => {
    if (
      newEquipment.trim() &&
      !drillData.equipment.includes(newEquipment.trim())
    ) {
      setDrillData((prev) => ({
        ...prev,
        equipment: [...prev.equipment, newEquipment.trim()],
      }));
      setNewEquipment('');
    }
  };

  const removeEquipment = (item: string) => {
    setDrillData((prev) => ({
      ...prev,
      equipment: prev.equipment.filter((e) => e !== item),
    }));
  };

  const addSkill = () => {
    if (newSkill.trim() && !drillData.skillsFocus.includes(newSkill.trim())) {
      setDrillData((prev) => ({
        ...prev,
        skillsFocus: [...prev.skillsFocus, newSkill.trim()],
      }));
      setNewSkill('');
    }
  };

  const removeSkill = (skill: string) => {
    setDrillData((prev) => ({
      ...prev,
      skillsFocus: prev.skillsFocus.filter((s) => s !== skill),
    }));
  };

  const addTag = () => {
    if (newTag.trim() && !drillData.tags.includes(newTag.trim())) {
      setDrillData((prev) => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }));
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    setDrillData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }));
  };

  const addVariation = () => {
    if (newVariation.trim()) {
      setDrillData((prev) => ({
        ...prev,
        variations: [...prev.variations, newVariation.trim()],
      }));
      setNewVariation('');
    }
  };

  const removeVariation = (index: number) => {
    setDrillData((prev) => ({
      ...prev,
      variations: prev.variations.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async () => {
    try {
      const result = await createDrill(drillData);
      if (result.success) {
        router.navigate({ to: '/practice/drills' });
      }
    } catch (error) {
      console.error('Error creating drill:', error);
    }
  };

  const canSubmit = () => {
    return (
      drillData.name &&
      drillData.description &&
      drillData.category &&
      drillData.instructions
    );
  };

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl">Create New Drill</h1>
          <p className="text-muted-foreground">
            Add a new drill to your team's practice library
          </p>
        </div>

        <Button variant="outline" asChild>
          <Link to="/practice/drills">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Drills
          </Link>
        </Button>
      </div>

      <div className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="drillName">Drill Name *</Label>
                <Input
                  id="drillName"
                  value={drillData.name}
                  onChange={(e) => handleBasicChange('name', e.target.value)}
                  placeholder="Enter drill name"
                />
              </div>

              <div>
                <Label htmlFor="category">Category *</Label>
                <select
                  id="category"
                  value={drillData.category}
                  onChange={(e) =>
                    handleBasicChange('category', e.target.value)
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
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <textarea
                id="description"
                value={drillData.description}
                onChange={(e) =>
                  handleBasicChange('description', e.target.value)
                }
                placeholder="Describe the purpose and overview of this drill"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <Label htmlFor="difficulty">Difficulty Level</Label>
                <select
                  id="difficulty"
                  value={drillData.difficulty}
                  onChange={(e) =>
                    handleBasicChange('difficulty', e.target.value)
                  }
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>

              <div>
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={drillData.duration}
                  onChange={(e) =>
                    handleBasicChange('duration', Number(e.target.value))
                  }
                  min="5"
                  max="60"
                />
              </div>

              <div className="space-y-2">
                <Label>Player Count</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={drillData.playerCountMin}
                    onChange={(e) =>
                      handleBasicChange(
                        'playerCountMin',
                        Number(e.target.value),
                      )
                    }
                    placeholder="Min"
                    min="2"
                    max="50"
                  />
                  <Input
                    type="number"
                    value={drillData.playerCountMax || ''}
                    onChange={(e) =>
                      handleBasicChange(
                        'playerCountMax',
                        e.target.value ? Number(e.target.value) : null,
                      )
                    }
                    placeholder="Max (optional)"
                    min={drillData.playerCountMin}
                    max="50"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <Label htmlFor="instructions">Step-by-step Instructions *</Label>
              <textarea
                id="instructions"
                value={drillData.instructions}
                onChange={(e) =>
                  handleBasicChange('instructions', e.target.value)
                }
                placeholder="Provide detailed step-by-step instructions for executing this drill"
                className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </CardContent>
        </Card>

        {/* Equipment */}
        <Card>
          <CardHeader>
            <CardTitle>Required Equipment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={newEquipment}
                onChange={(e) => setNewEquipment(e.target.value)}
                placeholder="Add equipment item"
                onKeyPress={(e) =>
                  e.key === 'Enter' && (e.preventDefault(), addEquipment())
                }
              />
              <Button type="button" onClick={addEquipment} size="sm">
                Add
              </Button>
            </div>

            {/* Common Equipment */}
            <div>
              <Label className="text-sm">Common Equipment:</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {formData.commonEquipment.map((item) => (
                  <Button
                    key={item}
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      !drillData.equipment.includes(item) &&
                      handleBasicChange('equipment', [
                        ...drillData.equipment,
                        item,
                      ])
                    }
                    className="h-auto p-1 text-xs"
                    disabled={drillData.equipment.includes(item)}
                  >
                    {item}
                  </Button>
                ))}
              </div>
            </div>

            {/* Selected Equipment */}
            {drillData.equipment.length > 0 && (
              <div>
                <Label className="text-sm">Selected Equipment:</Label>
                <div className="mt-2 flex flex-wrap gap-1">
                  {drillData.equipment.map((item) => (
                    <Badge key={item} variant="outline">
                      {item}
                      <button
                        type="button"
                        onClick={() => removeEquipment(item)}
                        className="ml-1 hover:text-red-500"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Skills Focus */}
        <Card>
          <CardHeader>
            <CardTitle>Skills Focus</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                placeholder="Add skill focus"
                onKeyPress={(e) =>
                  e.key === 'Enter' && (e.preventDefault(), addSkill())
                }
              />
              <Button type="button" onClick={addSkill} size="sm">
                Add
              </Button>
            </div>

            {/* Common Skills */}
            <div>
              <Label className="text-sm">Common Skills:</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {formData.commonSkills.map((skill) => (
                  <Button
                    key={skill}
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      !drillData.skillsFocus.includes(skill) &&
                      handleBasicChange('skillsFocus', [
                        ...drillData.skillsFocus,
                        skill,
                      ])
                    }
                    className="h-auto p-1 text-xs"
                    disabled={drillData.skillsFocus.includes(skill)}
                  >
                    {skill}
                  </Button>
                ))}
              </div>
            </div>

            {/* Selected Skills */}
            {drillData.skillsFocus.length > 0 && (
              <div>
                <Label className="text-sm">Selected Skills:</Label>
                <div className="mt-2 flex flex-wrap gap-1">
                  {drillData.skillsFocus.map((skill) => (
                    <Badge key={skill} variant="secondary">
                      {skill}
                      <button
                        type="button"
                        onClick={() => removeSkill(skill)}
                        className="ml-1 hover:text-red-500"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tags */}
        <Card>
          <CardHeader>
            <CardTitle>Tags</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add tag"
                onKeyPress={(e) =>
                  e.key === 'Enter' && (e.preventDefault(), addTag())
                }
              />
              <Button type="button" onClick={addTag} size="sm">
                Add
              </Button>
            </div>

            {/* Common Tags */}
            <div>
              <Label className="text-sm">Common Tags:</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {formData.commonTags.map((tag) => (
                  <Button
                    key={tag}
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      !drillData.tags.includes(tag) &&
                      handleBasicChange('tags', [...drillData.tags, tag])
                    }
                    className="h-auto p-1 text-xs"
                    disabled={drillData.tags.includes(tag)}
                  >
                    {tag}
                  </Button>
                ))}
              </div>
            </div>

            {/* Selected Tags */}
            {drillData.tags.length > 0 && (
              <div>
                <Label className="text-sm">Selected Tags:</Label>
                <div className="mt-2 flex flex-wrap gap-1">
                  {drillData.tags.map((tag) => (
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
              </div>
            )}
          </CardContent>
        </Card>

        {/* Variations & Safety */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Variations */}
            <div>
              <Label htmlFor="variations">Drill Variations</Label>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    value={newVariation}
                    onChange={(e) => setNewVariation(e.target.value)}
                    placeholder="Add a drill variation"
                    onKeyPress={(e) =>
                      e.key === 'Enter' && (e.preventDefault(), addVariation())
                    }
                  />
                  <Button type="button" onClick={addVariation} size="sm">
                    Add
                  </Button>
                </div>
                {drillData.variations.length > 0 && (
                  <div className="space-y-1">
                    {drillData.variations.map((variation, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between rounded border p-2"
                      >
                        <span className="text-sm">{variation}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeVariation(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Safety Notes */}
            <div>
              <Label htmlFor="safetyNotes">Safety Notes</Label>
              <textarea
                id="safetyNotes"
                value={drillData.safetyNotes}
                onChange={(e) =>
                  handleBasicChange('safetyNotes', e.target.value)
                }
                placeholder="Any safety considerations or precautions for this drill"
                className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <Button variant="outline" asChild>
            <Link to="/practice/drills">Cancel</Link>
          </Button>

          <Button onClick={handleSubmit} disabled={!canSubmit()}>
            <Save className="mr-2 h-4 w-4" />
            Create Drill
          </Button>
        </div>
      </div>
    </div>
  );
}
