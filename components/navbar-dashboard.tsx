"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Menu,
  X,
  Compass,
  FolderKanban,
  Plus,
  User,
  Settings,
  LogOut,
  Search,
  Briefcase,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { Input } from "@/components/ui/input";
import { signOutAction } from "@/app/auth/actions";

interface DashboardNavbarProps {
  user?: SupabaseUser | null;
  profile?: {
    display_name: string | null;
    avatar_url: string | null;
    username: string | null;
  } | null;
}

export function DashboardNavbar({ user, profile }: DashboardNavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const pathname = usePathname();
  const router = useRouter();

  // All hooks must be called before any conditional returns
  useEffect(() => {
    if (isSearchExpanded && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchExpanded]);

  // Hide navbar when user is in workspace
  const isInWorkspace =
    pathname.startsWith("/workspace/") && !pathname.includes("/create/");

  if (isInWorkspace) {
    return null;
  }

  const isActive = (href: string) => {
    if (href === "/explore") {
      return pathname === "/explore" || pathname === "/";
    }
    return pathname.startsWith(href);
  };

  const navItems = [
    { href: "/explore", label: "Explore", icon: Compass },
    { href: "/project", label: "My Projects", icon: FolderKanban },
    { href: "/workspaces", label: "Workspaces", icon: Briefcase },
  ];

  const displayName =
    profile?.display_name || user?.email?.split("@")[0] || "User";
  const avatarUrl = profile?.avatar_url;
  const avatarFallback = displayName.substring(0, 2).toUpperCase();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
      setIsSearchExpanded(false);
      setSearchQuery("");
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <div className="flex items-center gap-8">
          <Link href="/explore" className="flex items-center space-x-2 group">
            <span className="font-bold text-xl text-emerald-600 transition-all duration-300 dark:text-emerald-400 group-hover:scale-105">
              GitLance
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors duration-300 rounded-lg hover:bg-emerald-500/10",
                    isActive(item.href)
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                  {isActive(item.href) && (
                    <motion.span
                      layoutId="activeTab"
                      className="absolute inset-0 bg-emerald-500/10 rounded-lg -z-10"
                      transition={{
                        type: "spring",
                        stiffness: 380,
                        damping: 30,
                      }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-3">
          {/* Expandable Search */}
          <div
            className="hidden md:flex items-center relative"
            onMouseEnter={() => setIsSearchExpanded(true)}
            onMouseLeave={() => {
              if (!searchQuery) setIsSearchExpanded(false);
            }}
          >
            <form
              onSubmit={handleSearchSubmit}
              className="relative flex items-center"
            >
              <motion.div
                initial={{ width: "40px" }}
                animate={{
                  width: isSearchExpanded || searchQuery ? "240px" : "40px",
                }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className={cn(
                  "flex items-center overflow-hidden rounded-full border transition-colors duration-300",
                  isSearchExpanded || searchQuery
                    ? "border-emerald-500/50 bg-background shadow-sm"
                    : "border-transparent bg-transparent hover:bg-muted"
                )}
              >
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-full shrink-0"
                  onClick={() => {
                    if (isSearchExpanded && searchQuery) {
                      handleSearchSubmit({ preventDefault: () => {} } as any);
                    } else {
                      setIsSearchExpanded(!isSearchExpanded);
                    }
                  }}
                >
                  <Search className="h-4 w-4 text-muted-foreground" />
                </Button>
                <Input
                  ref={searchInputRef}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search projects..."
                  className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent h-10 px-0 pr-4 w-full"
                />
              </motion.div>
            </form>
          </div>

          {user ? (
            <>
              {/* Create Project Button */}
              <Button
                asChild
                size="sm"
                className="hidden md:flex items-center gap-2 rounded-full bg-emerald-600 px-4 text-white shadow-lg transition-all duration-300 hover:bg-emerald-500 hover:shadow-xl"
              >
                <Link href="/project/new-project">
                  <Plus className="h-4 w-4" />
                  <span>Create Project</span>
                </Link>
              </Button>

              {/* Theme Toggle */}
              <ThemeToggle />

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-10 w-10 rounded-full hover:bg-emerald-500/10"
                  >
                    <Avatar className="h-9 w-9 border-2 border-emerald-500/20">
                      <AvatarImage
                        src={avatarUrl || undefined}
                        className="object-cover"
                      />
                      <AvatarFallback className="bg-gradient-to-br from-emerald-600 to-emerald-500 text-white text-sm">
                        {avatarFallback}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {displayName}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link
                      href={`/profile/${profile?.username || user.id}`}
                      className="cursor-pointer"
                    >
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/project" className="cursor-pointer">
                      <FolderKanban className="mr-2 h-4 w-4" />
                      <span>My Projects</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/workspaces" className="cursor-pointer">
                      <Briefcase className="mr-2 h-4 w-4" />
                      <span>Workspaces</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <form action={signOutAction} className="w-full">
                      <button
                        type="submit"
                        className="flex w-full items-center cursor-pointer"
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Sign out</span>
                      </button>
                    </form>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              {/* Guest Actions */}
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
                  className="rounded-full border border-emerald-500/20 bg-emerald-600 px-6 text-white shadow-lg transition-all duration-300 hover:bg-emerald-500 hover:shadow-xl"
                >
                  <Link href="/auth/signup">Get Started</Link>
                </Button>
              </div>
              <ThemeToggle />
            </>
          )}

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden hover:bg-emerald-500/10 transition-all duration-300"
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
            className="md:hidden overflow-hidden border-t border-emerald-500/20 bg-background/95 backdrop-blur-xl"
          >
            <nav className="container flex flex-col gap-2 py-6 px-4">
              {/* Mobile Search */}
              <form onSubmit={handleSearchSubmit} className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search projects..."
                    className="pl-9 rounded-xl"
                  />
                </div>
              </form>

              {navItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={item.href}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300",
                        isActive(item.href)
                          ? "bg-emerald-500/10 text-emerald-600"
                          : "text-muted-foreground hover:bg-emerald-500/5 hover:text-emerald-600"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  </motion.div>
                );
              })}

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="flex flex-col gap-3 pt-6 mt-2 border-t border-emerald-500/10"
              >
                {user ? (
                  <>
                    <Button
                      asChild
                      className="w-full rounded-xl bg-emerald-600 text-white shadow-lg transition-all duration-300 hover:bg-emerald-500"
                    >
                      <Link
                        href="/project/new-project"
                        className="flex items-center justify-center gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Create Project
                      </Link>
                    </Button>
                    <Link
                      href={`/profile/${profile?.username || user.id}`}
                      className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl hover:bg-emerald-500/5"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <User className="h-4 w-4" />
                      Profile
                    </Link>
                    <form action={signOutAction}>
                      <button
                        type="submit"
                        className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl hover:bg-red-500/5 text-red-600"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign out
                      </button>
                    </form>
                  </>
                ) : (
                  <>
                    <Button
                      variant="ghost"
                      asChild
                      className="w-full justify-start rounded-xl hover:bg-emerald-500/10"
                    >
                      <Link href="/auth/sign-in">Login</Link>
                    </Button>
                    <Button
                      asChild
                      className="w-full rounded-xl bg-emerald-600 text-white shadow-lg transition-all duration-300 hover:bg-emerald-500"
                    >
                      <Link href="/auth/signup">Get Started</Link>
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
