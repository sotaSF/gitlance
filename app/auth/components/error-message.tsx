"use client";

import { useSearchParams } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";

export function ErrorMessage() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const [show, setShow] = useState(!!error);

  useEffect(() => {
    if (error) {
      setShow(true);
      // Auto-hide after 5 seconds
      const timer = setTimeout(() => setShow(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  if (!show || !error) return null;

  return (
    <div className="flex items-start gap-3 mb-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-900/10 dark:text-red-400">
      <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
      <div className="flex-1">
        <p className="font-medium">Error</p>
        <p className="mt-1 text-red-700 dark:text-red-300">{error}</p>
      </div>
      <button
        onClick={() => setShow(false)}
        className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  );
}
