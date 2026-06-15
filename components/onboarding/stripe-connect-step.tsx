"use client";

import { motion } from "motion/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertCircle, CreditCard } from "lucide-react";
import { toast } from "sonner";

interface StripeConnectStepProps {
    isConnected: boolean;
    onSkip?: () => void;
}

export function StripeConnectStep({
    isConnected,
    onSkip,
}: StripeConnectStepProps) {
    const [isLinking, setIsLinking] = useState(false);

    const handleConnectStripe = async () => {
        setIsLinking(true);
        try {
            const res = await fetch("/api/stripe-connect/onboard", {
                method: "POST",
            });
            const result = await res.json();

            if (res.ok && result.url) {
                window.location.href = result.url;
            } else {
                toast.error(result.error || "Failed to start Stripe Connect onboarding");
                setIsLinking(false);
            }
        } catch (error) {
            console.error("Error connecting Stripe:", error);
            toast.error("Something went wrong. Please try again.");
            setIsLinking(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6 py-8"
        >
            <div className="space-y-2 text-center">
                <h2 className="text-3xl font-bold tracking-tight text-[var(--color-brand)]">
                    Set up Payments
                </h2>
                <p className="text-[var(--color-brand-secondary)]">
                    Link your Stripe account to receive payouts for module completion
                </p>
            </div>

            <div className="mx-auto max-w-md space-y-6">
                {isConnected ? (
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="rounded-2xl border-2 border-green-500/20 bg-green-500/5 p-6 text-center"
                    >
                        <CheckCircle2 className="mx-auto h-16 w-16 text-green-600 dark:text-green-400 mb-4" />
                        <h3 className="text-xl font-semibold mb-2">Stripe Connected!</h3>
                        <p className="text-muted-foreground">
                            You are ready to receive payments.
                        </p>
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="space-y-4"
                    >
                        <div className="rounded-2xl border-2 border-border bg-card p-6">
                            <div className="flex flex-col items-center text-center space-y-4">
                                <div className="rounded-full bg-blue-500/10 p-4">
                                    <CreditCard className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="font-semibold text-lg">Fast, Secure Payouts</h3>
                                    <p className="text-sm text-muted-foreground">
                                        We use Stripe to get you paid quickly and keep your personal and bank details secure.
                                        You must connect a Stripe account before you can submit proposals on GitLance.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <Button
                            onClick={handleConnectStripe}
                            disabled={isLinking}
                            className="w-full h-12 text-base bg-[#635BFF] hover:bg-[#4B44D5] text-white"
                        >
                            {isLinking ? (
                                <>
                                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                    Connecting...
                                </>
                            ) : (
                                "Connect with Stripe"
                            )}
                        </Button>

                        {onSkip && (
                            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                                <div className="flex items-start gap-3">
                                    <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                                    <div className="flex-1 text-sm">
                                        <p className="font-medium text-amber-600 dark:text-amber-400">
                                            You can skip this step for now
                                        </p>
                                        <p className="text-amber-600/80 dark:text-amber-400/80 mt-1">
                                            However, you'll need to connect Stripe later from settings before you can submit proposals.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}
            </div>
        </motion.div>
    );
}
