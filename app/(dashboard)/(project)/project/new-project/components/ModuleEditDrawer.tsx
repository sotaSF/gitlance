"use client";

import { useState, useEffect, useCallback } from "react";
import {
  FamilyDrawerRoot,
  FamilyDrawerTrigger,
  FamilyDrawerPortal,
  FamilyDrawerOverlay,
  FamilyDrawerContent,
  FamilyDrawerAnimatedWrapper,
  FamilyDrawerAnimatedContent,
  useFamilyDrawer,
} from "@/components/ui/family-drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  DollarSign,
  Clock,
  Gauge,
  Shield,
  Trash2,
  Save,
  ChevronRight,
  AlertTriangle,
  Edit3,
} from "lucide-react";
import NumberFlow from "@number-flow/react";

export interface Module {
  id: string;
  name: string;
  description: string;
  estimated_cost: number;
  owner_final_cost: number;
  confidence: number;
  complexity: number;
  is_mandatory: boolean;
  min_cost: number;
  max_cost: number;
  estimated_hours?: number;
}

interface ModuleEditDrawerProps {
  module: Module;
  onSave: (module: Module) => void;
  onDelete: () => void;
  children: React.ReactNode;
}

// Main View Component
function MainView({
  localModule,
  setLocalModule,
  onSaveAndClose,
}: {
  localModule: Module;
  setLocalModule: (m: Module) => void;
  onSaveAndClose: () => void;
}) {
  const { setView } = useFamilyDrawer();

  // Direct cost input handler
  const handleCostInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0;
    // Clamp to min/max
    const clampedValue = Math.max(
      localModule.min_cost,
      Math.min(localModule.max_cost, value)
    );
    setLocalModule({ ...localModule, owner_final_cost: clampedValue });
  };

  return (
    <div className="space-y-4">
      {/* Handle bar */}
      <div className="flex justify-center">
        <div className="w-12 h-1.5 rounded-full bg-muted-foreground/20" />
      </div>

      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground line-clamp-1">
            {localModule.name}
          </h3>
          {localModule.is_mandatory && (
            <Badge variant="secondary" className="text-xs shrink-0">
              <Shield className="h-3 w-3 mr-1" />
              Core
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {localModule.description}
        </p>
      </div>

      {/* Cost Display */}
      <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 rounded-2xl p-4 border border-emerald-500/20">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-muted-foreground">
            Module Cost
          </span>
          <div className="flex items-center gap-1">
            <DollarSign className="h-5 w-5 text-emerald-600" />
            <Input
              type="number"
              value={localModule.owner_final_cost}
              onChange={handleCostInputChange}
              className="w-24 h-8 text-xl font-bold text-emerald-600 border-0 bg-transparent p-0 text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              min={localModule.min_cost}
              max={localModule.max_cost}
            />
          </div>
        </div>
        <Slider
          value={[localModule.owner_final_cost]}
          min={localModule.min_cost}
          max={localModule.max_cost}
          step={25}
          onValueChange={(vals) =>
            setLocalModule({ ...localModule, owner_final_cost: vals[0] })
          }
          className="py-2 cursor-pointer"
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>${localModule.min_cost}</span>
          <span className="text-emerald-600/70">
            AI Suggested: ${localModule.estimated_cost}
          </span>
          <span>${localModule.max_cost}</span>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setView("details")}
          className="flex items-center justify-between p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Gauge className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Complexity</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className={`h-2 w-1.5 rounded-full ${
                    i < localModule.complexity
                      ? "bg-emerald-600"
                      : "bg-muted-foreground/20"
                  }`}
                />
              ))}
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
        </button>

        <button
          type="button"
          onClick={() => setView("details")}
          className="flex items-center justify-between p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Hours</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-sm font-medium">
              ~
              {localModule.estimated_hours ||
                Math.ceil(localModule.owner_final_cost / 40)}
              h
            </span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
        </button>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          className="h-12 rounded-xl"
          onClick={() => setView("details")}
        >
          <Edit3 className="h-4 w-4 mr-2" />
          Edit Details
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-12 rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={() => setView("delete")}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Remove
        </Button>
      </div>

      {/* Save Button */}
      <Button
        type="button"
        className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700"
        onClick={onSaveAndClose}
      >
        <Save className="h-4 w-4 mr-2" />
        Save & Close
      </Button>
    </div>
  );
}

// Details Edit View
function DetailsView({
  localModule,
  setLocalModule,
}: {
  localModule: Module;
  setLocalModule: (m: Module) => void;
}) {
  const { setView } = useFamilyDrawer();

  return (
    <div className="space-y-4">
      {/* Handle bar */}
      <div className="flex justify-center">
        <div className="w-12 h-1.5 rounded-full bg-muted-foreground/20" />
      </div>

      {/* Header with back */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setView("main")}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Back
        </button>
        <h3 className="text-lg font-semibold">Edit Details</h3>
        <div className="w-10" />
      </div>

      {/* Form */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="module-name">Module Name</Label>
          <Input
            id="module-name"
            value={localModule.name}
            onChange={(e) =>
              setLocalModule({ ...localModule, name: e.target.value })
            }
            placeholder="Enter module name"
            className="rounded-xl"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="module-desc">Description</Label>
          <Textarea
            id="module-desc"
            value={localModule.description}
            onChange={(e) =>
              setLocalModule({ ...localModule, description: e.target.value })
            }
            placeholder="Describe what this module delivers"
            className="rounded-xl min-h-[100px] resize-none"
          />
        </div>

        {/* Cost Range */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="min-cost">Min Cost ($)</Label>
            <Input
              id="min-cost"
              type="number"
              value={localModule.min_cost}
              onChange={(e) =>
                setLocalModule({
                  ...localModule,
                  min_cost: parseInt(e.target.value) || 0,
                })
              }
              className="rounded-xl"
              min={0}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="max-cost">Max Cost ($)</Label>
            <Input
              id="max-cost"
              type="number"
              value={localModule.max_cost}
              onChange={(e) =>
                setLocalModule({
                  ...localModule,
                  max_cost: parseInt(e.target.value) || 0,
                })
              }
              className="rounded-xl"
              min={0}
            />
          </div>
        </div>

        <div className="space-y-3">
          <Label>Complexity Level</Label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((level) => (
              <button
                key={level}
                type="button"
                onClick={() =>
                  setLocalModule({ ...localModule, complexity: level })
                }
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                  localModule.complexity === level
                    ? "bg-emerald-600 text-white"
                    : "bg-muted hover:bg-muted/80 text-muted-foreground"
                }`}
              >
                {level}
              </button>
            ))}
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Simple</span>
            <span>Very Complex</span>
          </div>
        </div>

        <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
          <div className="space-y-0.5">
            <Label className="text-sm">Core Module</Label>
            <p className="text-xs text-muted-foreground">
              Mark as essential for the project
            </p>
          </div>
          <Switch
            checked={localModule.is_mandatory}
            onCheckedChange={(checked) =>
              setLocalModule({ ...localModule, is_mandatory: checked })
            }
          />
        </div>
      </div>

      {/* Save Button */}
      <Button
        type="button"
        className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700"
        onClick={() => setView("main")}
      >
        <Save className="h-4 w-4 mr-2" />
        Done
      </Button>
    </div>
  );
}

