import Stripe from "stripe";
import { env } from "@/config/env";

export const stripe = new Stripe(env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-01-28.clover", // Use a specific version for stability
  typescript: true,
});

/**
 * Format amount for Stripe (converts to cents)
 * Stripe expects amounts in the smallest currency unit (e.g., cents for USD)
 */
export function formatAmountForStripe(amount: number, currency: string = "usd"): number {
  const numberFormat = new Intl.NumberFormat(["en-US"], {
    style: "currency",
    currency: currency,
    currencyDisplay: "symbol",
  });
  const parts = numberFormat.formatToParts(amount);
  let zeroDecimalCurrency = true;
  for (const part of parts) {
    if (part.type === "decimal") {
      zeroDecimalCurrency = false;
    }
  }

  return zeroDecimalCurrency ? amount : Math.round(amount * 100);
}

/**
 * Calculate total project cost from assigned modules
 */
export function calculateProjectTotal(
  modules: Array<{ proposedCost: number;[key: string]: unknown }>
): number {
  return modules.reduce((total, module) => total + (module.proposedCost || 0), 0);
}
