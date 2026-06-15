"use client";

import { useEffect, useRef } from "react";
import { ArrowRight, Github, Sparkles } from "lucide-react";
import { gsap } from "gsap";
import Link from "next/link";
import { Button } from "@/components/ui/button";

// Trusted company logos (simplified SVG paths or text)
const trustedCompanies = [
  { name: "GitHub", logo: "github" },
  { name: "Vercel", logo: "vercel" },
  { name: "Stripe", logo: "stripe" },
  { name: "Notion", logo: "notion" },
  { name: "Linear", logo: "linear" },
  { name: "Figma", logo: "figma" },
];

export function HeroGrid() {
  const heroRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!contentRef.current || hasAnimated.current) return;
    hasAnimated.current = true;

    const ctx = gsap.context(() => {
      const elements = contentRef.current?.querySelectorAll('[data-animate]');
      if (!elements) return;

      gsap.fromTo(
        elements,
        { opacity: 0, y: 40 },
        { 
          opacity: 1, 
          y: 0,
          duration: 1,
          stagger: 0.12,
          ease: "power3.out",
          clearProps: "all",
        }
      );
    }, heroRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={heroRef}
      id="home"
      className="relative min-h-screen overflow-hidden bg-white dark:bg-[#030712] flex flex-col justify-center transition-colors duration-300"
    >
      {/* Starfield / Dot Pattern - Light Mode */}
      <div className="absolute inset-0 overflow-hidden dark:hidden">
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at center, rgba(16, 185, 129, 0.05) 0%, transparent 70%), 
                             radial-gradient(1.5px 1.5px at 20px 30px, rgba(16, 185, 129, 0.25), transparent),
                             radial-gradient(1.5px 1.5px at 40px 70px, rgba(16, 185, 129, 0.18), transparent),
                             radial-gradient(1px 1px at 90px 40px, rgba(16, 185, 129, 0.2), transparent),
                             radial-gradient(1.5px 1.5px at 130px 80px, rgba(16, 185, 129, 0.15), transparent),
                             radial-gradient(1px 1px at 160px 120px, rgba(16, 185, 129, 0.22), transparent)`,
            backgroundSize: '200px 200px',
          }}
        />
      </div>

      {/* Starfield / Dot Pattern - Dark Mode */}
      <div className="absolute inset-0 overflow-hidden hidden dark:block">
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at center, rgba(16, 185, 129, 0.03) 0%, transparent 70%), 
                             radial-gradient(1.5px 1.5px at 20px 30px, rgba(255,255,255,0.15), transparent),
                             radial-gradient(1.5px 1.5px at 40px 70px, rgba(255,255,255,0.1), transparent),
                             radial-gradient(1px 1px at 90px 40px, rgba(255,255,255,0.12), transparent),
                             radial-gradient(1.5px 1.5px at 130px 80px, rgba(255,255,255,0.08), transparent),
                             radial-gradient(1px 1px at 160px 120px, rgba(255,255,255,0.15), transparent)`,
            backgroundSize: '200px 200px',
          }}
        />
      </div>

      {/* Main Glow Orb - Center */}
      <div className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/30 via-emerald-500/10 to-transparent dark:from-emerald-500/20 dark:via-emerald-500/5 blur-[120px] rounded-full" />
        <div className="absolute inset-[20%] bg-gradient-to-b from-teal-400/25 via-cyan-500/10 to-transparent dark:from-teal-400/15 dark:via-cyan-500/5 blur-[80px] rounded-full" />
      </div>

      {/* Secondary Glow - Left */}
      <div className="absolute left-0 top-1/2 -translate-x-1/2 w-[400px] h-[400px] pointer-events-none">
        <div className="absolute inset-0 bg-emerald-600/20 dark:bg-emerald-600/10 blur-[100px] rounded-full" />
      </div>

      {/* Secondary Glow - Right */}
      <div className="absolute right-0 bottom-1/4 translate-x-1/3 w-[350px] h-[350px] pointer-events-none">
        <div className="absolute inset-0 bg-teal-500/20 dark:bg-teal-500/10 blur-[100px] rounded-full" />
      </div>

      {/* Grid Pattern Overlay */}
      <div 
        className="absolute inset-0 opacity-[0.05] dark:opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(16, 185, 129, 0.5) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(16, 185, 129, 0.5) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Bottom Gradient Wave */}
      <div className="absolute bottom-0 left-0 right-0 h-48 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-t from-emerald-600/30 via-emerald-500/10 to-transparent dark:from-emerald-600/20 dark:via-emerald-500/5" />
        <svg 
          className="absolute bottom-0 w-full h-24 text-emerald-500/30 dark:text-emerald-500/20"
          viewBox="0 0 1440 120" 
          fill="none" 
          preserveAspectRatio="none"
        >
          <path 
            d="M0,60 C360,120 720,0 1080,60 C1260,90 1380,80 1440,60 L1440,120 L0,120 Z" 
            fill="currentColor"
          />
        </svg>
      </div>

      {/* Main Content */}
      <div 
        ref={contentRef}
        className="relative z-10 mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8 pt-32 pb-24"
      >
        {/* Announcement Badge */}
        <div data-animate className="mb-8 flex justify-center">
          <Link 
            href="#features"
            className="group inline-flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-5 py-2 text-sm font-medium text-emerald-600 dark:text-emerald-400 backdrop-blur-sm transition-all duration-300 hover:bg-emerald-500/15 hover:border-emerald-500/30"
          >
            <Sparkles className="h-4 w-4" />
            <span>GitLance Platform is live</span>
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
          </Link>
        </div>

        {/* Main Heading */}
        <h1
          data-animate
          className="font-heading mb-6 text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl text-gray-900 dark:text-white"
        >
          <span className="block">The Developer</span>
          <span className="block bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 dark:from-emerald-400 dark:via-teal-400 dark:to-cyan-400 bg-clip-text text-transparent">
            Collaboration Platform
          </span>
        </h1>

        {/* Subheading */}
        <p
          data-animate
          className="mx-auto mb-10 max-w-2xl text-lg text-gray-600 dark:text-gray-400 sm:text-xl leading-relaxed"
        >
          Connect with developers, form project teams, and collaborate seamlessly 
          through GitHub-integrated repositories. Build. Ship. Together.
        </p>

        {/* CTA Buttons */}
        <div data-animate className="flex flex-wrap justify-center gap-4 mb-16">
          <Button
            size="lg"
            className="group bg-emerald-500 hover:bg-emerald-600 dark:hover:bg-emerald-400 text-white dark:text-black font-semibold px-8 py-6 text-base rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/25"
            asChild
          >
            <Link href="/auth/signup" className="flex items-center gap-2">
              Get Started
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
            </Link>
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="group border border-gray-300 dark:border-gray-700 bg-white/50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 text-gray-900 dark:text-white font-semibold px-8 py-6 text-base rounded-xl backdrop-blur-sm transition-all duration-300 hover:border-gray-400 dark:hover:border-gray-600"
            asChild
          >
            <Link href="/explore" className="flex items-center gap-2">
              <Github className="h-4 w-4" />
              Explore Projects
            </Link>
          </Button>
        </div>

        {/* Stats Row */}
        <div data-animate className="flex flex-wrap justify-center gap-8 lg:gap-12 mb-20">
          <div className="text-center">
            <div className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-1">1K+</div>
            <div className="text-sm text-gray-500">Developers</div>
          </div>
          <div className="h-12 w-px bg-gray-200 dark:bg-gray-800 hidden sm:block" />
          <div className="text-center">
            <div className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-1">500+</div>
            <div className="text-sm text-gray-500">Projects</div>
          </div>
          <div className="h-12 w-px bg-gray-200 dark:bg-gray-800 hidden sm:block" />
          <div className="text-center">
            <div className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-1">$100K+</div>
            <div className="text-sm text-gray-500">Earned</div>
          </div>
        </div>

        {/* Trusted By Section */}
        <div data-animate className="border-t border-gray-200 dark:border-gray-800/50 pt-12">
          <p className="text-sm text-gray-500 mb-8 uppercase tracking-wider font-medium">
            Trusted by developers at
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8 lg:gap-12 opacity-70 dark:opacity-60">
            {trustedCompanies.map((company) => (
              <div 
                key={company.name}
                className="text-gray-500 dark:text-gray-400 font-semibold text-lg tracking-wide hover:text-gray-700 dark:hover:text-gray-300 transition-colors duration-300"
              >
                {company.name}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Vignette Effect - Light Mode */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,white_70%)] pointer-events-none dark:hidden" />
      
      {/* Vignette Effect - Dark Mode */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,#030712_70%)] pointer-events-none hidden dark:block" />
    </section>
  );
}

export default HeroGrid;
