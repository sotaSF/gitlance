// "use client";

// import { useRef, useEffect } from "react";
// import { Code2, Briefcase, CheckCircle, ArrowRight, Sparkles } from "lucide-react";
// import { gsap } from "gsap";
// import { ScrollTrigger } from "gsap/ScrollTrigger";
// import { Button } from "@/components/ui/button";
// import Link from "next/link";

// gsap.registerPlugin(ScrollTrigger);

// const developerBenefits = [
//   { text: "Join verified GitHub-linked projects", highlight: "GitHub-linked" },
//   { text: "Build your public portfolio from real collaboration", highlight: "public portfolio" },
//   { text: "Network with professionals across tech stacks", highlight: "Network" },
//   { text: "Earn while contributing to meaningful projects", highlight: "Earn" },
// ];

// const clientBenefits = [
//   { text: "Post projects and invite contributors securely", highlight: "securely" },
//   { text: "Manage repositories and communication in one place", highlight: "one place" },
//   { text: "Track progress through integrated GitHub analytics", highlight: "GitHub analytics" },
//   { text: "Access a pool of verified developers", highlight: "verified developers" },
// ];

// export default function DevelopersClientsSection() {
//   const sectionRef = useRef<HTMLElement>(null);
//   const hasAnimated = useRef(false);

//   useEffect(() => {
//     if (!sectionRef.current || hasAnimated.current) return;
//     hasAnimated.current = true;

//     const ctx = gsap.context(() => {
//       gsap.fromTo(
//         '[data-animate-header] > *',
//         { opacity: 0, y: 30 },
//         {
//           opacity: 1,
//           y: 0,
//           duration: 0.6,
//           stagger: 0.1,
//           ease: "power2.out",
//           scrollTrigger: {
//             trigger: '[data-animate-header]',
//             start: "top 85%",
//             once: true,
//           },
//         }
//       );

//       gsap.fromTo(
//         '[data-animate-card]',
//         { opacity: 0, y: 50, scale: 0.98 },
//         {
//           opacity: 1,
//           y: 0,
//           scale: 1,
//           duration: 0.7,
//           stagger: 0.15,
//           ease: "power2.out",
//           scrollTrigger: {
//             trigger: '[data-animate-cards]',
//             start: "top 80%",
//             once: true,
//           },
//           clearProps: "all",
//         }
//       );
//     }, sectionRef);

//     return () => ctx.revert();
//   }, []);

//   return (
//     <section ref={sectionRef} className="relative overflow-hidden py-24 md:py-32">
//       {/* Background */}
//       <div className="absolute inset-0 bg-gradient-to-b from-background via-slate-50/30 to-background dark:via-slate-950/20" />

//       {/* Floating orbs - CSS only */}
//       <div className="absolute left-[-5%] top-1/4 h-72 w-72 rounded-full bg-emerald-400/8 blur-[80px] animate-float-slow" />
//       <div className="absolute right-[-5%] bottom-1/4 h-72 w-72 rounded-full bg-cyan-400/8 blur-[80px] animate-float-slow" style={{ animationDelay: "3s" }} />

//       <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
//         {/* Header - all text rendered for SEO */}
//         <div data-animate-header className="mb-16 text-center">
//           <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-5 py-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
//             <Sparkles className="h-4 w-4" />
//             For Everyone
//           </div>
          
//           <h2 className="font-heading mb-6 text-4xl font-bold tracking-tight lg:text-5xl">
//             <span className="text-foreground">Built for </span>
//             <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Developers</span>
//             <span className="text-foreground"> & </span>
//             <span className="bg-gradient-to-r from-cyan-500 to-teal-500 bg-clip-text text-transparent">Clients</span>
//           </h2>
          
//           <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
//             Whether you're building your career or building your product, GitLance has you covered.
//           </p>
//         </div>

//         {/* Cards Grid */}
//         <div data-animate-cards className="grid gap-8 lg:grid-cols-2 lg:gap-10">
//           {/* For Developers */}
//           <div data-animate-card className="group">
//             <div className="relative h-full overflow-hidden rounded-3xl bg-white/70 dark:bg-black/40 backdrop-blur-sm border border-white/20 dark:border-white/5 shadow-lg transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/10 hover:border-emerald-500/30 hover:-translate-y-1">
//               {/* Top accent */}
//               <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500" />

