import { Suspense } from "react";
import SettingsContent from "./settings-content";

function SettingsLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 rounded-full border-4 border-emerald-500/30 border-t-emerald-500 animate-spin" />
        <p className="text-muted-foreground animate-pulse">
          Loading settings...
        </p>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<SettingsLoading />}>
      <SettingsContent />
    </Suspense>
  );
}
