"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";

interface MeshGradientProps {
  className?: string;
  interactive?: boolean;
}

export function MeshGradient({ className = "", interactive = true }: MeshGradientProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const orb1Ref = useRef<HTMLDivElement>(null);
  const orb2Ref = useRef<HTMLDivElement>(null);
  const orb3Ref = useRef<HTMLDivElement>(null);
  const orb4Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const orbs = [orb1Ref.current, orb2Ref.current, orb3Ref.current, orb4Ref.current];
    
    orbs.forEach((orb, index) => {
      if (!orb) return;
      
      // Create floating animation with different durations
      gsap.to(orb, {
        x: "random(-100, 100)",
        y: "random(-80, 80)",
        duration: 8 + index * 2,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
      
      // Scale breathing effect
      gsap.to(orb, {
        scale: "random(0.8, 1.2)",
        duration: 4 + index,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
    });

    // Mouse interaction
    if (interactive && containerRef.current) {
      const handleMouseMove = (e: MouseEvent) => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;
        
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        
        orbs.forEach((orb, index) => {
          if (!orb) return;
          gsap.to(orb, {
            x: `+=${x * (30 + index * 10)}`,
            y: `+=${y * (30 + index * 10)}`,
            duration: 1,
            ease: "power2.out",
          });
        });
      };

      containerRef.current.addEventListener("mousemove", handleMouseMove);
      return () => {
        containerRef.current?.removeEventListener("mousemove", handleMouseMove);
      };
    }
  }, [interactive]);

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 overflow-hidden ${className}`}
      aria-hidden="true"
    >
      {/* Base gradient layer */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/30 via-transparent to-cyan-50/30 dark:from-emerald-950/20 dark:via-transparent dark:to-cyan-950/20" />
      
      {/* Animated orbs */}
      <div
        ref={orb1Ref}
        className="absolute left-[10%] top-[10%] h-[500px] w-[500px] rounded-full bg-gradient-to-br from-emerald-400/30 to-teal-400/20 blur-[100px] dark:from-emerald-500/15 dark:to-teal-500/10"
      />
      <div
        ref={orb2Ref}
        className="absolute right-[10%] top-[20%] h-[400px] w-[400px] rounded-full bg-gradient-to-br from-cyan-400/25 to-emerald-400/20 blur-[80px] dark:from-cyan-500/12 dark:to-emerald-500/10"
      />
      <div
        ref={orb3Ref}
        className="absolute bottom-[20%] left-[20%] h-[450px] w-[450px] rounded-full bg-gradient-to-br from-teal-400/25 to-green-400/20 blur-[90px] dark:from-teal-500/12 dark:to-green-500/10"
      />
      <div
        ref={orb4Ref}
        className="absolute bottom-[10%] right-[15%] h-[350px] w-[350px] rounded-full bg-gradient-to-br from-emerald-500/20 to-cyan-400/15 blur-[70px] dark:from-emerald-600/10 dark:to-cyan-500/8"
      />
      
      {/* Grid overlay */}
      <div className="absolute inset-0 grid-pattern opacity-50" />
      
      {/* Noise texture */}
      <div className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03]" 
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
}

export default MeshGradient;