// Delete Confirmation View
function DeleteView({
  onDelete,
  moduleName,
}: {
  onDelete: () => void;
  moduleName: string;
}) {
  const { setView } = useFamilyDrawer();

  return (
    <div className="space-y-4">
      {/* Handle bar */}
      <div className="flex justify-center">
        <div className="w-12 h-1.5 rounded-full bg-muted-foreground/20" />
      </div>

      {/* Warning */}
      <div className="flex flex-col items-center text-center space-y-3 py-4">
        <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <AlertTriangle className="h-8 w-8 text-destructive" />
        </div>
        <h3 className="text-lg font-semibold">
          Remove &quot;{moduleName}&quot;?
        </h3>
        <p className="text-sm text-muted-foreground">
          This action will remove the module from your project. The total cost
          will be recalculated.
        </p>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          type="button"
          variant="outline"
          className="h-12 rounded-xl"
          onClick={() => setView("main")}
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="destructive"
          className="h-12 rounded-xl"
          onClick={onDelete}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Remove
        </Button>
      </div>
    </div>
  );
}

// Drawer Content Component
function DrawerContentInner({
  module,
  onSave,
  onDelete,
  onClose,
}: {
  module: Module;
  onSave: (module: Module) => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const [localModule, setLocalModule] = useState<Module>(module);
  const { view } = useFamilyDrawer();

  // Sync local module with prop when module changes
  useEffect(() => {
    setLocalModule(module);
  }, [module]);

  // Save and close handler
  const handleSaveAndClose = useCallback(() => {
    onSave(localModule);
    onClose();
  }, [localModule, onSave, onClose]);

  return (
    <FamilyDrawerAnimatedWrapper>
      <FamilyDrawerAnimatedContent>
        {view === "main" && (
          <MainView
            localModule={localModule}
            setLocalModule={setLocalModule}
            onSaveAndClose={handleSaveAndClose}
          />
        )}
        {view === "details" && (
          <DetailsView
            localModule={localModule}
            setLocalModule={setLocalModule}
          />
        )}
        {view === "delete" && (
          <DeleteView onDelete={onDelete} moduleName={localModule.name} />
        )}
      </FamilyDrawerAnimatedContent>
    </FamilyDrawerAnimatedWrapper>
  );
}

export function ModuleEditDrawer({
  module,
  onSave,
  onDelete,
  children,
}: ModuleEditDrawerProps) {
  const [open, setOpen] = useState(false);

  const handleSave = useCallback(
    (updatedModule: Module) => {
      onSave(updatedModule);
    },
    [onSave]
  );

  const handleDelete = useCallback(() => {
    onDelete();
    setOpen(false);
  }, [onDelete]);

  const handleClose = useCallback(() => {
    setOpen(false);
  }, []);

  return (
    <FamilyDrawerRoot open={open} onOpenChange={setOpen} defaultView="main">
      <FamilyDrawerTrigger asChild>{children}</FamilyDrawerTrigger>
      <FamilyDrawerPortal>
        <FamilyDrawerOverlay />
        <FamilyDrawerContent
          className="max-w-[400px]"
          title={`Edit ${module.name}`}
        >
          <DrawerContentInner
            module={module}
            onSave={handleSave}
            onDelete={handleDelete}
            onClose={handleClose}
          />
        </FamilyDrawerContent>
      </FamilyDrawerPortal>
    </FamilyDrawerRoot>
  );
}
