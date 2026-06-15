"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";

interface DashboardAnimatorProps {
    children: React.ReactNode;
}

export function DashboardAnimator({ children }: DashboardAnimatorProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        const elements = containerRef.current.querySelectorAll(".dash-animate");

        gsap.set(elements, {
            opacity: 0,
            y: 30,
        });

        gsap.to(elements, {
            opacity: 1,
            y: 0,
            duration: 0.6,
            stagger: 0.1,
            ease: "power3.out",
            delay: 0.1,
        });

        return () => {
            gsap.killTweensOf(elements);
        };
    }, []);

    return (
        <div ref={containerRef} className="space-y-6">
            {children}
        </div>
    );
}
