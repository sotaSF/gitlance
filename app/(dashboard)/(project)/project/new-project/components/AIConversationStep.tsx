"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Loader2,
    ArrowRight,
    ArrowLeft,
    CheckCircle2,
    HelpCircle,
    Sparkles,
} from "lucide-react";
import { ProjectData } from "./ProjectCreationWizard";
import {
    generateMultipleChoiceQuestions,
    MCQQuestion,
    MCQOption,
    ConversationMessage,
} from "../actions";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";

interface AIConversationStepProps {
    data: ProjectData;
    onBack: () => void;
    onComplete: (conversationContext: ConversationMessage[]) => void;
}

// Maps answers back to a ConversationMessage[] the analyzeProjectWithAI action already understands
function answersToConversationContext(
    questions: MCQQuestion[],
    answers: Record<number, string>
): ConversationMessage[] {
    const messages: ConversationMessage[] = [];
    for (const q of questions) {
        const selectedOptionId = answers[q.id];
        const option = q.options.find((o) => o.id === selectedOptionId);
        if (option) {
            messages.push({ role: "assistant", content: q.question });
            messages.push({ role: "user", content: option.label });
        }
    }
    return messages;
}

export function AIConversationStep({
    data,
    onBack,
    onComplete,
}: AIConversationStepProps) {
    const [questions, setQuestions] = useState<MCQQuestion[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<number, string>>({}); // questionId → optionId
    const [isLoading, setIsLoading] = useState(true);
    const [isComplete, setIsComplete] = useState(false);
    const [direction, setDirection] = useState<"forward" | "backward">("forward");

    // Load questions once
    useEffect(() => {
        const load = async () => {
            // If we already have context saved, convert it back and mark complete
            if (data.conversationContext && data.conversationContext.length > 0) {
                setIsComplete(true);
                setIsLoading(false);
                return;
            }

            try {
                const result = await generateMultipleChoiceQuestions({
                    title: data.title,
                    userStory: data.userStory,
                    tags: data.tags,
                    requiredSkills: data.requiredSkills,
                    estimatedBudget: data.estimatedBudget,
                });

                if (result.success && result.questions && result.questions.length > 0) {
                    setQuestions(result.questions);
                } else {
                    toast.error(result.error || "Failed to generate questions");
                }
            } catch {
                toast.error("Failed to load discovery questions");
            } finally {
                setIsLoading(false);
            }
        };

        load();
    }, []);

    const currentQuestion = questions[currentIndex];
    const totalQuestions = questions.length;
    const isLastQuestion = currentIndex === totalQuestions - 1;
    const hasAnsweredCurrent = currentQuestion
        ? answers[currentQuestion.id] !== undefined
        : false;
    const allAnswered =
        questions.length > 0 &&
        questions.every((q) => answers[q.id] !== undefined);

    const handleOptionSelect = (questionId: number, optionId: string) => {
        setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
    };

    const handleNext = () => {
        if (!hasAnsweredCurrent) return;

        if (isLastQuestion) {
            setIsComplete(true);
        } else {
            setDirection("forward");
            setCurrentIndex((i) => i + 1);
        }
    };

    const handlePrev = () => {
        if (currentIndex === 0) {
            onBack();
        } else {
            setDirection("backward");
            setCurrentIndex((i) => i - 1);
        }
    };

    const handleContinue = () => {
        const context = answersToConversationContext(questions, answers);
        onComplete(context);
    };

    // ── Loading screen ──────────────────────────────────────────────────────────
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[500px] space-y-6">
                <div className="relative">
                    <div className="absolute inset-0 bg-emerald-600/20 blur-3xl rounded-full animate-pulse" />
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.5 }}
                        className="relative z-10"
                    >
                        <div className="h-24 w-24 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                            <Sparkles className="h-12 w-12 text-white animate-pulse" />
                        </div>
                    </motion.div>
                </div>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-center space-y-2"
                >
                    <h3 className="text-2xl font-semibold">Preparing your questions…</h3>
                    <p className="text-muted-foreground max-w-md">
                        Our AI is tailoring discovery questions based on your project details.
                    </p>
                </motion.div>
                <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
            </div>
        );
    }

    // ── Complete screen ─────────────────────────────────────────────────────────
    if (isComplete) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[500px] space-y-8">
                <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                    className="relative"
                >
                    <div className="absolute inset-0 bg-emerald-500/20 blur-3xl rounded-full" />
                    <div className="relative h-24 w-24 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
                        <CheckCircle2 className="h-12 w-12 text-white" />
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-center space-y-3 max-w-md"
                >
                    <h3 className="text-2xl font-bold">Discovery Complete!</h3>
                    <p className="text-muted-foreground">
                        Great! We've gathered everything we need. The AI will now generate
                        an accurate module breakdown and cost estimate for your project.
                    </p>
                </motion.div>

                {/* Answers summary */}
                {questions.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.35 }}
                        className="w-full max-w-md space-y-2"
                    >
                        {questions.map((q) => {
                            const selected = q.options.find((o) => o.id === answers[q.id]);
                            return (
                                <div
                                    key={q.id}
                                    className="flex items-center gap-3 bg-muted/50 rounded-lg px-4 py-2 text-sm"
                                >
                                    <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                                    <span className="text-muted-foreground flex-1 truncate">{q.question}</span>
                                    <span className="font-medium text-foreground truncate max-w-[120px]">
                                        {selected?.label ?? "—"}
                                    </span>
                                </div>
                            );
                        })}
                    </motion.div>
                )}

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.45 }}
                    className="flex gap-3"
                >
                    <Button variant="ghost" onClick={onBack} className="gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Back to Input
                    </Button>
                    <Button
                        onClick={handleContinue}
                        className="bg-emerald-600 text-white hover:bg-emerald-700 gap-2"
                        size="lg"
                    >
                        Generate Modules
                        <ArrowRight className="h-4 w-4" />
                    </Button>
                </motion.div>
            </div>
        );
    }

    // ── Question screen ─────────────────────────────────────────────────────────
    return (
        <div className="flex flex-col min-h-[500px]">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b mb-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <HelpCircle className="h-5 w-5 text-emerald-600" />
                        <h2 className="text-xl font-bold tracking-tight">Project Discovery</h2>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Select the best option for each question
                    </p>
                </div>

                {/* Progress badge */}
                <div className="flex items-center gap-2 px-4 py-2 bg-muted rounded-full">
                    <span className="text-sm font-medium">
                        Question {currentIndex + 1} of {totalQuestions}
                    </span>
                </div>
            </div>

            {/* Progress bar */}
            <div className="w-full h-1.5 bg-muted rounded-full mb-8 overflow-hidden">
                <motion.div
                    className="h-full bg-emerald-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{
                        width: `${((currentIndex + (hasAnsweredCurrent ? 1 : 0)) / totalQuestions) * 100}%`,
                    }}
                    transition={{ duration: 0.4, ease: "easeInOut" }}
                />
            </div>

            {/* Question card */}
            <div className="flex-1 flex flex-col">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentIndex}
                        initial={{
                            opacity: 0,
                            x: direction === "forward" ? 40 : -40,
                        }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{
                            opacity: 0,
                            x: direction === "forward" ? -40 : 40,
                        }}
                        transition={{ duration: 0.28, ease: "easeInOut" }}
                        className="flex-1 flex flex-col"
                    >
                        {currentQuestion && (
                            <>
                                {/* Question text */}
                                <h3 className="text-lg font-semibold text-foreground mb-6 leading-snug">
                                    {currentQuestion.question}
                                </h3>

                                {/* Options */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {currentQuestion.options.map((option: MCQOption, idx: number) => {
                                        const isSelected =
                                            answers[currentQuestion.id] === option.id;
                                        return (
                                            <motion.button
                                                key={option.id}
                                                type="button"
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.06 }}
                                                onClick={() =>
                                                    handleOptionSelect(currentQuestion.id, option.id)
                                                }
                                                className={`
                                                    relative flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-left
                                                    transition-all duration-200 cursor-pointer
                                                    ${isSelected
                                                        ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
                                                        : "border-border bg-card hover:border-emerald-300 hover:bg-muted/50"
                                                    }
                                                `}
                                            >
                                                {/* Option letter badge */}
                                                <span
                                                    className={`
                                                        flex-shrink-0 h-7 w-7 rounded-full text-xs font-bold flex items-center justify-center
                                                        ${isSelected
                                                            ? "bg-emerald-500 text-white"
                                                            : "bg-muted text-muted-foreground"
                                                        }
                                                    `}
                                                >
                                                    {option.id.toUpperCase()}
                                                </span>
                                                <span
                                                    className={`text-sm font-medium ${isSelected ? "text-emerald-700 dark:text-emerald-300" : "text-foreground"}`}
                                                >
                                                    {option.label}
                                                </span>
                                                {isSelected && (
                                                    <motion.span
                                                        initial={{ scale: 0 }}
                                                        animate={{ scale: 1 }}
                                                        className="absolute right-3"
                                                    >
                                                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                                    </motion.span>
                                                )}
                                            </motion.button>
                                        );
                                    })}
                                </div>
                            </>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center pt-6 border-t mt-6">
                <Button variant="ghost" onClick={handlePrev} className="gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    {currentIndex === 0 ? "Back to Input" : "Previous"}
                </Button>

                <Button
                    onClick={handleNext}
                    disabled={!hasAnsweredCurrent}
                    className="bg-emerald-600 text-white hover:bg-emerald-700 gap-2 disabled:opacity-40"
                >
                    {isLastQuestion ? "Finish" : "Next"}
                    <ArrowRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
