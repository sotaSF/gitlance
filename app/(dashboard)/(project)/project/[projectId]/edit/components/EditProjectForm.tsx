"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Save,
  Upload,
  X,
  FileIcon,
  Plus,
  Sparkles,
  Package,
  DollarSign,
  GripVertical,
  Shield,
  Clock,
  Gauge,
  TrendingUp,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { updateProject } from "../../../new-project/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ModuleAIChat } from "./ModuleAIChat";
import {
  ModuleEditDrawer,
  type Module,
} from "../../../new-project/components/ModuleEditDrawer";
import NumberFlow from "@number-flow/react";
import { motion, AnimatePresence } from "motion/react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface EditProjectFormProps {
  project: any;
  modules: any[];
}

// Module Card Component for editing
function EditModuleCard({
  module,
  onUpdate,
  onRemove,
}: {
  module: Module;
  onUpdate: (updates: Partial<Module>) => void;
  onRemove: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: module.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleSave = (updatedModule: Module) => {
    onUpdate(updatedModule);
  };

  const complexityColors = [
    "bg-emerald-500",
    "bg-emerald-500",
    "bg-yellow-500",
    "bg-orange-500",
    "bg-red-500",
  ];

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: isDragging ? 0.5 : 1, y: 0 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      <ModuleEditDrawer module={module} onSave={handleSave} onDelete={onRemove}>
        <div
          className={`group relative bg-card border rounded-2xl p-4 cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-emerald-500/50 ${
            module.is_mandatory
              ? "border-emerald-500/30 bg-emerald-500/5"
              : "hover:bg-muted/30"
          } ${isDragging ? "shadow-2xl ring-2 ring-emerald-500" : ""}`}
        >
          {/* Drag Handle */}
          <div
            {...attributes}
            {...listeners}
            className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>

          <div className="pl-6 space-y-3">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-foreground truncate">
                    {module.name}
                  </h3>
                  {module.is_mandatory && (
                    <Badge
                      variant="secondary"
                      className="text-[10px] h-5 shrink-0 bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                    >
                      <Shield className="h-3 w-3 mr-1" />
                      Core
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                  {module.description}
                </p>
              </div>

              {/* Cost Badge */}
              <div className="shrink-0 text-right">
                <div className="flex items-center gap-1 text-emerald-600">
                  <DollarSign className="h-4 w-4" />
                  <span className="text-xl font-bold">
                    <NumberFlow
                      value={module.owner_final_cost}
                      format={{ maximumFractionDigits: 0 }}
                    />
                  </span>
                </div>
                {module.owner_final_cost !== module.estimated_cost && (
                  <span className="text-xs text-muted-foreground line-through">
                    ${module.estimated_cost}
                  </span>
                )}
              </div>
            </div>

            {/* Stats Row */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Gauge className="h-3.5 w-3.5" />
                <span>Complexity</span>
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className={`h-1.5 w-2 rounded-full transition-colors ${
                        i < module.complexity
                          ? complexityColors[module.complexity - 1]
                          : "bg-muted-foreground/20"
                      }`}
                    />
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                <span>
                  ~
                  {module.estimated_hours ||
                    Math.ceil(module.owner_final_cost / 40)}
                  h
                </span>
              </div>
            </div>
          </div>

          {/* Click indicator */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
              Click to edit
            </div>
          </div>
        </div>
      </ModuleEditDrawer>
    </motion.div>
  );
}

// Cost Summary Component
function CostSummary({ modules }: { modules: Module[] }) {
  const totalCost = modules.reduce(
    (sum, m) => sum + (m.owner_final_cost || m.estimated_cost || 0),
    0
  );
  const coreModulesCost = modules
    .filter((m) => m.is_mandatory)
    .reduce((sum, m) => sum + (m.owner_final_cost || m.estimated_cost || 0), 0);

  return (
    <div className="bg-gradient-to-br from-emerald-500/10 via-emerald-600/5 to-transparent rounded-2xl p-5 border border-emerald-500/20">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-emerald-600" />
          <span className="font-semibold text-foreground">Cost Summary</span>
        </div>
        <Badge variant="outline" className="text-xs">
          {modules.length} modules
        </Badge>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Core Modules</span>
          <span className="font-medium">
            ${coreModulesCost.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Optional Modules
          </span>
          <span className="font-medium">
            ${(totalCost - coreModulesCost).toLocaleString()}
          </span>
        </div>
        <div className="h-px bg-border" />
        <div className="flex items-center justify-between">
          <span className="font-semibold">Total Budget</span>
          <span className="text-xl font-bold text-emerald-600">
            $
            <NumberFlow
              value={totalCost}
              format={{ maximumFractionDigits: 0 }}
            />
          </span>
        </div>
      </div>
    </div>
  );
}

export function EditProjectForm({
  project,
  modules: initialModules,
}: EditProjectFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(project.title);
  const [shortDescription, setShortDescription] = useState(
    project.short_description || ""
  );
  const [userStory, setUserStory] = useState(project.user_story);
  const [budget, setBudget] = useState(
    project.owner_estimated_budget?.toString() || ""
  );
  const [tags, setTags] = useState<string>(project.tags?.join(", ") || "");
  const [deadline, setDeadline] = useState<string>(
    project.deadline
      ? new Date(project.deadline).toISOString().split("T")[0]
      : ""
  );
  const [requiredSkills, setRequiredSkills] = useState<string>(
    project.required_skills?.join(", ") || ""
  );
  const [attachments, setAttachments] = useState<any[]>(
    project.attachments || []
  );
  const [modules, setModules] = useState<Module[]>(() =>
    (initialModules || []).map((m: any, i: number) => ({
      id: m.id || `module-${Date.now()}-${i}`,
      name: m.name || "",
      description: m.description || "",
      estimated_cost: m.ai_estimated_cost || m.estimated_cost || 0,
      owner_final_cost:
        m.owner_final_cost || m.ai_estimated_cost || m.estimated_cost || 0,
      confidence: m.ai_confidence || m.confidence || 0.8,
      complexity: m.complexity || 3,
      is_mandatory: m.is_mandatory ?? true,
      min_cost:
        m.min_cost ||
        Math.floor((m.ai_estimated_cost || m.estimated_cost || 100) * 0.5),
      max_cost:
        m.max_cost ||
        Math.ceil((m.ai_estimated_cost || m.estimated_cost || 100) * 2),
      estimated_hours:
        m.estimated_hours ||
        Math.ceil((m.owner_final_cost || m.ai_estimated_cost || 100) / 40),
    }))
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);

  const supabase = createClient();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const newAttachments = [...attachments];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileName = `${Date.now()}-${file.name}`;
      const { data, error } = await supabase.storage
        .from("project-description")
        .upload(fileName, file);

      if (error) {
        console.error("Upload error:", error);
        toast.error(`Failed to upload ${file.name}`);
      } else {
        const { data: publicUrlData } = supabase.storage
          .from("project-description")
          .getPublicUrl(data.path);

        newAttachments.push({
          name: file.name,
          path: data.path,
          url: publicUrlData.publicUrl,
          type: file.type,
          size: file.size,
        });
      }
    }

    setAttachments(newAttachments);
    setIsUploading(false);
  };

  const removeAttachment = (index: number) => {
    const newAttachments = [...attachments];
    newAttachments.splice(index, 1);
    setAttachments(newAttachments);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = modules.findIndex((item) => item.id === active.id);
      const newIndex = modules.findIndex((item) => item.id === over.id);
      const newModules = arrayMove(modules, oldIndex, newIndex);
      setModules(newModules);
    }
  };

  const handleUpdateModule = useCallback(
    (id: string, updates: Partial<Module>) => {
      setModules((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
      );
    },
    []
  );

  const handleRemoveModule = useCallback((id: string) => {
    setModules((prev) => prev.filter((item) => item.id !== id));
    toast.success("Module removed");
  }, []);

  const handleAddModule = () => {
    const newModule: Module = {
      id: `module-${Date.now()}`,
      name: "New Module",
      description: "Describe what needs to be built in this module...",
      estimated_cost: 150,
      owner_final_cost: 150,
      confidence: 0.8,
      complexity: 2,
      is_mandatory: false,
      min_cost: 50,
      max_cost: 500,
      estimated_hours: 4,
    };

    setModules((prev) => [...prev, newModule]);
    toast.success("New module added - click to customize");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const tagsArray = tags
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t);
    const skillsArray = requiredSkills
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s);

    try {
      const result = await updateProject(project.id, {
        title,
        user_story: userStory,
        owner_estimated_budget: budget ? parseFloat(budget) : null,
        short_description: shortDescription,
        tags: tagsArray,
        deadline: deadline ? new Date(deadline) : null,
        required_skills: skillsArray,
        attachments,
        modules: modules.map((m) => ({
          id: m.id,
          name: m.name,
          description: m.description,
          ai_estimated_cost: m.estimated_cost,
          owner_final_cost: m.owner_final_cost,
          ai_confidence: m.confidence,
          complexity: m.complexity,
          is_mandatory: m.is_mandatory,
        })),
      });

      if (result.success) {
        toast.success("Project updated successfully!");
        router.push(`/project/${project.id}`);
        router.refresh();
      } else {
        toast.error(result.error || "Failed to update project");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid gap-8">
          {/* Core Details */}
          <Card>
            <CardHeader>
              <CardTitle>Core Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Project Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="text-lg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="shortDescription">Short Description</Label>
                <Input
                  id="shortDescription"
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  maxLength={150}
                  placeholder="Brief summary for listings"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="userStory">
                  Project Description / User Story
                </Label>
                <Textarea
                  id="userStory"
                  value={userStory}
                  onChange={(e) => setUserStory(e.target.value)}
                  required
                  className="min-h-[200px] resize-y font-mono text-sm"
                />
              </div>
            </CardContent>
          </Card>

          {/* Requirements & Meta */}
          <Card>
            <CardHeader>
              <CardTitle>Requirements & Meta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="budget">Estimated Budget (USD)</Label>
                  <Input
                    id="budget"
                    type="number"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    min="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deadline">Deadline</Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="tags">Tags (comma separated)</Label>
                  <Input
                    id="tags"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="React, Node.js, etc."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="skills">
                    Required Skills (comma separated)
                  </Label>
                  <Input
                    id="skills"
                    value={requiredSkills}
                    onChange={(e) => setRequiredSkills(e.target.value)}
                    placeholder="TypeScript, AWS, etc."
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Modules */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Project Modules
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-2 text-emerald-600 border-emerald-600/20 hover:bg-emerald-50"
                  onClick={() => setIsAIChatOpen(true)}
                >
                  <Sparkles className="h-4 w-4" />
                  Edit with AI
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={handleAddModule}
                >
                  <Plus className="h-4 w-4" />
                  Add Module
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Cost Summary */}
              <CostSummary modules={modules} />

              {/* Module List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Drag to reorder • Click to edit details
                  </span>
                </div>

                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={modules.map((m) => m.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-3">
                      <AnimatePresence mode="popLayout">
                        {modules.map((module) => (
                          <EditModuleCard
                            key={module.id}
                            module={module}
                            onUpdate={(updates) =>
                              handleUpdateModule(module.id, updates)
                            }
                            onRemove={() => handleRemoveModule(module.id)}
                          />
                        ))}
                      </AnimatePresence>
                    </div>
                  </SortableContext>
                </DndContext>

                {modules.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No modules yet. Add a module to get started.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Attachments */}
          <Card>
            <CardHeader>
              <CardTitle>Attachments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center gap-2 hover:bg-muted/50 transition-colors">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Drag & drop or click to upload files
                  </p>
                  <Input
                    type="file"
                    multiple
                    className="hidden"
                    id="file-upload"
                    onChange={handleFileUpload}
                    disabled={isUploading}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      document.getElementById("file-upload")?.click()
                    }
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    Select Files
                  </Button>
                </div>

                {attachments.length > 0 && (
                  <div className="space-y-2 mt-4">
                    {attachments.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-muted rounded-md"
                      >
                        <div className="flex items-center gap-3">
                          <FileIcon className="h-4 w-4 text-emerald-600" />
                          <span className="text-sm font-medium truncate max-w-[200px]">
                            {file.name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            ({(file.size / 1024).toFixed(1)} KB)
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => removeAttachment(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-4 sticky bottom-4 bg-background/80 backdrop-blur-sm p-4 border rounded-lg shadow-lg z-40">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="bg-emerald-600 text-white hover:bg-emerald-700"
            disabled={isSubmitting || isUploading}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>

      <ModuleAIChat
        modules={modules}
        projectContext={`Title: ${title}\nDescription: ${userStory}`}
        onUpdateModules={setModules}
        isOpen={isAIChatOpen}
        onClose={() => setIsAIChatOpen(false)}
      />
    </>
  );
}
