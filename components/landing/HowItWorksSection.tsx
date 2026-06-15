"use client";

import { useRef, useEffect, useState } from "react";
import {
  Megaphone,
  Github,
  MessageSquare,
  Rocket,
  ArrowRight,
} from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Link from "next/link";

gsap.registerPlugin(ScrollTrigger);

interface Step {
  icon: React.ElementType;
  number: string;
  title: string;
  description: string;
}

const steps: Step[] = [
  {
    icon: Megaphone,
    number: "01",
    title: "Post or Join a Project",
    description:
      "Create a project with detailed requirements or discover opportunities that align with your expertise and interests.",
  },
  {
    icon: Github,
    number: "02",
    title: "Connect Your GitHub",
    description:
      "Link your repositories for seamless version control, automated tracking, and transparent progress updates.",
  },
  {
    icon: MessageSquare,
    number: "03",
    title: "Collaborate in Real Time",
    description:
      "Work together in a unified workspace. Share files, discuss ideas, and manage project milestones efficiently.",
  },
  {
    icon: Rocket,
    number: "04",
    title: "Ship with Confidence",
    description:
      "Review code collaboratively, track progress, and deploy your solutions knowing everything is in sync.",
  },
];

// Desktop step with large number
function DesktopStep({ step, index }: { step: Step; index: number }) {
  const Icon = step.icon;

  return (
    <div data-step={index} className="group relative">
      {/* Large number in background */}
      <div
        data-number={index}
        className="absolute -top-8 -left-4 select-none pointer-events-none"
      >
        <span className="text-[140px] font-bold leading-none text-[color:var(--color-smooth-300)] dark:text-[color:var(--color-smooth-900)] transition-colors duration-500 group-hover:text-[color:var(--color-brand)] dark:group-hover:text-[color:var(--color-brand-secondary)]">
          {step.number}
        </span>
      </div>

      {/* Content card */}
      <div data-card={index} className="relative z-10 pt-16">
        {/* Icon */}
        <div
          data-icon={index}
          className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[color:var(--color-smooth-50)] dark:bg-[color:var(--color-smooth-900)] shadow-sm border border-[color:var(--color-smooth-300)] dark:border-[color:var(--color-smooth-700)] transition-all duration-300 group-hover:bg-[color:var(--color-brand)] group-hover:border-[color:var(--color-brand)] group-hover:shadow-[0_20px_30px_rgba(16,185,129,0.2)]"
        >
          <Icon className="h-5 w-5 text-[color:var(--color-smooth-600)] dark:text-[color:var(--color-smooth-400)] transition-colors duration-300 group-hover:text-white" />
        </div>

        {/* Title */}
        <h3 className="text-xl font-semibold text-[color:var(--color-smooth-900)] dark:text-[color:var(--color-smooth-1000)] mb-3 transition-colors duration-300 group-hover:text-[color:var(--color-brand-secondary)] dark:group-hover:text-[color:var(--color-brand)]">
          {step.title}
        </h3>

        {/* Description */}
        <p className="text-sm leading-relaxed text-[color:var(--color-smooth-600)] dark:text-[color:var(--color-smooth-1000)] max-w-xs">
          {step.description}
        </p>

        {/* Bottom accent line */}
        <div
          data-line={index}
          className="mt-6 h-0.5 w-12 bg-[color:var(--color-smooth-200)] dark:bg-[color:var(--color-smooth-800)] transition-all duration-500 origin-left group-hover:w-20 group-hover:bg-[color:var(--color-brand)]"
        />
      </div>
    </div>
  );
}

// Mobile step
function MobileStep({ step, index }: { step: Step; index: number }) {
  const Icon = step.icon;

  return (
    <div data-mobile-step={index} className="relative pl-16">
      {/* Number */}
      <div className="absolute left-0 top-0">
        <span className="text-5xl font-bold text-[color:var(--color-smooth-400)] dark:text-[color:var(--color-smooth-800)]">
          {step.number}
        </span>
      </div>

      {/* Content */}
      <div className="pt-2">
        <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[color:var(--color-smooth-50)] dark:bg-[color:var(--color-smooth-900)] shadow-sm border border-[color:var(--color-smooth-300)] dark:border-[color:var(--color-smooth-700)]">
          <Icon className="h-4 w-4 text-[color:var(--color-smooth-600)] dark:text-[color:var(--color-smooth-400)]" />
        </div>

        <h3 className="text-base font-semibold text-[color:var(--color-smooth-900)] dark:text-[color:var(--color-smooth-1000)] mb-2">
          {step.title}
        </h3>

        <p className="text-sm leading-relaxed text-[color:var(--color-smooth-600)] dark:text-[color:var(--color-smooth-1000)]">
          {step.description}
        </p>
      </div>
    </div>
  );
}

