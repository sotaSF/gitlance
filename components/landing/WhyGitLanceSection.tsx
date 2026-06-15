"use client";

import { useRef, useEffect } from "react";
import { Eye, Users, Zap, CheckCircle2 } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const pillars = [
  {
    icon: Eye,
    title: "Transparency",
    description: "Every commit, pull request, and project update is visible in real time. No more guessing about progress.",
    features: ["Real-time activity feeds", "Commit tracking", "Progress dashboards"],
  },
  {
    icon: Users,
    title: "Collaboration",
    description: "Integrated chat, proposals, and task management. Work together as if you're in the same room.",
    features: ["Built-in messaging", "Team proposals", "Task boards"],
  },
  {
    icon: Zap,
    title: "Efficiency",
    description: "No third-party tools required — everything happens within GitLance. One platform, infinite possibilities.",
    features: ["All-in-one workspace", "Automated workflows", "Quick deployment"],
  },
];

function PillarCard({ pillar, index }: { pillar: typeof pillars[0]; index: number }) {
  const Icon = pillar.icon;

  return (
    <div className="group relative h-full">
      {/* Card Container with Premium Styles */}
      <div
        className="spotlight card-premium h-full rounded-3xl p-8 lg:p-10 transition-all duration-500 hover:-translate-y-2 flex flex-col border-border/50 hover:border-emerald-500/20"
        style={{ "--mouse-x": "50%", "--mouse-y": "50%" } as React.CSSProperties}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          e.currentTarget.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`);
          e.currentTarget.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`);
        }}
      >
        {/* Icon */}
        <div className="mb-8 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary/50 border border-border group-hover:border-emerald-500/30 group-hover:bg-emerald-500/5 transition-all duration-500 group-hover:scale-110">
          <Icon className="h-8 w-8 text-muted-foreground group-hover:text-emerald-500 transition-colors duration-300" />
        </div>

        {/* Content */}
        <h3 className="mb-4 font-heading text-2xl font-bold text-foreground tracking-tight transition-colors duration-300">
          {pillar.title}
        </h3>

        <p className="mb-8 text-muted-foreground leading-relaxed text-base flex-grow">
          {pillar.description}
        </p>

        {/* Features */}
        <ul className="space-y-4 mt-auto">
          {pillar.features.map((feature) => (
            <li key={feature} className="flex items-start gap-3 text-sm text-muted-foreground group/item">
              <CheckCircle2 className="h-5 w-5 text-muted-foreground/40 group-hover/item:text-emerald-500 transition-colors shrink-0" />
              <span className="group-hover/item:text-foreground transition-colors duration-300">
                {feature}
              </span>
            </li>
          ))}
        </ul>

        {/* Decorative corner gradient */}
        <div className="absolute top-0 right-0 h-32 w-32 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent rounded-bl-[100px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      </div>
    </div>
  );
}

export default function WhyGitLanceSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!sectionRef.current || hasAnimated.current) return;
    hasAnimated.current = true;

    const ctx = gsap.context(() => {
      // Header Animation
      gsap.fromTo(
        '[data-animate-header] > *',
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.15,
          ease: "power3.out",
          scrollTrigger: {
            trigger: '[data-animate-header]',
            start: "top 85%",
            once: true,
          },
        }
      );

      // Cards Animation
      gsap.fromTo(
        '[data-animate-card]',
        { opacity: 0, y: 60, scale: 0.95 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.8,
          stagger: 0.2,
          ease: "power3.out",
          scrollTrigger: {
            trigger: '[data-animate-cards]',
            start: "top 75%",
            once: true,
          },
          clearProps: "transform,opacity", // Clear props to allow hover effects to work properly
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="about"
      className="relative overflow-hidden py-32 lg:py-40"
    >
      {/* Premium Background Elements */}
      <div className="absolute inset-0 bg-background/50" />
      <div className="absolute inset-0 mesh-gradient opacity-20 dark:opacity-10" />
      <div className="absolute inset-0 grain-overlay opacity-50" />

      {/* Floating Orbs */}
      <div className="absolute left-0 top-1/4 h-96 w-96 -translate-x-1/2 rounded-full bg-emerald-500/5 blur-[120px] animate-float-slow" />
      <div className="absolute right-0 bottom-1/4 h-96 w-96 translate-x-1/2 rounded-full bg-blue-500/5 blur-[120px] animate-float-slow" style={{ animationDelay: "3s" }} />

      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div data-animate-header className="mx-auto max-w-3xl text-center mb-20 lg:mb-24">
          <div className="inline-flex items-center gap-2 rounded-full bg-secondary/50 border border-border px-4 py-1.5 text-sm font-medium text-muted-foreground backdrop-blur-md shadow-sm mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Why Choose Us
          </div>

          <h2 className="font-heading text-4xl font-bold tracking-tight lg:text-6xl mb-8 leading-tight">
            Reimagining how <br className="hidden md:block" />
            <span className="text-gradient-primary">software is built</span>
          </h2>

          <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            GitLance combines the transparency of open source with the reliability of professional contracting.
            Experience a workflow that just makes sense.
          </p>
        </div>

        {/* Cards Grid */}
        <div data-animate-cards className="grid gap-8 md:grid-cols-3 relative">
          {/* Connecting Line (Desktop) */}
          <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-border to-transparent hidden md:block -translate-y-1/2 z-0" />

          {pillars.map((pillar, index) => (
            <div key={pillar.title} data-animate-card className="relative z-10">
              <PillarCard pillar={pillar} index={index} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
