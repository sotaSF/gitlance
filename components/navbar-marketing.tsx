"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Menu,
  X,
  Code2,
  Sparkles,
  Rocket,
  Github,
  Star,
  ChevronRight,
  User as UserIcon,
} from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "@supabase/supabase-js";

interface NavbarProps {
  user?: User | null;
  profile?: {
    display_name: string | null;
    avatar_url: string | null;
    username: string | null;
  } | null;
}

export function Navbar({ user, profile }: NavbarProps = {}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("home");

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);

      // Track active section
      const sections = ["features", "how-it-works", "about", "faq", "contact"];
      const scrollPosition = window.scrollY + 100;

      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (
            scrollPosition >= offsetTop &&
            scrollPosition < offsetTop + offsetHeight
          ) {
            setActiveSection(section);
            return;
          }
        }
      }

      if (window.scrollY < 100) {
        setActiveSection("home");
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSmoothScroll = (
    e: React.MouseEvent<HTMLAnchorElement>,
    id: string
  ) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      setMobileMenuOpen(false);
    }
  };

  const isActive = (section: string) => activeSection === section;

  const navItems = [
    { href: "/", label: "Home", section: "home", icon: Sparkles },
    { href: "#features", label: "Features", section: "features", icon: Star },
    {
      href: "#how-it-works",
      label: "How It Works",
      section: "how-it-works",
      icon: Github,
    },
    { href: "#about", label: "About", section: "about", icon: Code2 },
    { href: "#faq", label: "FAQ", section: "faq", icon: Sparkles },
    { href: "#contact", label: "Contact", section: "contact", icon: Rocket },
  ];

  return (
    <header
      className={cn(
        "fixed inset-x-0 z-50 transition-[top] duration-500 ease-in-out",
        scrolled ? "top-4" : "top-0"
      )}
    >
      <div
        className={cn(
          "mx-auto flex w-full items-center justify-between px-4 transition-all duration-500 ease-in-out",
          scrolled
            ? "h-14 max-w-5xl rounded-full border border-emerald-500/20 bg-background/90 shadow-lg shadow-emerald-500/10 backdrop-blur-xl"
            : "h-20 max-w-6xl border-b border-transparent bg-background/0"
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="flex items-center space-x-2 group"
            onClick={(e) => handleSmoothScroll(e, "home")}
          >
            <span
              className={cn(
                "font-bold text-emerald-600 transition-all duration-300 dark:text-emerald-400",
                scrolled ? "text-lg" : "text-xl"
              )}
            >
              GitLance
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-1 lg:flex">
            {navItems.map((item) => (
              <Link
                key={item.section}
                href={item.href}
                onClick={(e) => handleSmoothScroll(e, item.section)}
                className={cn(
                  "relative px-4 py-2 text-sm font-medium transition-colors duration-300 rounded-full hover:bg-emerald-500/5",
                  isActive(item.section)
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400"
                )}
              >
                {item.label}
                {isActive(item.section) && (
                  <motion.span
                    layoutId="activeSection"
                    className="absolute inset-0 bg-emerald-500/10 rounded-full -z-10"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </Link>
            ))}
          </nav>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              {/* Authenticated User - Show Avatar */}
              <div className="hidden items-center gap-2 md:flex">
                <Button
                  asChild
                  variant="outline"
                  className="hover:bg-emerald-500/10 hover:border-emerald-500/50 hover:text-emerald-600 transition-all duration-300"
                >
                  <Link href="/explore">Explore Projects</Link>
                </Button>
                <Link href={`/profile/${profile?.username || user.id}`}>
                  <Avatar className="h-9 w-9 border-2 border-emerald-500/20 hover:border-emerald-500/50 transition-all duration-300 cursor-pointer">
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback className="bg-gradient-to-br from-emerald-600 to-emerald-500 text-white text-sm">
                      {profile?.display_name?.substring(0, 2).toUpperCase() ||
                        user.email?.substring(0, 2).toUpperCase() ||
                        "U"}
                    </AvatarFallback>
                  </Avatar>
                </Link>
              </div>
            </>
          ) : (
            <>
              {/* Guest User - Show Login/Signup */}
              <div className="hidden items-center gap-2 md:flex">
                <Button
                  variant="ghost"
                  asChild
                  className="hover:bg-emerald-500/10 hover:text-emerald-600 transition-all duration-300"
                >
                  <Link href="/auth/sign-in">Login</Link>
                </Button>
                <Button
                  asChild
                  className="group rounded-full border border-emerald-500/20 bg-emerald-600 px-6 text-white shadow-lg transition-all duration-300 hover:bg-emerald-500 hover:shadow-xl"
                >
                  <Link href="/auth/signup" className="flex items-center gap-2">
                    <span>Get Started</span>
                    <ChevronRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </Link>
                </Button>
              </div>
            </>
          )}

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden hover:bg-emerald-500/10 transition-all duration-300"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <div
              className="transition-transform duration-300"
              style={{ transform: mobileMenuOpen ? "rotate(90deg)" : "none" }}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </div>
            <span className="sr-only">Toggle menu</span>
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden overflow-hidden border-t border-emerald-500/20 bg-background/95 backdrop-blur-xl"
          >
            <nav className="container flex flex-col gap-2 py-6">
              {navItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={item.section}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link
                      href={item.href}
                      onClick={(e) => handleSmoothScroll(e, item.section)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300",
                        isActive(item.section)
                          ? "bg-emerald-500/10 text-emerald-600"
                          : "text-muted-foreground hover:bg-emerald-500/5 hover:text-emerald-600"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                      {isActive(item.section) && (
                        <motion.div
                          layoutId="activeMobile"
                          className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500"
                        />
                      )}
                    </Link>
                  </motion.div>
                );
              })}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex flex-col gap-3 pt-6 mt-2 border-t border-emerald-500/10"
              >
                {user ? (
                  <>
                    <Button
                      variant="ghost"
                      asChild
                      className="h-12 w-full justify-start rounded-xl hover:bg-emerald-500/10"
                    >
                      <Link href="/explore">
                        <Sparkles className="mr-2 h-4 w-4" />
                        Explore Projects
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      asChild
                      className="h-12 w-full justify-start rounded-xl hover:bg-emerald-500/10"
                    >
                      <Link href={`/profile/${profile?.username || user.id}`}>
                        <UserIcon className="mr-2 h-4 w-4" />
                        My Profile
                      </Link>
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="ghost"
                      asChild
                      className="h-12 w-full justify-start rounded-xl hover:bg-emerald-500/10"
                    >
                      <Link href="/auth/sign-in">Login</Link>
                    </Button>
                    <Button
                      asChild
                      className="h-12 w-full rounded-xl bg-emerald-600 text-white shadow-lg transition-all duration-300 hover:bg-emerald-500"
                    >
                      <Link
                        href="/auth/signup"
                        className="flex items-center justify-center gap-2"
                      >
                        <Rocket className="h-4 w-4" />
                        Get Started
                      </Link>
                    </Button>
                  </>
                )}
              </motion.div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
