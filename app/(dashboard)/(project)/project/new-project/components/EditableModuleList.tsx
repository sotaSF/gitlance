"use client";

import { useState, useCallback, useEffect } from "react";
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
import { Badge } from "@/components/ui/badge";
import {
  GripVertical,
  Plus,
  DollarSign,
  Clock,
  Shield,
  Gauge,
  TrendingUp,
  Package,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { ModuleEditDrawer, type Module } from "./ModuleEditDrawer";
import NumberFlow from "@number-flow/react";
import { motion, AnimatePresence } from "motion/react";

interface EditableModuleListProps {
  modules: Module[];
  onModulesChange: (modules: Module[]) => void;
  onTotalCostChange: (total: number) => void;
  budgetAnalysis?: {
    is_client_budget_realistic: boolean;
    recommended_minimum: number;
    notes: string;
  };
}

function ModuleCard({
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
              <div className="flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5" />
                <span>{Math.round(module.confidence * 100)}% confidence</span>
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

function AddModuleCard({ onAdd }: { onAdd: () => void }) {
  return (
    <motion.button
      onClick={onAdd}
      className="w-full border-2 border-dashed border-muted-foreground/20 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all duration-200 cursor-pointer group"
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center group-hover:bg-emerald-500/10 transition-colors">
        <Plus className="h-5 w-5 text-muted-foreground group-hover:text-emerald-600 transition-colors" />
      </div>
      <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
        Add Custom Module
      </span>
    </motion.button>
  );
}

function CostSummary({
  modules,
  budgetAnalysis,
}: {
  modules: Module[];
  budgetAnalysis?: EditableModuleListProps["budgetAnalysis"];
}) {
  const totalCost = modules.reduce((sum, m) => sum + m.owner_final_cost, 0);
  const aiSuggested = modules.reduce((sum, m) => sum + m.estimated_cost, 0);
  const difference = totalCost - aiSuggested;
  const coreModulesCost = modules
    .filter((m) => m.is_mandatory)
    .reduce((sum, m) => sum + m.owner_final_cost, 0);

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
          <span className="text-sm text-muted-foreground">AI Suggested</span>
          <span className="text-muted-foreground">
            ${aiSuggested.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-semibold">Your Total</span>
          <div className="flex items-center gap-2">
            {difference !== 0 && (
              <span
                className={`text-xs ${
                  difference > 0 ? "text-orange-500" : "text-emerald-600"
                }`}
              >
                {difference > 0 ? "+" : ""}${difference.toLocaleString()}
              </span>
            )}
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

      {budgetAnalysis && !budgetAnalysis.is_client_budget_realistic && (
        <div className="mt-4 p-3 bg-orange-500/10 border border-orange-500/20 rounded-xl">
          <div className="flex items-start gap-2">
            <Sparkles className="h-4 w-4 text-orange-500 mt-0.5 shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-orange-600">Budget Insight</p>
              <p className="text-muted-foreground mt-0.5">
                {budgetAnalysis.notes}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function EditableModuleList({
  modules: initialModules,
  onModulesChange,
  onTotalCostChange,
  budgetAnalysis,
}: EditableModuleListProps) {
  // Initialize items with IDs - don't call parent callbacks during initialization
  const [items, setItems] = useState<Module[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize modules on mount only
  useEffect(() => {
    if (!isInitialized && initialModules.length > 0) {
      const modulesWithIds = initialModules.map((m, i) => ({
        ...m,
        id: m.id || `module-${Date.now()}-${i}`,
      }));
      setItems(modulesWithIds);
      setIsInitialized(true);
    }
  }, [initialModules, isInitialized]);

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

  const recalculateTotal = useCallback(
    (modules: Module[]) => {
      const total = modules.reduce((sum, m) => sum + m.owner_final_cost, 0);
      onTotalCostChange(total);
    },
    [onTotalCostChange]
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);
      const newItems = arrayMove(items, oldIndex, newIndex);
      setItems(newItems);
      // Use setTimeout to defer the callback to avoid calling during render
      setTimeout(() => {
        onModulesChange(newItems);
      }, 0);
    }
  };

  const handleUpdateModule = (id: string, updates: Partial<Module>) => {
    const newItems = items.map((item) =>
      item.id === id ? { ...item, ...updates } : item
    );
    setItems(newItems);
    // Defer callbacks to avoid render-phase updates
    setTimeout(() => {
      onModulesChange(newItems);
      recalculateTotal(newItems);
    }, 0);
  };

  const handleRemoveModule = (id: string) => {
    const newItems = items.filter((item) => item.id !== id);
    setItems(newItems);
    // Defer callbacks to avoid render-phase updates
    setTimeout(() => {
      onModulesChange(newItems);
      recalculateTotal(newItems);
    }, 0);
    toast.success("Module removed");
  };

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

    const newItems = [...items, newModule];
    setItems(newItems);
    // Defer callbacks to avoid render-phase updates
    setTimeout(() => {
      onModulesChange(newItems);
      recalculateTotal(newItems);
    }, 0);
    toast.success("New module added - click to customize");
  };

  return (
    <div className="space-y-6">
      {/* Cost Summary */}
      <CostSummary modules={items} budgetAnalysis={budgetAnalysis} />

      {/* Module List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Package className="h-4 w-4" />
            Project Modules
          </h3>
          <span className="text-xs text-muted-foreground">
            Drag to reorder • Click to edit
          </span>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={items.map((i) => i.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {items.map((module) => (
                  <ModuleCard
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

        <AddModuleCard onAdd={handleAddModule} />
      </div>
    </div>
  );
}
