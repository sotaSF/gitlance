interface AuthTestimonialProps {
  quote: string;
  highlight: string;
}

export function AuthTestimonial({ quote, highlight }: AuthTestimonialProps) {
  const parts = quote.split(highlight);

  return (
    <figure className="max-w-xl text-balance">
      <blockquote className="text-2xl font-medium leading-relaxed">
        <span className="text-5xl text-[var(--color-muted-foreground)] font-[Helvetica Neue]">
          "
        </span>
        {parts[0]}
        <mark className="mx-1 rounded bg-[var(--color-brand)] px-1 py-0.5 text-[var(--color-smooth-1000)]">
          {highlight}
        </mark>
        {parts[1]}
      </blockquote>
    </figure>
  );
}
