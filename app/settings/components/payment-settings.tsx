"use client";

import { motion } from "motion/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, CreditCard } from "lucide-react";
import { toast } from "sonner";

interface PaymentSettingsProps {
    stripeConnectId?: string | null;
}

export function PaymentSettings({ stripeConnectId }: PaymentSettingsProps) {
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

    const handleDisconnectStripe = async () => {
        if (!confirm("Are you sure you want to disconnect your Stripe account? This will reset your connection and you'll need to onboard again.")) return;

        setIsLinking(true);
        try {
            const res = await fetch("/api/stripe-connect/disconnect", {
                method: "POST",
            });
            const result = await res.json();

            if (res.ok) {
                toast.success("Stripe account disconnected");
                window.location.reload();
            } else {
                toast.error(result.error || "Failed to disconnect Stripe account");
            }
        } catch (error) {
            console.error("Error disconnecting Stripe:", error);
            toast.error("Something went wrong");
        } finally {
            setIsLinking(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">Payout Settings</h3>
                <p className="text-sm text-muted-foreground">
                    Manage how you receive payments for completed modules.
                </p>
            </div>

            <div className="rounded-xl border bg-card p-6">
                {stripeConnectId ? (
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="rounded-full bg-green-500/10 p-3">
                                <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                                <h4 className="font-medium text-foreground">Stripe Account Connected</h4>
                                <p className="text-sm text-muted-foreground">
                                    You are ready to receive payouts directly to your bank account.
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button
                                onClick={handleDisconnectStripe}
                                disabled={isLinking}
                                variant="ghost"
                                className="shrink-0 text-destructive hover:bg-destructive/10"
                            >
                                Disconnect
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-start gap-4">
                            <div className="rounded-full bg-blue-500/10 p-3 shrink-0 mt-1 md:mt-0">
                                <CreditCard className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <h4 className="font-medium text-foreground">Connect with Stripe</h4>
                                <p className="text-sm text-muted-foreground max-w-md mt-1">
                                    We partner with Stripe for fast, secure payouts. You must connect a Stripe account before you can submit proposals on GitLance.
                                </p>
                            </div>
                        </div>
                        <Button
                            onClick={handleConnectStripe}
                            disabled={isLinking}
                            className="shrink-0 bg-[#635BFF] hover:bg-[#4B44D5] text-white"
                        >
                            {isLinking ? (
                                <>
                                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                    Connecting...
                                </>
                            ) : (
                                "Connect Account"
                            )}
                        </Button>
                    </div>
                )}
            </div>
        </div >
    );
}
