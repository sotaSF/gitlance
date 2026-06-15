interface AuthHeaderProps {
  title: string;
  description: string;
}

export function AuthHeader({ title, description }: AuthHeaderProps) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
        {description}
      </p>
    </div>
  );
}
