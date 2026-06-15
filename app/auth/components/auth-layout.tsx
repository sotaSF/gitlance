import { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface AuthLayoutProps {
  children: ReactNode;
  testimonial: ReactNode;
}

export function AuthLayout({ children, testimonial }: AuthLayoutProps) {
  return (
    <main className="min-h-screen grid lg:grid-cols-2 bg-[var(--color-background)] text-[var(--color-foreground)]">
      {/* Left: form section */}
      <div className="relative flex items-center justify-center bg-[var(--color-card)] p-6 sm:p-10 lg:p-16 rounded-none m-0">
        <Link
          href="/"
          className="absolute top-6 left-6 md:top-8 md:left-8 flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
        <div className="w-full max-w-md">{children}</div>
      </div>

      {/* Right: testimonial section */}
      <div className="hidden lg:flex items-center justify-center bg-[var(--color-background)] p-10">
        {testimonial}
      </div>
    </main>
  );
}
