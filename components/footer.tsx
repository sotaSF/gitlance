"use client";

import { useRef, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Github, Twitter, Linkedin, Code2, Send } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function Footer() {
    const currentYear = new Date().getFullYear();
    const footerRef = useRef<HTMLElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const bottomBarRef = useRef<HTMLDivElement>(null);
    const hasAnimated = useRef(false);

    useEffect(() => {
        if (!footerRef.current || hasAnimated.current) return;
        hasAnimated.current = true;

        const ctx = gsap.context(() => {
            // Animate container
            if (containerRef.current) {
                gsap.fromTo(
                    containerRef.current.children,
                    {
                        opacity: 0,
                        y: 20,
                    },
                    {
                        opacity: 1,
                        y: 0,
                        duration: 0.6,
                        stagger: 0.1,
                        ease: "power2.out",
                        scrollTrigger: {
                            trigger: containerRef.current,
                            start: "top 85%",
                            once: true,
                        },
                    }
                );
            }

            // Animate bottom bar
            if (bottomBarRef.current) {
                gsap.fromTo(
                    bottomBarRef.current,
                    {
                        opacity: 0,
                        y: 20,
                    },
                    {
                        opacity: 1,
                        y: 0,
                        duration: 0.6,
                        ease: "power2.out",
                        scrollTrigger: {
                            trigger: bottomBarRef.current,
                            start: "top 90%",
                            once: true,
                        },
                    }
                );
            }
        }, footerRef);

        return () => ctx.revert();
    }, []);

    return (
        <footer ref={footerRef} className="relative border-t border-emerald-500/10 bg-background pt-16 pb-8 overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl" />
            </div>

            <div className="container px-4 md:px-6">
                <div
                    ref={containerRef}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12"
                >
                    {/* Brand Column */}
                    <div className="space-y-4">
                        <Link href="/" className="flex items-center space-x-2 group">
                            <span className="text-2xl font-bold bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 bg-clip-text text-transparent">
                                GitLance
                            </span>
                        </Link>
                        <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">
                            Connecting developers with open source opportunities. Build your portfolio, contribute to meaningful projects, and grow your career.
                        </p>
                        <div className="flex items-center gap-4 pt-2">
                            {[
                                { icon: Github, href: "https://github.com/Faizan-26/gitlance", label: "GitHub" },
                                { icon: Twitter, href: "#", label: "Twitter" },
                                { icon: Linkedin, href: "#", label: "LinkedIn" },
                            ].map((social) => (
                                <a
                                    key={social.label}
                                    href={social.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 rounded-lg bg-emerald-500/5 text-emerald-600 hover:bg-emerald-500/10 hover:scale-110 transition-all duration-300"
                                    aria-label={social.label}
                                >
                                    <social.icon className="h-4 w-4" />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Links Columns */}
                    <div>
                        <h3 className="font-semibold text-foreground mb-6">Platform</h3>
                        <ul className="space-y-3 text-sm">
                            {["Find Projects", "For Maintainers", "Success Stories", "Pricing", "Enterprise"].map((item) => (
                                <li key={item}>
                                    <Link href="#" className="text-muted-foreground hover:text-emerald-600 transition-colors flex items-center gap-2 group">
                                        <span className="w-1 h-1 rounded-full bg-emerald-500/0 group-hover:bg-emerald-500 transition-colors" />
                                        {item}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-semibold text-foreground mb-6">Resources</h3>
                        <ul className="space-y-3 text-sm">
                            {["Documentation", "API Reference", "Blog", "Community", "Help Center"].map((item) => (
                                <li key={item}>
                                    <Link href="#" className="text-muted-foreground hover:text-emerald-600 transition-colors flex items-center gap-2 group">
                                        <span className="w-1 h-1 rounded-full bg-emerald-500/0 group-hover:bg-emerald-500 transition-colors" />
                                        {item}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Newsletter Column */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-foreground mb-2">Stay Updated</h3>
                        <p className="text-sm text-muted-foreground">
                            Subscribe to our newsletter for the latest open source trends and platform updates.
                        </p>
                        <form className="space-y-2" onSubmit={(e) => e.preventDefault()}>
                            <div className="relative">
                                <Input
                                    type="email"
                                    placeholder="Enter your email"
                                    className="pr-10 bg-background border-emerald-500/20 focus-visible:ring-emerald-500/50 transition-all"
                                />
                                <Button
                                    size="icon"
                                    type="submit"
                                    className="absolute right-0 top-0 h-full aspect-square rounded-l-none bg-emerald-500 hover:bg-emerald-600 text-white transition-colors"
                                >
                                    <Send className="h-4 w-4" />
                                    <span className="sr-only">Subscribe</span>
                                </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                We respect your privacy. Unsubscribe at any time.
                            </p>
                        </form>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div
                    ref={bottomBarRef}
                    className="pt-8 border-t border-emerald-500/10 flex flex-col md:flex-row justify-between items-center gap-4"
                >
                    <p className="text-sm text-muted-foreground text-center md:text-left">
                        © {currentYear} GitLance. All rights reserved.
                    </p>

                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                        <Link href="/privacy-policy" className="hover:text-emerald-600 transition-colors">Privacy Policy</Link>
                        <Link href="/term-of-services" className="hover:text-emerald-600 transition-colors">Terms of Service</Link>
                        <Link href="/cookies-settings" className="hover:text-emerald-600 transition-colors">Cookie Settings</Link>
                    </div>

                </div>
            </div>
        </footer>
    );
}
