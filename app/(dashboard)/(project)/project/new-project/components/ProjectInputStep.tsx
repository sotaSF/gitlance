"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Loader2,
  Sparkles,
  Upload,
  X,
  FileIcon,
  AlertCircle,
} from "lucide-react";
import { ProjectData } from "./ProjectCreationWizard";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { extractTextFromUploadedFile } from "../actions";
import {
  isSupportedFileType,
  ALLOWED_EXTENSIONS,
} from "@/lib/utils/text-extraction";

import {
  validateProjectInput,
  hasValidationErrors,
  ValidationErrors,
  isValidProjectTitle,
  isValidShortDescription,
  isValidUserStory,
  isValidBudget,
  ValidationResult,
} from "@/lib/utils/validation";
import { validateProjectScopeWithAI } from "../actions";

interface ProjectInputStepProps {
  onSubmit: (data: Partial<ProjectData>) => void;
  initialData: ProjectData;
}

// Constants for attachment limits
const MAX_ATTACHMENTS = 2;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export function ProjectInputStep({
  onSubmit,
  initialData,
}: ProjectInputStepProps) {
  const [title, setTitle] = useState(initialData.title);
  const [shortDescription, setShortDescription] = useState(
    initialData.shortDescription || ""
  );
  const [userStory, setUserStory] = useState(initialData.userStory);
  const [budget, setBudget] = useState(
    initialData.estimatedBudget?.toString() || ""
  );
  const [tags, setTags] = useState<string>(initialData.tags?.join(", ") || "");
  const [deadline, setDeadline] = useState<string>(
    initialData.deadline
      ? new Date(initialData.deadline).toISOString().split("T")[0]
      : ""
  );

  // Calculate minimum deadline (3 days from today)
  const getMinDeadline = () => {
    const today = new Date();
    today.setDate(today.getDate() + 3);
    return today.toISOString().split("T")[0];
  };
  const [requiredSkills, setRequiredSkills] = useState<string>(
    initialData.requiredSkills?.join(", ") || ""
  );
  const [attachments, setAttachments] = useState<any[]>(
    initialData.attachments || []
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Validation state
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const supabase = createClient();

  // Real-time validation on blur
  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateField(field);
  };

  // Validate individual field
  const validateField = (field: string) => {
    let result: ValidationResult;
    switch (field) {
      case "title":
        result = isValidProjectTitle(title);
        setErrors((prev) => ({
          ...prev,
          title: result.isValid ? undefined : result.error,
        }));
        break;
      case "shortDescription":
        result = isValidShortDescription(shortDescription);
        setErrors((prev) => ({
          ...prev,
          shortDescription: result.isValid ? undefined : result.error,
        }));
        break;
      case "userStory":
        result = isValidUserStory(userStory);
        setErrors((prev) => ({
          ...prev,
          userStory: result.isValid ? undefined : result.error,
        }));
        break;
      case "budget":
        const budgetValue = budget ? parseFloat(budget) : null;
        result = isValidBudget(budgetValue);
        setErrors((prev) => ({
          ...prev,
          budget: result.isValid ? undefined : result.error,
        }));
        break;
      default:
        result = { isValid: true };
    }
  };

  // Validate on value change after field is touched
  useEffect(() => {
    if (touched.title) validateField("title");
  }, [title]);

  useEffect(() => {
    if (touched.shortDescription) validateField("shortDescription");
  }, [shortDescription]);

  useEffect(() => {
    if (touched.userStory) validateField("userStory");
  }, [userStory]);

  useEffect(() => {
    if (touched.budget) validateField("budget");
  }, [budget]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Check if we've reached max attachments
    if (attachments.length >= MAX_ATTACHMENTS) {
      toast.error(`Maximum ${MAX_ATTACHMENTS} attachments allowed`);
      e.target.value = "";
      return;
    }

    // Calculate how many more files can be added
    const remainingSlots = MAX_ATTACHMENTS - attachments.length;
    if (files.length > remainingSlots) {
      toast.error(
        `You can only add ${remainingSlots} more file(s). Maximum ${MAX_ATTACHMENTS} attachments allowed.`
      );
    }

    setIsUploading(true);
    const newAttachments = [...attachments];

    // Only process files up to the remaining slots
    const filesToProcess = Array.from(files).slice(0, remainingSlots);

    for (const file of filesToProcess) {
      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name} exceeds 5MB size limit`);
        continue;
      }

      // Validate file type
      if (!isSupportedFileType(file.type)) {
        toast.error(
          `${file.name}: Unsupported file type. Please upload PDF, DOCX, DOC, TXT, or MD files only.`
        );
        continue;
      }

      try {
        // Upload to Supabase storage first
        const fileName = `${Date.now()}-${file.name}`;
        const { data, error } = await supabase.storage
          .from("project-description")
          .upload(fileName, file);

        if (error) {
          console.error("Upload error:", error);
          toast.error(`Failed to upload ${file.name}`);
          continue;
        }

        // Extract text from file on the server
        let extractedText = "";
        try {
          const fileBuffer = await file.arrayBuffer();
          const extractionResult = await extractTextFromUploadedFile(
            fileBuffer,
            file.type,
            file.name
          );

          if (extractionResult.success && extractionResult.text) {
            extractedText = extractionResult.text;
          } else {
            console.warn(
              `Text extraction failed for ${file.name}: ${extractionResult.error}`
            );
            toast.warning(
              `File uploaded but text extraction failed. You can still use the file link.`
            );
          }
        } catch (extractionError) {
          console.warn(
            `Error extracting text from ${file.name}:`,
            extractionError
          );
          toast.warning(
            `File uploaded but text extraction failed. You can still use the file link.`
          );
        }

        // Get public URL
        const { data: publicUrlData } = supabase.storage
          .from("project-description")
          .getPublicUrl(data.path);

        newAttachments.push({
          name: file.name,
          path: data.path,
          url: publicUrlData.publicUrl,
          type: file.type,
          size: file.size,
          extractedText, // Store extracted text for AI analysis (may be empty if extraction failed)
        });

        toast.success(`${file.name} uploaded successfully`);
      } catch (error) {
        console.error(`Error processing ${file.name}:`, error);
        toast.error(
          `Failed to process ${file.name}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    }

    setAttachments(newAttachments);
    setIsUploading(false);

    // Reset file input
    e.target.value = "";
  };

  const removeAttachment = (index: number) => {
    const newAttachments = [...attachments];
    newAttachments.splice(index, 1);
    setAttachments(newAttachments);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Process tags and skills
    const tagsArray = tags
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t);
    const skillsArray = requiredSkills
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s);

    // Full validation
    const validationErrors = validateProjectInput({
      title,
      shortDescription,
      userStory,
      budget: budget ? parseFloat(budget) : null,
      tags: tagsArray,
      requiredSkills: skillsArray,
      attachments,
    });

    if (hasValidationErrors(validationErrors)) {
      setErrors(validationErrors);
      // Mark all fields as touched to show errors
      setTouched({
        title: true,
        shortDescription: true,
        userStory: true,
        budget: true,
        tags: true,
        requiredSkills: true,
      });
      toast.error("Please fix the validation errors before continuing");
      return;
    }

    setIsSubmitting(true);

    // Validate scope with AI
    try {
      const scopeCheck = await validateProjectScopeWithAI({
        title,
        description: userStory,
        tags: tagsArray,
      });

      if (!scopeCheck.isValid) {
        toast.error(
          scopeCheck.error ||
            "Project does not appear to be a software freelancing request."
        );
        setIsSubmitting(false);
        return;
      }
    } catch (error) {
      console.error("Scope check failed", error);
    }

    setTimeout(() => {
      onSubmit({
        title,
        shortDescription,
        userStory,
        estimatedBudget: budget ? parseFloat(budget) : null,
        tags: tagsArray,
        deadline: deadline ? new Date(deadline) : null,
        requiredSkills: skillsArray,
        attachments,
      });
      setIsSubmitting(false);
    }, 500);
  };

  // Helper to show error styling
  const getInputClassName = (
    field: keyof ValidationErrors,
    baseClass: string = ""
  ) => {
    const hasError = touched[field] && errors[field];
    return `${baseClass} ${
      hasError ? "border-destructive focus-visible:ring-destructive" : ""
    }`;
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">
          Project Details
        </h2>
        <p className="text-muted-foreground">
          Describe your software project. The more details you provide, the
          better the AI analysis will be.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="title">Project Title</Label>
          <Input
            id="title"
            placeholder="e.g., E-commerce Platform for Artisans"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => handleBlur("title")}
            required
            className={getInputClassName("title", "text-lg")}
          />
          {touched.title && errors.title && (
            <p className="text-sm text-destructive flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {errors.title}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="shortDescription">Short Description</Label>
          <Input
            id="shortDescription"
            placeholder="A brief summary of your project (max 150 chars)"
            value={shortDescription}
            onChange={(e) => setShortDescription(e.target.value)}
            onBlur={() => handleBlur("shortDescription")}
            maxLength={150}
            className={getInputClassName("shortDescription")}
          />
          {touched.shortDescription && errors.shortDescription && (
            <p className="text-sm text-destructive flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {errors.shortDescription}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="userStory">Project Description / User Story</Label>
          <Textarea
            id="userStory"
            placeholder="Describe what you want to build, who it's for, and key features. This must be a software/code development project..."
            value={userStory}
            onChange={(e) => setUserStory(e.target.value)}
            onBlur={() => handleBlur("userStory")}
            required
            className={getInputClassName("userStory", "min-h-[200px] resize-y")}
          />
          <div className="flex justify-between">
            {touched.userStory && errors.userStory ? (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.userStory}
              </p>
            ) : (
              <span />
            )}
            <p className="text-xs text-muted-foreground">
              {userStory.length} characters (min 50)
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="budget">
              Estimated Budget (USD){" "}
              <span className="text-muted-foreground font-normal">
                (Optional)
              </span>
            </Label>
            <Input
              id="budget"
              type="number"
              placeholder="e.g., 5000"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              onBlur={() => handleBlur("budget")}
              min="0"
              className={getInputClassName("budget")}
            />
            {touched.budget && errors.budget && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.budget}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="deadline">
              Deadline{" "}
              <span className="text-muted-foreground font-normal">
                (Optional)
              </span>
            </Label>
            <Input
              id="deadline"
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              min={getMinDeadline()}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="tags">Tags (comma separated)</Label>
            <Input
              id="tags"
              placeholder="e.g., React, Node.js, E-commerce"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
            {errors.tags && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.tags}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="skills">Required Skills (comma separated)</Label>
            <Input
              id="skills"
              placeholder="e.g., TypeScript, PostgreSQL, AWS"
              value={requiredSkills}
              onChange={(e) => setRequiredSkills(e.target.value)}
            />
            {errors.requiredSkills && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.requiredSkills}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label>
            Attachments{" "}
            <span className="text-muted-foreground font-normal">
              ({attachments.length}/{MAX_ATTACHMENTS}, max 5MB each)
            </span>
          </Label>
          <div
            className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center gap-2 transition-colors ${
              attachments.length >= MAX_ATTACHMENTS
                ? "bg-muted/30 border-muted cursor-not-allowed"
                : "hover:bg-muted/50"
            }`}
          >
            <Upload
              className={`h-8 w-8 ${
                attachments.length >= MAX_ATTACHMENTS
                  ? "text-muted"
                  : "text-muted-foreground"
              }`}
            />
            <p className="text-sm text-muted-foreground">
              {attachments.length >= MAX_ATTACHMENTS
                ? "Maximum attachments reached"
                : "Drag & drop or click to upload files"}
            </p>
            <p className="text-xs text-muted-foreground">
              Supported: PDF, DOCX, DOC, TXT, MD (max 5MB each)
            </p>
            <Input
              type="file"
              multiple
              accept={ALLOWED_EXTENSIONS}
              className="hidden"
              id="file-upload"
              onChange={handleFileUpload}
              disabled={isUploading || attachments.length >= MAX_ATTACHMENTS}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => document.getElementById("file-upload")?.click()}
              disabled={isUploading || attachments.length >= MAX_ATTACHMENTS}
            >
              {isUploading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {attachments.length >= MAX_ATTACHMENTS
                ? "Limit Reached"
                : "Select Files"}
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
          {errors.attachments && (
            <p className="text-sm text-destructive flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {errors.attachments}
            </p>
          )}
        </div>

        <div className="pt-4 flex justify-end">
          <Button
            type="submit"
            size="lg"
            className="w-full sm:w-auto shadow-sm hover:shadow-md transition-all duration-300 bg-emerald-600 text-white hover:bg-emerald-700"
            disabled={!title || !userStory || isSubmitting || isUploading}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Validating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Continue to AI Q&A
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
