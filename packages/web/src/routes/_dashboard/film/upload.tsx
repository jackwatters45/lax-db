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
  Upload,
  File,
  FileVideo,
  X,
  Check,
  AlertCircle,
  Calendar,
  Clock,
  Tag,
  Settings,
  Info,
} from 'lucide-react';
import { useState, useRef } from 'react';

export const Route = createFileRoute('/_dashboard/film/upload')({
  component: FilmUploadPage,
});

interface UploadedFile {
  file: File;
  progress: number;
  status: 'uploading' | 'processing' | 'complete' | 'error';
  id: string;
  preview?: string;
}

interface FilmMetadata {
  title: string;
  gameDate: string;
  opponent: string;
  gameType: 'Regular Season' | 'Playoff' | 'Scrimmage' | 'Practice';
  venue: string;
  description: string;
  tags: string[];
  isHomeGame: boolean;
  quarter1Start?: string;
  quarter2Start?: string;
  quarter3Start?: string;
  quarter4Start?: string;
  isPrivate: boolean;
}

const gameTypes = ['Regular Season', 'Playoff', 'Scrimmage', 'Practice'];

function FilmUploadPage() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [currentStep, setCurrentStep] = useState<
    'upload' | 'metadata' | 'processing'
  >('upload');
  const [metadata, setMetadata] = useState<FilmMetadata>({
    title: '',
    gameDate: '',
    opponent: '',
    gameType: 'Regular Season',
    venue: '',
    description: '',
    tags: [],
    isHomeGame: true,
    isPrivate: false,
  });
  const [currentTag, setCurrentTag] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    Array.from(files).forEach((file) => {
      if (file.type.startsWith('video/')) {
        const newFile: UploadedFile = {
          file,
          progress: 0,
          status: 'uploading',
          id: Math.random().toString(36).substr(2, 9),
        };

        setUploadedFiles((prev) => [...prev, newFile]);
        simulateUpload(newFile.id);
      }
    });
  };

  const simulateUpload = (fileId: string) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.id === fileId ? { ...f, progress: 100, status: 'complete' } : f,
          ),
        );
      } else {
        setUploadedFiles((prev) =>
          prev.map((f) => (f.id === fileId ? { ...f, progress } : f)),
        );
      }
    }, 500);
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const addTag = () => {
    if (currentTag.trim() && !metadata.tags.includes(currentTag.trim())) {
      setMetadata((prev) => ({
        ...prev,
        tags: [...prev.tags, currentTag.trim()],
      }));
      setCurrentTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setMetadata((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const canProceedToMetadata =
    uploadedFiles.length > 0 &&
    uploadedFiles.every((f) => f.status === 'complete');
  const canSubmit = metadata.title && metadata.gameDate && metadata.opponent;

  const handleSubmit = async () => {
    setCurrentStep('processing');
    // Simulate processing
    setTimeout(() => {
      console.log('Film uploaded successfully:', {
        files: uploadedFiles,
        metadata,
      });
      // Navigate back to library
    }, 3000);
  };

  if (currentStep === 'processing') {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" disabled>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Library
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Processing Film</h1>
            <p className="text-muted-foreground">
              Your game film is being processed and will be available shortly
            </p>
          </div>
        </div>

        <Card>
          <CardContent className="p-8">
            <div className="text-center space-y-4">
              <div className="mx-auto h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center">
                <FileVideo className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">
                  Processing Your Film
                </h3>
                <p className="text-muted-foreground mb-4">
                  We're preparing your game film for analysis. This usually
                  takes a few minutes.
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: '65%' }}
                  />
                </div>
                <p className="text-sm text-muted-foreground">65% complete</p>
              </div>
              <div className="text-left max-w-md mx-auto space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>File uploaded successfully</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>Metadata saved</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  <span>Generating thumbnail</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="h-4 w-4 border-2 border-gray-300 rounded-full" />
                  <span>Ready for viewing</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Library
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Upload Game Film</h1>
          <p className="text-muted-foreground">
            Upload and organize your game footage for analysis
          </p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 text-sm">
        <div
          className={`flex items-center gap-2 px-3 py-1 rounded-full ${currentStep === 'upload' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}
        >
          <div
            className={`h-2 w-2 rounded-full ${currentStep === 'upload' ? 'bg-blue-600' : 'bg-green-600'}`}
          />
          Upload Files
        </div>
        <div className="h-px w-8 bg-gray-300" />
        <div
          className={`flex items-center gap-2 px-3 py-1 rounded-full ${currentStep === 'metadata' ? 'bg-blue-100 text-blue-800' : currentStep === 'upload' ? 'bg-gray-100 text-gray-500' : 'bg-green-100 text-green-800'}`}
        >
          <div
            className={`h-2 w-2 rounded-full ${currentStep === 'metadata' ? 'bg-blue-600' : currentStep === 'upload' ? 'bg-gray-400' : 'bg-green-600'}`}
          />
          Add Details
        </div>
        <div className="h-px w-8 bg-gray-300" />
        <div
          className={`flex items-center gap-2 px-3 py-1 rounded-full ${currentStep === 'processing' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-500'}`}
        >
          <div
            className={`h-2 w-2 rounded-full ${currentStep === 'processing' ? 'bg-blue-600' : 'bg-gray-400'}`}
          />
          Processing
        </div>
      </div>

      {currentStep === 'upload' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Upload Video Files</CardTitle>
              <CardDescription>
                Select or drag & drop video files to upload. Supported formats:
                MP4, MOV, AVI
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  isDragging
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="video/*"
                  onChange={(e) => handleFileSelect(e.target.files)}
                  className="hidden"
                />

                <div className="space-y-4">
                  <div className="mx-auto h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center">
                    <Upload className="h-8 w-8 text-gray-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">
                      {isDragging ? 'Drop files here' : 'Upload video files'}
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Drag and drop your video files here, or click to browse
                    </p>
                    <Button onClick={() => fileInputRef.current?.click()}>
                      <Upload className="mr-2 h-4 w-4" />
                      Choose Files
                    </Button>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Maximum file size: 5GB per file
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {uploadedFiles.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Uploaded Files</CardTitle>
                <CardDescription>
                  {uploadedFiles.length} file(s) selected
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {uploadedFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center gap-4 p-3 border rounded-lg"
                  >
                    <div className="flex-shrink-0">
                      <FileVideo className="h-8 w-8 text-blue-500" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium truncate">
                          {file.file.name}
                        </p>
                        <Badge
                          variant={
                            file.status === 'complete'
                              ? 'default'
                              : file.status === 'error'
                                ? 'destructive'
                                : 'secondary'
                          }
                          className="text-xs"
                        >
                          {file.status === 'uploading' && 'Uploading'}
                          {file.status === 'processing' && 'Processing'}
                          {file.status === 'complete' && 'Complete'}
                          {file.status === 'error' && 'Error'}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                        <span>{formatFileSize(file.file.size)}</span>
                        <span>•</span>
                        <span>{file.file.type}</span>
                      </div>

                      {file.status !== 'complete' && (
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div
                            className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                            style={{ width: `${file.progress}%` }}
                          />
                        </div>
                      )}
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(file.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end">
            <Button
              onClick={() => setCurrentStep('metadata')}
              disabled={!canProceedToMetadata}
            >
              Continue to Details
            </Button>
          </div>
        </div>
      )}

      {currentStep === 'metadata' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Game Information</CardTitle>
              <CardDescription>
                Add details about this game to help organize your film library
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Game Title</label>
                  <Input
                    placeholder="e.g., vs Eagles - Championship Game"
                    value={metadata.title}
                    onChange={(e) =>
                      setMetadata((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Game Date</label>
                  <Input
                    type="date"
                    value={metadata.gameDate}
                    onChange={(e) =>
                      setMetadata((prev) => ({
                        ...prev,
                        gameDate: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Opponent</label>
                  <Input
                    placeholder="e.g., Central Eagles"
                    value={metadata.opponent}
                    onChange={(e) =>
                      setMetadata((prev) => ({
                        ...prev,
                        opponent: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Game Type</label>
                  <select
                    value={metadata.gameType}
                    onChange={(e) =>
                      setMetadata((prev) => ({
                        ...prev,
                        gameType: e.target.value as FilmMetadata['gameType'],
                      }))
                    }
                    className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                  >
                    {gameTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Venue</label>
                  <Input
                    placeholder="e.g., Home Field"
                    value={metadata.venue}
                    onChange={(e) =>
                      setMetadata((prev) => ({
                        ...prev,
                        venue: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Home/Away</label>
                  <select
                    value={metadata.isHomeGame ? 'home' : 'away'}
                    onChange={(e) =>
                      setMetadata((prev) => ({
                        ...prev,
                        isHomeGame: e.target.value === 'home',
                      }))
                    }
                    className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                  >
                    <option value="home">Home Game</option>
                    <option value="away">Away Game</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <textarea
                  placeholder="Add any notes about this game..."
                  rows={3}
                  value={metadata.description}
                  onChange={(e) =>
                    setMetadata((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Tags</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add tags..."
                    value={currentTag}
                    onChange={(e) => setCurrentTag(e.target.value)}
                    onKeyPress={(e) =>
                      e.key === 'Enter' && (e.preventDefault(), addTag())
                    }
                    className="flex-1"
                  />
                  <Button onClick={addTag} disabled={!currentTag.trim()}>
                    <Tag className="h-4 w-4" />
                  </Button>
                </div>
                {metadata.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {metadata.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                        <button
                          onClick={() => removeTag(tag)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="private"
                  checked={metadata.isPrivate}
                  onChange={(e) =>
                    setMetadata((prev) => ({
                      ...prev,
                      isPrivate: e.target.checked,
                    }))
                  }
                  className="rounded"
                />
                <label htmlFor="private" className="text-sm">
                  Make this film private (only visible to coaching staff)
                </label>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Advanced Settings
              </CardTitle>
              <CardDescription>
                Optional: Set quarter start times for easier navigation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    1st Quarter Start
                  </label>
                  <Input
                    type="time"
                    value={metadata.quarter1Start || ''}
                    onChange={(e) =>
                      setMetadata((prev) => ({
                        ...prev,
                        quarter1Start: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    2nd Quarter Start
                  </label>
                  <Input
                    type="time"
                    value={metadata.quarter2Start || ''}
                    onChange={(e) =>
                      setMetadata((prev) => ({
                        ...prev,
                        quarter2Start: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    3rd Quarter Start
                  </label>
                  <Input
                    type="time"
                    value={metadata.quarter3Start || ''}
                    onChange={(e) =>
                      setMetadata((prev) => ({
                        ...prev,
                        quarter3Start: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    4th Quarter Start
                  </label>
                  <Input
                    type="time"
                    value={metadata.quarter4Start || ''}
                    onChange={(e) =>
                      setMetadata((prev) => ({
                        ...prev,
                        quarter4Start: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex gap-2">
                  <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">
                      Quarter timestamps help with navigation
                    </p>
                    <p>
                      When viewing the film, users can quickly jump to specific
                      quarters. Leave blank if not applicable.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setCurrentStep('upload')}>
              Back to Upload
            </Button>
            <Button onClick={handleSubmit} disabled={!canSubmit}>
              Upload Film
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