export default function HowItWorksSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      // Header animation
      gsap.fromTo(
        "[data-header] > *",
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: "[data-header]",
            start: "top 85%",
            once: true,
          },
        }
      );

      if (!isMobile && containerRef.current) {
        const stepElements = gsap.utils.toArray<HTMLElement>("[data-step]");
        const numbers = gsap.utils.toArray<HTMLElement>("[data-number]");

        gsap.set(stepElements, { force3D: true });

        // Initial states
        gsap.set(stepElements, { opacity: 0, y: 40 });

        // Entrance animation
        stepElements.forEach((step, i) => {
          gsap.to(step, {
            opacity: 1,
            y: 0,
            duration: 0.6,
            delay: i * 0.15,
            ease: "power2.out",
            scrollTrigger: {
              trigger: containerRef.current,
              start: "top 70%",
              once: true,
            },
          });
        });

        // Scroll-based highlighting
        const rootStyles = window.getComputedStyle(document.documentElement);
        const activeColor =
          rootStyles.getPropertyValue("--color-brand")?.trim() ||
          "rgb(16, 185, 129)";
        const activeAccent =
          rootStyles.getPropertyValue("--color-brand-secondary")?.trim() ||
          "rgb(5, 150, 105)";
        const lineAccent =
          rootStyles.getPropertyValue("--color-smooth-200")?.trim() ||
          "rgb(229, 231, 235)";
        const shadowLine =
          rootStyles.getPropertyValue("--color-smooth-400")?.trim() ||
          "rgb(229, 231, 235)";
        const neutralText =
          rootStyles.getPropertyValue("--color-smooth-700")?.trim() ||
          "rgb(63, 63, 70)";
        const cardBackground =
          rootStyles.getPropertyValue("--color-smooth-50")?.trim() ||
          "rgb(255, 255, 255)";
        const cardBackgroundDark =
          rootStyles.getPropertyValue("--color-smooth-900")?.trim() ||
          "rgb(14, 18, 20)";
        const scrollLength = window.innerHeight * 2;
        const icons = gsap.utils.toArray<HTMLElement>("[data-icon]");
        const lines = gsap.utils.toArray<HTMLElement>("[data-line]");

        ScrollTrigger.create({
          trigger: containerRef.current,
          start: "top 25%",
          end: `+=${scrollLength}`,
          pin: true,
          scrub: 0.3,
          onUpdate: (self) => {
            const progress = self.progress;
            const stepProgress = progress * steps.length;
            const currentStep = Math.floor(stepProgress);

            setActiveIndex(
              progress < 0.02 ? -1 : Math.min(currentStep, steps.length - 1)
            );

            // Animate steps
            stepElements.forEach((step, i) => {
              const number = numbers[i];
              const icon = icons[i];
              const line = lines[i];

              if (i === currentStep && currentStep < steps.length) {
                gsap.to(step, { scale: 1.02, y: -5, duration: 0.3 });
                gsap.to(number.querySelector("span"), {
                  color: activeColor,
                  duration: 0.3,
                });
                gsap.to(icon, {
                  backgroundColor: activeAccent,
                  borderColor: activeColor,
                  duration: 0.3,
                });
                gsap.to(icon.querySelector("svg"), {
                  color: "white",
                  duration: 0.3,
                });
                gsap.to(line, {
                  width: "5rem",
                  backgroundColor: activeColor,
                  duration: 0.3,
                });
              } else if (i < currentStep) {
                gsap.to(step, { scale: 1, y: 0, opacity: 0.5, duration: 0.3 });
                gsap.to(number.querySelector("span"), {
                  color: neutralText,
                  duration: 0.3,
                });
                gsap.to(icon, {
                  backgroundColor: cardBackground,
                  borderColor: shadowLine,
                  duration: 0.3,
                });
                gsap.to(icon.querySelector("svg"), {
                  color: neutralText,
                  duration: 0.3,
                });
                gsap.to(line, {
                  width: "3rem",
                  backgroundColor: lineAccent,
                  duration: 0.3,
                });
              } else {
                gsap.to(step, { scale: 1, y: 0, opacity: 1, duration: 0.3 });
                gsap.to(number.querySelector("span"), {
                  color: neutralText,
                  duration: 0.3,
                });
                gsap.to(icon, {
                  backgroundColor: cardBackgroundDark,
                  borderColor: shadowLine,
                  duration: 0.3,
                });
                gsap.to(icon.querySelector("svg"), {
                  color: neutralText,
                  duration: 0.3,
                });
                gsap.to(line, {
                  width: "3rem",
                  backgroundColor: lineAccent,
                  duration: 0.3,
                });
              }
            });
          },
        });
      } else {
        // Mobile animations
        const mobileSteps =
          gsap.utils.toArray<HTMLElement>("[data-mobile-step]");

        gsap.set(mobileSteps, { opacity: 0, y: 20 });

        mobileSteps.forEach((step, i) => {
          gsap.to(step, {
            opacity: 1,
            y: 0,
            duration: 0.5,
            delay: i * 0.1,
            ease: "power2.out",
            scrollTrigger: {
              trigger: step,
              start: "top 85%",
              once: true,
            },
          });
        });
      }
    }, sectionRef);

    return () => ctx.revert();
  }, [isMobile]);

  return (
    <section
      ref={sectionRef}
      id="how-it-works"
      className="relative bg-white dark:bg-zinc-950 mt-4"
    >
      {/* Header */}
      <div className="container relative mx-auto px-6 sm:px-10 lg:px-16 xl:px-24 pt-24 lg:pt-32">
        <div data-header className="mb-20 lg:mb-28 text-center">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="h-px w-8 bg-emerald-500" />
              <span className="text-xs font-medium tracking-[0.15em] text-emerald-600 dark:text-emerald-400 uppercase">
                How it works
              </span>
              <div className="h-px w-8 bg-emerald-500" />
            </div>

            <h2 className="text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 lg:text-5xl mb-6">
              Start building in
              <span className="block text-zinc-400 dark:text-zinc-500">
                four simple steps
              </span>
            </h2>

            <p className="text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed">
              From initial concept to final deployment, our streamlined process
              keeps your team aligned and productive.
            </p>
          </div>
        </div>
      </div>

      {/* Desktop Grid */}
      {!isMobile && (
        <div
          ref={containerRef}
          className="hidden lg:block relative container mx-auto px-6 sm:px-10 lg:px-16 xl:px-24 pb-16"
        >
          <div className="grid grid-cols-4 gap-8 lg:gap-12">
            {steps.map((step, index) => (
              <DesktopStep key={step.number} step={step} index={index} />
            ))}
          </div>

          {/* Simple progress */}
          <div className="mt-20 flex items-center justify-center gap-3">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-1 w-8 rounded-full transition-all duration-500 ${
                  i <= activeIndex
                    ? "bg-emerald-500"
                    : "bg-zinc-200 dark:bg-zinc-800"
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Mobile */}
      {isMobile && (
        <div className="lg:hidden container relative mx-auto px-6 sm:px-10 pb-16">
          <div className="space-y-12 max-w-md mx-auto">
            {steps.map((step, index) => (
              <MobileStep key={step.number} step={step} index={index} />
            ))}
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="container relative mx-auto px-6 sm:px-10 lg:px-16 xl:px-24 py-16 lg:py-20 border-t border-zinc-100 dark:border-zinc-900">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 max-w-4xl mx-auto">
          <div>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
              Ready to get started?
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Join thousands of developers shipping better software.
            </p>
          </div>
          <Link
            href="/auth/signup"
            className="group inline-flex items-center gap-2 rounded-lg bg-zinc-900 dark:bg-white px-5 py-2.5 text-sm font-medium text-white dark:text-zinc-900 transition-all hover:bg-zinc-800 dark:hover:bg-zinc-100"
          >
            Start for free
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
