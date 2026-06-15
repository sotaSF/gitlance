import Link from "next/link";

interface AuthFooterLinkProps {
  text: string;
  linkText: string;
  href: string;
}

export function AuthFooterLink({ text, linkText, href }: AuthFooterLinkProps) {
  return (
    <p className="mt-2 text-center text-sm text-[var(--color-muted-foreground)]">
      {text}{" "}
      <Link href={href} className="text-[var(--color-brand)] hover:underline">
        {linkText}
      </Link>
    </p>
  );
}
