"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createWorkspace } from "../../../actions";
import type { ModuleAssignmentData, ModuleAssignment } from "../../../actions";
import { Loader2, Users, CheckCircle2, Sparkles, ArrowLeft, Zap, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { ModuleAssignmentStep } from "./ModuleAssignmentStep";
import { PaymentDialog } from "@/components/payments/PaymentDialog";
import { PaymentVerification } from "@/components/payments/PaymentVerification";

interface ProposalUser {
  id: string;
  proposer_id: string;
  proposer: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
    username: string | null;
  };
}

interface CreateWorkspaceFormProps {
  projectId: string;
  acceptedProposals: ProposalUser[];
  moduleAssignmentData: ModuleAssignmentData | null;
}

type WizardStep = "assignment" | "details" | "payment";

// LocalStorage key for persisting form data
const getStorageKey = (projectId: string) => `workspace_form_${projectId}`;

interface PersistedFormData {
  name: string;
  moduleAssignments: ModuleAssignment[];
  currentStep: WizardStep;
  paymentVerified: boolean;
  paymentId: string | null;
}

export function CreateWorkspaceForm({
  projectId,
  acceptedProposals,
  moduleAssignmentData,
}: CreateWorkspaceFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Check if returning from payment
  const isPaymentReturn = searchParams.get("payment_success") === "true" || searchParams.get("payment_canceled") === "true";

  // Determine if we need the assignment step
  const hasModulesToAssign =
    moduleAssignmentData &&
    moduleAssignmentData.proposals.length > 0 &&
    moduleAssignmentData.allModules.length > 0;

  // Initialize state
  const [currentStep, setCurrentStep] = useState<WizardStep>(
    hasModulesToAssign ? "assignment" : "details"
  );
  const [moduleAssignments, setModuleAssignments] = useState<ModuleAssignment[]>([]);
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRestoring, setIsRestoring] = useState(isPaymentReturn);

  // Payment State
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [paymentVerified, setPaymentVerified] = useState(false);
  const [paymentId, setPaymentId] = useState<string | null>(null);

  // Restore form data from localStorage on mount (especially after payment redirect)
  useEffect(() => {
    const storageKey = getStorageKey(projectId);
    const savedData = localStorage.getItem(storageKey);

    if (savedData) {
      try {
        const parsed: PersistedFormData = JSON.parse(savedData);
        setName(parsed.name || "");
        setModuleAssignments(parsed.moduleAssignments || []);
        // If returning from payment, go to details step
        if (isPaymentReturn) {
          setCurrentStep("details");
        } else if (parsed.currentStep) {
          setCurrentStep(parsed.currentStep);
        }
        // Only restore payment state if we have a verified payment
        if (parsed.paymentVerified) {
          setPaymentVerified(parsed.paymentVerified);
          setPaymentId(parsed.paymentId);
        }
      } catch (e) {
        console.error("Error restoring form data:", e);
      }
    }
    setIsRestoring(false);
  }, [projectId, isPaymentReturn]);

  // Save form data to localStorage whenever it changes
  useEffect(() => {
    if (isRestoring) return; // Don't save while restoring

    const storageKey = getStorageKey(projectId);
    const dataToSave: PersistedFormData = {
      name,
      moduleAssignments,
      currentStep,
      paymentVerified,
      paymentId,
    };
    localStorage.setItem(storageKey, JSON.stringify(dataToSave));
  }, [name, moduleAssignments, currentStep, paymentVerified, paymentId, projectId, isRestoring]);

  // Clear localStorage on successful workspace creation
  const clearSavedData = () => {
    localStorage.removeItem(getStorageKey(projectId));
  };

  // Calculate Total Cost
  const totalCost = moduleAssignmentData?.proposals
    .flatMap(p => p.modules)
    .reduce((sum, m) => sum + m.proposedCost, 0) || 0;

  const currentTotalCost = moduleAssignments.length > 0
    ? moduleAssignments.reduce((sum, m) => sum + m.proposedCost, 0)
    : totalCost;

  const handleAssignmentComplete = (assignments: ModuleAssignment[]) => {
    setModuleAssignments(assignments);
    setCurrentStep("details");
  };

  const handleBackToAssignment = () => {
    setCurrentStep("assignment");
  };

  const handlePaymentSuccess = (id: string) => {
    setPaymentVerified(true);
    setPaymentId(id);
    toast.success("Payment verified! You can now create your workspace.");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    // Require payment if there is a cost and it's not verified
    if (currentTotalCost > 0 && !paymentVerified) {
      setIsPaymentOpen(true);
      return;
    }

    setIsLoading(true);
    try {
      const result = await createWorkspace(
        projectId,
        name,
        moduleAssignments.length > 0 ? moduleAssignments : undefined,
        paymentId || undefined
      );
      if (result.success) {
        clearSavedData(); // Clear saved data on success
        toast.success("Workspace created successfully!");
        router.push(`/workspace/${result.workspaceId}`);
      }
    } catch (error) {
      toast.error("Failed to create workspace. Please try again.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Step indicator component
  const StepIndicator = () => {
    const steps = hasModulesToAssign
      ? [
        { id: "assignment", label: "Assign Modules", icon: Users },
        { id: "details", label: "Workspace Details", icon: Sparkles },
        { id: "payment", label: "Payment", icon: CreditCard },
      ]
      : [
        { id: "details", label: "Workspace Details", icon: Sparkles },
        { id: "payment", label: "Payment", icon: CreditCard },
      ];

    const getCurrentStepIndex = () => {
      if (currentStep === "assignment") return 0;
      if (currentStep === "details") return hasModulesToAssign ? 1 : 0;
      return steps.length - 1;
    };

    const stepIndex = getCurrentStepIndex();

    return (
      <div className="flex items-center justify-center mb-6 gap-2">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = index === stepIndex;
          const isCompleted = index < stepIndex || (step.id === "payment" && paymentVerified);

          return (
            <div key={step.id} className="flex items-center">
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${isActive
                  ? "bg-primary text-primary-foreground"
                  : isCompleted
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-muted text-muted-foreground"
                  }`}
              >
                {isCompleted && !isActive ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : (
                  <Icon className="h-3.5 w-3.5" />
                )}
                <span className="hidden sm:inline">{step.label}</span>
              </div>
              {index < steps.length - 1 && (
                <div className={`w-8 h-0.5 mx-1 ${index < stepIndex ? "bg-green-500" : "bg-muted"}`} />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // Loading state while restoring
  if (isRestoring) {
    return (
      <Card className="border bg-card/80 backdrop-blur-sm">
        <CardContent className="py-12 flex flex-col items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Restoring your progress...</p>
        </CardContent>
      </Card>
    );
  }

  // Module Assignment Step
  if (currentStep === "assignment" && moduleAssignmentData) {
    return (
      <>
        <StepIndicator />
        <Card className="border bg-card/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Assign Modules</CardTitle>
            <CardDescription className="text-sm">
              Review and assign modules to your team members. Resolve any conflicts
              before proceeding.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ModuleAssignmentStep
              data={moduleAssignmentData}
              onComplete={handleAssignmentComplete}
              onBack={() => router.back()}
            />
          </CardContent>
        </Card>
      </>
    );
  }

  // Payment Dialog
  const paymentDialog = (
    <PaymentDialog
      open={isPaymentOpen}
      onOpenChange={setIsPaymentOpen}
      projectId={projectId}
      totalAmount={currentTotalCost}
      moduleAssignments={moduleAssignments}
    />
  );

  // Workspace Details Step
  return (
    <>
      <StepIndicator />
      {paymentDialog}
      <Card className="border bg-card/80 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Workspace Details</CardTitle>
          <CardDescription className="text-sm">
            Configure your workspace. A #dev channel will be created
            automatically.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PaymentVerification
            onSuccess={handlePaymentSuccess}
            onCancel={() => { }}
          />

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Workspace Name */}
            <div className="space-y-2">
              <Label
                htmlFor="name"
                className="text-sm font-medium flex items-center gap-2"
              >
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                Workspace Name
              </Label>
              <Input
                id="name"
                placeholder="e.g. Project Alpha Team"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
                required
                className="h-10 border focus-visible:ring-1 focus-visible:ring-primary transition-all"
              />
            </div>

            {/* Team Members */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-3.5 w-3.5 text-primary" />
                  Team Members
                  <span className="ml-1 px-1.5 py-0.5 bg-primary/10 text-primary rounded-full text-xs">
                    {acceptedProposals.length}
                  </span>
                </Label>
                <span className="text-xs text-muted-foreground">Auto-invited</span>
              </div>

              <div className="flex flex-wrap gap-2">
                {acceptedProposals.map((proposal) => (
                  <div
                    key={proposal.id}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={proposal.proposer.avatar_url || ""} />
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                        {proposal.proposer.display_name?.charAt(0).toUpperCase() ||
                          "U"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">
                      {proposal.proposer.display_name || "User"}
                    </span>
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                  </div>
                ))}

                {acceptedProposals.length === 0 && (
                  <div className="w-full py-6 text-center border border-dashed rounded-lg text-muted-foreground">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">No team members yet</p>
                  </div>
                )}
              </div>
            </div>

            {/* Module Assignments Summary */}
            {moduleAssignments.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                    Modules Assigned
                  </Label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium bg-green-100 text-green-700 px-2 py-0.5 rounded-full dark:bg-green-900/30 dark:text-green-400">
                      Total: ${currentTotalCost.toLocaleString()}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {moduleAssignments.length} modules
                    </span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Module assignments have been configured and will be applied when
                  the workspace is created.
                </p>
              </div>
            )}

            {/* Payment Status Banner */}
            {paymentVerified && (
              <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-green-700 dark:text-green-400">Payment Confirmed</p>
                  <p className="text-xs text-green-600 dark:text-green-500">You can now create your workspace.</p>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-2">
              {hasModulesToAssign ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBackToAssignment}
                  disabled={isLoading}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
              ) : (
                <div />
              )}
              <Button
                type="submit"
                className={paymentVerified ? "bg-primary" : "bg-green-600 hover:bg-green-700 text-white"}
                disabled={isLoading || !name.trim()}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : paymentVerified ? (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Create Workspace
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-4 w-4" />
                    Pay & Create Workspace
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
