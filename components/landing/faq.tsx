"use client";

import { useState, useRef, useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  GitBranch,
  Github,
  Users,
  Zap,
  ShieldCheck,
  CreditCard,
  Plus,
  Minus,
  HelpCircle,
} from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

const faqs = [
  {
    question: "What is GitLance?",
    answer:
      "GitLance is a GitHub-integrated collaboration and freelancing platform that connects developers and clients to work on real-world software projects. It allows you to form teams and collaborate seamlessly through one unified workspace.",
    icon: GitBranch,
    gradient: "from-emerald-500 to-teal-500",
  },
  {
    question: "How does GitLance integrate with GitHub?",
    answer:
      "GitLance securely connects with GitHub repositories to manage commits, issues, and pull requests in real time. Developers can sync, view project progress, track contributions, and collaborate without leaving the GitLance environment.",
    icon: Github,
    gradient: "from-teal-500 to-cyan-500",
  },
  {
    question: "Can I use GitLance as both a developer and a client?",
    answer:
      "Yes, GitLance supports dual roles. You can post projects as a client or join existing ones as a developer. The platform provides transparent access control and tools suited for both roles.",
    icon: Users,
    gradient: "from-cyan-500 to-emerald-500",
  },
  {
    question: "What makes GitLance different from others?",
    answer:
      "Unlike traditional freelancing sites, GitLance focuses on collaborative development using GitHub integration. It's built specifically for software teams, providing version control, task management, and team collaboration all in one place.",
    icon: Zap,
    gradient: "from-emerald-600 to-green-500",
  },
  {
    question: "Is my project data and repository secure?",
    answer:
      "Absolutely. GitLance uses secure OAuth-based GitHub authorization and encrypted data channels. Only approved collaborators can access your project repositories, ensuring complete privacy and code safety.",
    icon: ShieldCheck,
    gradient: "from-green-500 to-teal-500",
  },
  {
    question: "Do I need to pay to start using GitLance?",
    answer:
      "GitLance provides free access to core features like project creation and team collaboration. Advanced features and integrations may later include premium options as the platform scales.",
    icon: CreditCard,
    gradient: "from-teal-500 to-emerald-500",
  },
];

function FAQItem({ 
  faq, 
  index, 
  isActive, 
  onClick 
}: { 
  faq: typeof faqs[0]; 
  index: number;
  isActive: boolean;
  onClick: () => void;
}) {
  const Icon = faq.icon;
  
  return (
    <div
      onClick={onClick}
      className={`
        group relative rounded-2xl overflow-hidden cursor-pointer
        transition-all duration-300
        ${isActive 
          ? "bg-white/90 dark:bg-slate-900/90 border-emerald-500/30 shadow-lg shadow-emerald-500/5" 
          : "bg-white/60 dark:bg-slate-900/40 border-white/20 dark:border-white/5 hover:bg-white/80 dark:hover:bg-slate-900/60"
        }
        backdrop-blur-sm border
      `}
    >
      {/* Top accent line when active */}
      <div className={`
        absolute top-0 left-0 right-0 h-0.5
        bg-gradient-to-r ${faq.gradient}
        transform origin-left transition-transform duration-300
        ${isActive ? "scale-x-100" : "scale-x-0"}
      `} />

      <div className="p-6">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div
            className={`
              flex-shrink-0 p-3 rounded-xl
              transition-all duration-300
              ${isActive 
                ? `bg-gradient-to-br ${faq.gradient} text-white shadow-md` 
                : "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-200 dark:group-hover:bg-emerald-900/50"
              }
            `}
          >
            <Icon className="w-5 h-5" />
          </div>

          <div className="flex-1 min-w-0">
            {/* Question - always rendered for SEO */}
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-base font-semibold text-foreground pr-4">
                {faq.question}
              </h3>
              <div
                className={`
                  flex-shrink-0 p-1 rounded-lg
                  transition-colors duration-300
                  ${isActive ? "text-emerald-500" : "text-muted-foreground"}
                `}
              >
                {isActive ? (
                  <Minus className="w-4 h-4" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
              </div>
            </div>

            {/* Answer - always in DOM for SEO, just visually hidden */}
            <div 
              className={`
                overflow-hidden transition-all duration-300 ease-out
                ${isActive ? "max-h-40 opacity-100 mt-3" : "max-h-0 opacity-0"}
              `}
            >
              <p className="text-muted-foreground text-sm leading-relaxed">
                {faq.answer}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FAQSection() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!sectionRef.current || hasAnimated.current) return;
    hasAnimated.current = true;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        '[data-animate-header] > *',
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: '[data-animate-header]',
            start: "top 85%",
            once: true,
          },
        }
      );

      gsap.fromTo(
        '[data-animate-item]',
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          stagger: 0.08,
          ease: "power2.out",
          scrollTrigger: {
            trigger: '[data-animate-list]',
            start: "top 80%",
            once: true,
          },
          clearProps: "all",
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const leftColumn = faqs.filter((_, index) => index % 2 === 0);
  const rightColumn = faqs.filter((_, index) => index % 2 === 1);

  return (
    <section ref={sectionRef} id="faq" className="py-24 md:py-32 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-50/50 via-background to-slate-50/50 dark:from-slate-950/30 dark:via-background dark:to-slate-950/30" />
      </div>

      {/* Floating orbs - CSS only */}
      <div className="absolute -top-[10%] -left-[5%] w-[40%] h-[40%] bg-emerald-400/5 rounded-full blur-[80px]" />
      <div className="absolute -bottom-[10%] -right-[5%] w-[40%] h-[40%] bg-cyan-400/5 rounded-full blur-[80px]" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Header - all text rendered for SEO */}
        <div data-animate-header className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 mb-6 px-5 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm font-semibold">
            <HelpCircle className="w-4 h-4" />
            Common Questions
          </div>
          
          <h2 className="font-heading text-4xl md:text-5xl font-bold mb-6">
            <span className="text-foreground">Everything You </span>
            <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Need to Know</span>
          </h2>
          
          <p className="text-lg text-muted-foreground">
            Get answers to the most common questions about GitLance's features,
            security, and pricing.
          </p>
        </div>

        {/* FAQ Grid */}
        <div data-animate-list className="flex flex-col md:flex-row gap-5 max-w-5xl mx-auto">
          {/* Left Column */}
          <div className="flex flex-col gap-4 w-full md:w-1/2">
            {leftColumn.map((faq, filteredIndex) => {
              const originalIndex = filteredIndex * 2;
              return (
                <div key={originalIndex} data-animate-item>
                  <FAQItem
                    faq={faq}
                    index={originalIndex}
                    isActive={activeIndex === originalIndex}
                    onClick={() => setActiveIndex(activeIndex === originalIndex ? null : originalIndex)}
                  />
                </div>
              );
            })}
          </div>

          {/* Right Column */}
          <div className="flex flex-col gap-4 w-full md:w-1/2 md:mt-8">
            {rightColumn.map((faq, filteredIndex) => {
              const originalIndex = filteredIndex * 2 + 1;
              return (
                <div key={originalIndex} data-animate-item>
                  <FAQItem
                    faq={faq}
                    index={originalIndex}
                    isActive={activeIndex === originalIndex}
                    onClick={() => setActiveIndex(activeIndex === originalIndex ? null : originalIndex)}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <p className="text-muted-foreground mb-4">
            Still have questions?
          </p>
          <a
            href="#contact"
            className="inline-flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold hover:underline underline-offset-4 transition-colors"
          >
            Contact our team
            <span className="text-lg">→</span>
          </a>
        </div>
      </div>

      {/* Bottom decoration */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-64 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
    </section>
  );
}
