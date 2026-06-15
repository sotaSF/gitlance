"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

interface PaymentVerificationProps {
    onSuccess: (paymentId: string) => void;
    onCancel: () => void;
}

export function PaymentVerification({ onSuccess, onCancel }: PaymentVerificationProps) {
    const searchParams = useSearchParams();
    const sessionId = searchParams.get("session_id");
    const paymentSuccess = searchParams.get("payment_success");
    const paymentCanceled = searchParams.get("payment_canceled");

    const [isVerifying, setIsVerifying] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (paymentCanceled) {
            setIsVerifying(false);
            setError("Payment was canceled.");
            return;
        }

        if (!sessionId || !paymentSuccess) {
            setIsVerifying(false);
            return; // Not a redirect back from payment
        }

        const verifyPayment = async () => {
            try {
                // Poll for a few seconds to allow webhook to process
                let attempts = 0;
                const maxAttempts = 10; // 20 seconds

                const checkStatus = async () => {
                    const response = await fetch(`/api/payments/verify?sessionId=${sessionId}`);
                    const data = await response.json();

                    if (data.status === "succeeded") {
                        setIsVerifying(false);
                        onSuccess(data.paymentId);
                        return true;
                    }

                    if (data.status === "failed") {
                        setIsVerifying(false);
                        setError("Payment failed. Please try again.");
                        return true;
                    }

                    return false;
                };

                const poll = async () => {
                    const done = await checkStatus();
                    if (!done && attempts < maxAttempts) {
                        attempts++;
                        setTimeout(poll, 2000);
                    } else if (!done) {
                        // We timed out waiting for webhook, but if stripe said success (validated by API in verify route)
                        // we can probably proceed or ask user to refresh.
                        // Our verify route handles direct stripe check if DB is missing.
                        setIsVerifying(false);
                        setError("Payment verification timed out. Please refresh the page.");
                    }
                };

                poll();

            } catch (err) {
                console.error("Verification error:", err);
                setIsVerifying(false);
                setError("Failed to verify payment status.");
            }
        };

        verifyPayment();
    }, [sessionId, paymentSuccess, paymentCanceled]);

    if (!paymentSuccess && !paymentCanceled) return null;

    return (
        <Card className="border-green-100 bg-green-50/50 dark:bg-green-950/10 mb-6">
            <CardContent className="pt-6 flex flex-col items-center justify-center text-center p-6">
                {isVerifying ? (
                    <>
                        <Loader2 className="h-8 w-8 text-green-600 animate-spin mb-3" />
                        <h3 className="font-medium text-lg text-green-900 dark:text-green-100">Verifying Payment...</h3>
                        <p className="text-sm text-green-700 dark:text-green-300">
                            Please wait while we confirm your transaction.
                        </p>
                    </>
                ) : error ? (
                    <>
                        <XCircle className="h-8 w-8 text-red-600 mb-3" />
                        <h3 className="font-medium text-lg text-red-900 dark:text-red-100">Payment Issue</h3>
                        <p className="text-sm text-red-700 dark:text-red-300 mb-4">{error}</p>
                        <Button variant="outline" size="sm" onClick={onCancel}>
                            Try Again
                        </Button>
                    </>
                ) : (
                    <>
                        <CheckCircle2 className="h-8 w-8 text-green-600 mb-3" />
                        <h3 className="font-medium text-lg text-green-900 dark:text-green-100">Payment Successful!</h3>
                        <p className="text-sm text-green-700 dark:text-green-300">
                            Your project funding has been secured. You can now create your workspace.
                        </p>
                    </>
                )}
            </CardContent>
        </Card>
    );
}
