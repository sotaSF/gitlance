"use client";

import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const MarkdownPreview = dynamic(() => import("@uiw/react-markdown-preview"), {
  ssr: false,
});

interface ProfileDescriptionProps {
  description: string;
}

export function ProfileDescription({ description }: ProfileDescriptionProps) {
  const { theme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="text-sm text-muted-foreground leading-relaxed">
        {description}
      </div>
    );
  }

  const currentTheme = theme === "system" ? systemTheme : theme;

  return (
    <div className="prose prose-sm dark:prose-invert max-w-none">
      <MarkdownPreview 
        source={description}
        style={{ 
          backgroundColor: 'transparent',
          color: 'inherit',
          fontSize: '0.875rem',
          lineHeight: '1.5rem'
        }}
        wrapperElement={{
          "data-color-mode": currentTheme as "light" | "dark"
        }}
      />
    </div>
  );
}

