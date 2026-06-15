"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Zap, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils"; // Assuming this helper exists or we create it

interface PaymentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    projectId: string;
    totalAmount: number;
    moduleAssignments: any[];
}

export function PaymentDialog({
    open,
    onOpenChange,
    projectId,
    totalAmount,
    moduleAssignments,
}: PaymentDialogProps) {
    const [isLoading, setIsLoading] = useState(false);

    const handlePayment = async () => {
        setIsLoading(true);
        try {
            const response = await fetch("/api/payments/create-checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    projectId,
                    totalAmount,
                    moduleAssignments,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to initiate payment");
            }

            // Redirect to Stripe Checkout
            window.location.href = data.url;
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Something went wrong. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5 text-green-600" />
                        Secure Payment Required
                    </DialogTitle>
                    <DialogDescription>
                        To create this workspace, the project funding must be secured upfront.
                        Funds are held safely until dispersed.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-6">
                    <div className="flex justify-between items-center text-sm mb-2">
                        <span className="text-muted-foreground">Total Project Cost</span>
                        <span className="font-medium text-lg">
                            ${totalAmount.toLocaleString()}
                        </span>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground">
                        Includes funding for <strong>{moduleAssignments.length} modules</strong> assigned to team members.
                    </div>
                </div>

                <DialogFooter className="flex-col gap-2 sm:flex-row">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>
                    <Button onClick={handlePayment} disabled={isLoading} className="bg-green-600 hover:bg-green-700">
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            <>
                                <Zap className="mr-2 h-4 w-4" />
                                Proceed to Payment
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