//               <div className="relative z-10 p-8 lg:p-10">
//                 {/* Icon */}
//                 <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/20 transition-transform duration-300 group-hover:scale-110">
//                   <Code2 className="h-8 w-8 text-white" />
//                 </div>

//                 {/* Title */}
//                 <h3 className="font-heading text-2xl lg:text-3xl font-bold text-foreground mb-3">
//                   For Developers
//                 </h3>
//                 <p className="text-muted-foreground text-lg mb-8">
//                   Unlock new opportunities and accelerate your career
//                 </p>

//                 {/* Benefits - all text rendered for SEO */}
//                 <ul className="space-y-4 mb-8">
//                   {developerBenefits.map((benefit) => (
//                     <li
//                       key={benefit.text}
//                       className="flex items-start gap-3"
//                     >
//                       <div className="mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-500">
//                         <CheckCircle className="h-3 w-3 text-white" />
//                       </div>
//                       <span className="text-muted-foreground leading-relaxed">
//                         {benefit.text.split(benefit.highlight).map((part, i, arr) => (
//                           <span key={i}>
//                             {part}
//                             {i < arr.length - 1 && (
//                               <span className="font-semibold text-foreground">{benefit.highlight}</span>
//                             )}
//                           </span>
//                         ))}
//                       </span>
//                     </li>
//                   ))}
//                 </ul>

//                 {/* CTA */}
//                 <Button
//                   size="lg"
//                   className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/20 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/40 hover:scale-[1.02] rounded-xl py-6 text-base font-semibold group/btn"
//                   asChild
//                 >
//                   <Link href="/auth/signup?role=developer" className="flex items-center justify-center gap-2">
//                     Join as Developer
//                     <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
//                   </Link>
//                 </Button>
//               </div>
//             </div>
//           </div>

//           {/* For Clients */}
//           <div data-animate-card className="group">
//             <div className="relative h-full overflow-hidden rounded-3xl bg-white/70 dark:bg-black/40 backdrop-blur-sm border border-white/20 dark:border-white/5 shadow-lg transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/10 hover:border-cyan-500/30 hover:-translate-y-1">
//               {/* Top accent */}
//               <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-teal-500 to-cyan-500" />

//               <div className="relative z-10 p-8 lg:p-10">
//                 {/* Icon */}
//                 <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-500 shadow-lg shadow-cyan-500/20 transition-transform duration-300 group-hover:scale-110">
//                   <Briefcase className="h-8 w-8 text-white" />
//                 </div>

//                 {/* Title */}
//                 <h3 className="font-heading text-2xl lg:text-3xl font-bold text-foreground mb-3">
//                   For Clients
//                 </h3>
//                 <p className="text-muted-foreground text-lg mb-8">
//                   Find the perfect talent for your projects
//                 </p>

//                 {/* Benefits - all text rendered for SEO */}
//                 <ul className="space-y-4 mb-8">
//                   {clientBenefits.map((benefit) => (
//                     <li
//                       key={benefit.text}
//                       className="flex items-start gap-3"
//                     >
//                       <div className="mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-teal-500">
//                         <CheckCircle className="h-3 w-3 text-white" />
//                       </div>
//                       <span className="text-muted-foreground leading-relaxed">
//                         {benefit.text.split(benefit.highlight).map((part, i, arr) => (
//                           <span key={i}>
//                             {part}
//                             {i < arr.length - 1 && (
//                               <span className="font-semibold text-foreground">{benefit.highlight}</span>
//                             )}
//                           </span>
//                         ))}
//                       </span>
//                     </li>
//                   ))}
//                 </ul>

//                 {/* CTA */}
//                 <Button
//                   size="lg"
//                   variant="outline"
//                   className="w-full border-2 border-cyan-500/30 bg-white/50 dark:bg-black/30 transition-all duration-300 hover:border-cyan-500 hover:bg-cyan-50 dark:hover:bg-cyan-950/50 hover:scale-[1.02] rounded-xl py-6 text-base font-semibold text-cyan-700 dark:text-cyan-300 group/btn"
//                   asChild
//                 >
//                   <Link href="/auth/signup?role=client" className="flex items-center justify-center gap-2">
//                     Post a Project
//                     <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
//                   </Link>
//                 </Button>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Bottom decoration */}
//       <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-64 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
//     </section>
//   );
// }
