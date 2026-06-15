"use client";

import { useEffect, useRef, useState } from "react";
import {
  Github,
  Users,
  MessageSquare,
  Wrench,
  Zap,
  CheckCircle2,
} from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const hubFeatures = [
  {
    icon: Github,
    title: "GitHub",
    description: "Repository integration",
    color: "#06B6D4",
  },
  {
    icon: Users,
    title: "Teams",
    description: "Smart formation",
    color: "#A855F7",
  },
  {
    icon: MessageSquare,
    title: "Real-time",
    description: "Live collaboration",
    color: "#F97316",
  },
  {
    icon: Wrench,
    title: "Projects",
    description: "Management tools",
    color: "#EC4899",
  },
];

const highlights = [
  "Connect your GitHub repos instantly",
  "AI-powered team matching",
  "Real-time code collaboration",
  "Integrated project management",
];

export default function FeaturesSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const diagramRef = useRef<HTMLDivElement>(null);
  const hubRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const nodeRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [lines, setLines] = useState<
    { x1: number; y1: number; x2: number; y2: number; color: string }[]
  >([]);

  const updateLines = () => {
    if (!hubRef.current || !svgRef.current) return;

    const hubRect = hubRef.current.getBoundingClientRect();
    const svgRect = svgRef.current.getBoundingClientRect();

    const hubCenterX = hubRect.left + hubRect.width / 2 - svgRect.left;
    const hubCenterY = hubRect.top + hubRect.height / 2 - svgRect.top;

    const newLines = nodeRefs.current.map((node, i) => {
      if (!node)
        return { x1: 0, y1: 0, x2: 0, y2: 0, color: hubFeatures[i].color };

      const nodeRect = node.getBoundingClientRect();
      const nodeCenterX = nodeRect.left + nodeRect.width / 2 - svgRect.left;
      const nodeCenterY = nodeRect.top + nodeRect.height / 2 - svgRect.top;

      return {
        x1: hubCenterX,
        y1: hubCenterY,
        x2: nodeCenterX,
        y2: nodeCenterY,
        color: hubFeatures[i].color,
      };
    });

    setLines(newLines);
  };

  useEffect(() => {
    if (!sectionRef.current) return;

    const timer = setTimeout(updateLines, 100);

    const ctx = gsap.context(() => {
      gsap.to("[data-hub-pulse]", {
        scale: 1.3,
        opacity: 0,
        duration: 2,
        repeat: -1,
        ease: "power1.out",
      });

      gsap.fromTo(
        "[data-animate-hub]",
        { scale: 0, opacity: 0 },
        {
          scale: 1,
          opacity: 1,
          duration: 0.6,
          ease: "back.out(1.7)",
          scrollTrigger: {
            trigger: diagramRef.current,
            start: "top 70%",
            once: true,
          },
          onComplete: updateLines,
        }
      );

      gsap.fromTo(
        "[data-feature-node]",
        { scale: 0, opacity: 0 },
        {
          scale: 1,
          opacity: 1,
          duration: 0.5,
          stagger: 0.1,
          ease: "back.out(1.4)",
          scrollTrigger: {
            trigger: diagramRef.current,
            start: "top 60%",
            once: true,
          },
          onComplete: updateLines,
        }
      );

      gsap.fromTo(
        "[data-content-animate] > *",
        { opacity: 0, x: -30 },
        {
          opacity: 1,
          x: 0,
          duration: 0.6,
          stagger: 0.1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: "[data-content-animate]",
            start: "top 85%",
            once: true,
          },
        }
      );

      nodeRefs.current.forEach((node) => {
        if (!node) return;
        // Draggable functionality temporarily disabled due to GSAP type resolution issues
        // Can be re-enabled when GSAP exports are properly resolved
        // gsap.Draggable?.create(node, {
        //   type: "x,y",
        //   bounds: diagramRef.current,
        //   inertia: false,
        //   onDrag: updateLines,
        //   onThrowUpdate: updateLines,
        // });
      });
    }, sectionRef);

    window.addEventListener("resize", updateLines);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", updateLines);
      ctx.revert();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      id="features"
      className="relative sm:mx-4 sm:rounded-2xl py-8 sm:py-12 md:py-16 overflow-x-clip sm:mt-6 bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 dark:from-[#0c0c0f] dark:via-[#0a0a0d] dark:to-[#08080b]"
    >
      {/* Cross-hatch dotted texture using CSS only - GPU optimized */}
      <div
        className="absolute inset-0 pointer-events-none opacity-30 dark:opacity-50"
        style={{
          backgroundImage: `
            radial-gradient(circle at center, rgba(16, 185, 129, 0.4) 0.5px, transparent 0.5px),
            radial-gradient(circle at center, rgba(16, 185, 129, 0.15) 0.5px, transparent 0.5px)
          `,
          backgroundSize: "24px 24px, 8px 8px",
          backgroundPosition: "0 0, 4px 4px",
        }}
      />

      {/* Diagonal line texture overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.02] dark:opacity-[0.03]"
        style={{
          backgroundImage: `
            repeating-linear-gradient(
              45deg,
              transparent,
              transparent 10px,
              rgba(16, 185, 129, 0.5) 10px,
              rgba(16, 185, 129, 0.5) 11px
            ),
            repeating-linear-gradient(
              -45deg,
              transparent,
              transparent 10px,
              rgba(6, 182, 212, 0.3) 10px,
              rgba(6, 182, 212, 0.3) 11px
            )
          `,
        }}
      />

      {/* Accent gradient overlays with richer colors */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Light mode gradients */}
        <div
          className="absolute inset-0 dark:hidden"
          style={{
            background: `
              radial-gradient(ellipse 80% 60% at 10% 10%, rgba(16, 185, 129, 0.08) 0%, transparent 50%),
              radial-gradient(ellipse 60% 50% at 90% 20%, rgba(6, 182, 212, 0.06) 0%, transparent 50%),
              radial-gradient(ellipse 70% 50% at 80% 90%, rgba(168, 85, 247, 0.04) 0%, transparent 50%),
              radial-gradient(ellipse 50% 40% at 20% 80%, rgba(236, 72, 153, 0.03) 0%, transparent 50%)
            `,
          }}
        />
        {/* Dark mode gradients */}
        <div
          className="absolute inset-0 hidden dark:block"
          style={{
            background: `
              radial-gradient(ellipse 80% 60% at 10% 10%, rgba(16, 185, 129, 0.12) 0%, transparent 50%),
              radial-gradient(ellipse 60% 50% at 90% 20%, rgba(6, 182, 212, 0.08) 0%, transparent 50%),
              radial-gradient(ellipse 70% 50% at 80% 90%, rgba(168, 85, 247, 0.06) 0%, transparent 50%),
              radial-gradient(ellipse 50% 40% at 20% 80%, rgba(236, 72, 153, 0.04) 0%, transparent 50%)
            `,
          }}
        />
      </div>

      {/* Top edge highlight */}
      <div className="absolute inset-x-0 top-0 h-px pointer-events-none">
        <div
          className="dark:hidden h-full"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(16, 185, 129, 0.2) 20%, rgba(6, 182, 212, 0.15) 50%, rgba(16, 185, 129, 0.2) 80%, transparent)",
          }}
        />
        <div
          className="hidden dark:block h-full"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(16, 185, 129, 0.3) 20%, rgba(6, 182, 212, 0.2) 50%, rgba(16, 185, 129, 0.3) 80%, transparent)",
          }}
        />
      </div>

      {/* Vignette effect */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0 dark:hidden"
          style={{
            background:
              "radial-gradient(ellipse at center, transparent 0%, rgba(148, 163, 184, 0.15) 100%)",
          }}
        />
        <div
          className="absolute inset-0 hidden dark:block"
          style={{
            background:
              "radial-gradient(ellipse at center, transparent 0%, rgba(0, 0, 0, 0.4) 100%)",
          }}
        />
      </div>

      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        {/* Two Column Layout */}
        <div className="flex flex-col lg:flex-row items-center justify-between lg:gap-8">
          {/* Left Content */}
          <div
            data-content-animate
            className="flex-1 sm:ml-6 text-center lg:text-left order-1 lg:order-1 max-w-lg"
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-4 sm:mb-6 rounded-full bg-emerald-500/10 dark:bg-emerald-500/10 border border-emerald-500/30 dark:border-emerald-500/20 backdrop-blur-sm">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 tracking-wide uppercase">
                Core Features
              </span>
            </div>

            <h2 className="font-heading mb-4 sm:mb-5 text-2xl sm:text-3xl md:text-4xl lg:text-4xl xl:text-5xl font-bold tracking-tight">
              <span className="text-slate-900 dark:text-zinc-100">
                Built for{" "}
              </span>
              <span className="relative">
                <span className="bg-linear-to-r from-emerald-600 via-emerald-500 to-teal-500 dark:from-emerald-400 dark:via-emerald-300 dark:to-teal-400 bg-clip-text text-transparent">
                  Modern Teams
                </span>
                <svg
                  className="absolute -bottom-1 left-0 w-full h-2 text-emerald-500/40 dark:text-emerald-500/30"
                  viewBox="0 0 100 8"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M0 7 Q25 0, 50 7 T100 7"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="none"
                  />
                </svg>
              </span>
            </h2>

            <p className="text-sm sm:text-base text-slate-600 dark:text-zinc-400 mb-6 sm:mb-8 leading-relaxed">
              A powerful collaboration engine connecting all your development
              tools in one unified platform.
            </p>

            {/* Feature Highlights */}
            <ul className="space-y-3 sm:space-y-4 mb-6 sm:mb-8 text-left mx-auto lg:mx-0 max-w-sm">
              {highlights.map((item, i) => (
                <li
                  key={i}
                  className="flex items-center gap-3 text-xs sm:text-sm text-slate-700 dark:text-zinc-300 group"
                >
                  <div className="relative flex-shrink-0">
                    <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-sm group-hover:blur-md transition-all" />
                    <CheckCircle2 className="relative h-4 w-4 sm:h-5 sm:w-5 text-emerald-500 dark:text-emerald-400" />
                  </div>
                  <span className="group-hover:text-slate-900 dark:group-hover:text-zinc-100 transition-colors">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right - Hub Diagram */}
          <div
            ref={diagramRef}
            className="flex-shrink-0 mt-8 relative w-[324px] sm:w-[380px] md:w-[440px] lg:w-[460px] xl:w-[500px] h-[280px] sm:h-[300px] md:h-[340px] lg:h-[300px] xl:h-[380px] order-2 lg:order-2 mx-auto lg:mx-0 rounded-2xl"
          >
            {/* Light mode background */}
            <div
              className="absolute inset-0 rounded-2xl dark:hidden"
              style={{
                background:
                  "radial-gradient(circle at 50% 50%, rgba(16, 185, 129, 0.06) 0%, transparent 70%)",
              }}
            />
            {/* Dark mode background */}
            <div
              className="absolute inset-0 rounded-2xl hidden dark:block"
              style={{
                background:
                  "radial-gradient(circle at 50% 50%, rgba(16, 185, 129, 0.04) 0%, transparent 70%)",
              }}
            />
            {/* SVG Connection Lines */}
            <svg
              ref={svgRef}
              className="absolute inset-0 w-full h-full pointer-events-none z-0"
            >
              <defs>
                {hubFeatures.map((feature, i) => (
                  <linearGradient
                    key={`gradient-${i}`}
                    id={`line-gradient-${i}`}
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                  >
                    <stop offset="0%" stopColor="#10B981" stopOpacity="0.8" />
                    <stop
                      offset="50%"
                      stopColor={feature.color}
                      stopOpacity="0.5"
                    />
                    <stop
                      offset="100%"
                      stopColor={feature.color}
                      stopOpacity="0.3"
                    />
                  </linearGradient>
                ))}
                {hubFeatures.map((feature, i) => (
                  <filter key={`glow-${i}`} id={`line-glow-${i}`}>
                    <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                    <feMerge>
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                ))}
              </defs>

              {lines.map((line, i) => (
                <g key={i}>
                  {/* Glow line underneath */}
                  <line
                    x1={line.x1}
                    y1={line.y1}
                    x2={line.x2}
                    y2={line.y2}
                    stroke={line.color}
                    strokeWidth="4"
                    strokeLinecap="round"
                    opacity="0.1"
                    filter={`url(#line-glow-${i})`}
                  />
                  {/* Main dashed line */}
                  <line
                    x1={line.x1}
                    y1={line.y1}
                    x2={line.x2}
                    y2={line.y2}
                    stroke={`url(#line-gradient-${i})`}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeDasharray="8 6"
                    className="animate-dash"
                  />
                  {/* Animated particle */}
                  <circle r="4" opacity="0.9" filter={`url(#line-glow-${i})`}>
                    <animate
                      attributeName="fill"
                      values={`#10B981;${line.color};#10B981`}
                      dur="2s"
                      repeatCount="indefinite"
                    />
                    <animateMotion
                      dur={`${2.5 + i * 0.3}s`}
                      repeatCount="indefinite"
                      path={`M${line.x1},${line.y1} L${line.x2},${line.y2}`}
                    />
                  </circle>
                </g>
              ))}
            </svg>

            {/* Central Hub */}
            <div
              ref={hubRef}
              data-animate-hub
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20"
            >
              {/* Outer glow ring */}
              <div className="absolute inset-0 -m-6 sm:-m-8 rounded-full bg-emerald-500/10 dark:bg-emerald-500/5 border border-emerald-500/20 dark:border-emerald-500/10" />

              {/* Pulsing rings */}
              <div
                data-hub-pulse
                className="absolute inset-0 -m-3 sm:-m-4 rounded-full bg-emerald-500/30 dark:bg-emerald-500/20 border border-emerald-500/40 dark:border-emerald-500/30"
              />
              <div
                data-hub-pulse
                className="absolute inset-0 -m-1 sm:-m-2 rounded-full bg-emerald-500/20 dark:bg-emerald-500/10"
                style={{ animationDelay: "0.5s" }}
              />

              {/* Hub core - responsive */}
              <div
                className="relative w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-18 lg:h-18 rounded-full flex items-center justify-center"
                style={{
                  background:
                    "linear-gradient(135deg, #10B981 0%, #059669 50%, #047857 100%)",
                  boxShadow:
                    "0 0 40px rgba(16, 185, 129, 0.4), 0 0 80px rgba(16, 185, 129, 0.2), inset 0 2px 4px rgba(255,255,255,0.2)",
                }}
              >
                <Zap
                  className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white drop-shadow-lg"
                  fill="currentColor"
                />
              </div>
            </div>

            {/* Feature Nodes - Responsive positions */}
            {hubFeatures.map((feature, index) => {
              const positions = [
                { top: "0%", left: "50%", transform: "translateX(-50%)" },
                { top: "50%", right: "0%", transform: "translateY(-50%)" },
                { bottom: "0%", left: "50%", transform: "translateX(-50%)" },
                { top: "50%", left: "0%", transform: "translateY(-50%)" },
              ];

              return (
                <div
                  key={feature.title}
                  ref={(el) => {
                    nodeRefs.current[index] = el;
                  }}
                  data-feature-node
                  className="absolute z-10 cursor-grab active:cursor-grabbing group"
                  style={positions[index]}
                >
                  {/* Card - Glassmorphism style */}
                  <div
                    className="relative rounded-xl px-1 py-2 sm:px-3.5 sm:py-2.5 md:px-4 md:py-3 transition-all duration-300 hover:scale-105 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm"
                    style={{
                      border: `1px solid ${feature.color}25`,
                      boxShadow: `0 4px 24px ${feature.color}10, inset 0 1px 0 rgba(255,255,255,0.05)`,
                    }}
                  >
                    {/* Glow effect on hover */}
                    <div
                      className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                      style={{
                        background: `radial-gradient(circle at 50% 50%, ${feature.color}15 0%, transparent 70%)`,
                      }}
                    />

                    <div className="relative flex items-center gap-2 sm:gap-2.5 md:gap-3">
                      {/* Icon */}
                      <div
                        className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110"
                        style={{
                          background: `linear-gradient(135deg, ${feature.color}20 0%, ${feature.color}10 100%)`,
                          border: `1px solid ${feature.color}30`,
                        }}
                      >
                        <feature.icon
                          className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-4.5 md:h-4.5"
                          style={{ color: feature.color }}
                          strokeWidth={2}
                        />
                      </div>

                      {/* Text */}
                      <div className="min-w-0">
                        <h3
                          className="font-semibold text-[11px] sm:text-xs md:text-sm truncate leading-tight"
                          style={{ color: feature.color }}
                        >
                          {feature.title}
                        </h3>
                        <p className="text-[9px] sm:text-[10px] md:text-xs text-slate-500 dark:text-zinc-500 truncate leading-tight">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Stats Bar - Compact */}
        {/* <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4 max-w-3xl mx-auto mt-10 sm:mt-12 md:mt-14">
          {[
            { value: "10k+", label: "Repos Synced", color: "#06B6D4" },
            { value: "50k+", label: "Pull Requests", color: "#A855F7" },
            { value: "5k+", label: "Teams Formed", color: "#F97316" },
            { value: "99.9%", label: "Uptime", color: "#EC4899" },
          ].map((stat) => (
            <div 
              key={stat.label}
              className="bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-3 sm:p-4 text-center transition-colors hover:border-zinc-300 dark:hover:border-zinc-700"
            >
              <div 
                className="text-lg sm:text-xl md:text-2xl font-bold"
                style={{ color: stat.color }}
              >
                {stat.value}
              </div>
              <div className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">
                {stat.label}
              </div>
            </div>
          ))}
        </div> */}
      </div>

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes dash {
          to {
            stroke-dashoffset: -28;
          }
        }
        .animate-dash {
          animation: dash 1s linear infinite;
        }
      `}</style>
    </section>
  );
}
