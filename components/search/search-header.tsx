"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, X, SlidersHorizontal } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDebounce } from "@/lib/hooks/use-debounce"; // Assuming this hook exists or I'll implement a simple one

interface SearchHeaderProps {
  activeTab: "projects" | "users";
  totalResults: number;
}

export function SearchHeader({ activeTab, totalResults }: SearchHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const currentQuery = searchParams.get("q") || "";
  const currentSort = searchParams.get("sort") || "recent";
  
  const [query, setQuery] = useState(currentQuery);
  
  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query !== currentQuery) {
        const params = new URLSearchParams(searchParams.toString());
        if (query) {
          params.set("q", query);
        } else {
          params.delete("q");
        }
        // Reset page on new search
        params.delete("page");
        router.push(`${pathname}?${params.toString()}`);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [query, router, pathname, searchParams, currentQuery]);

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    // Reset pagination when switching tabs
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleSortChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", value);
    router.push(`${pathname}?${params.toString()}`);
  };

  const clearSearch = () => {
    setQuery("");
    const params = new URLSearchParams(searchParams.toString());
    params.delete("q");
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Search</h1>
          <p className="text-muted-foreground mt-1">
            Find {activeTab === "projects" ? "projects to work on" : "talented professionals"}
          </p>
        </div>
        
        <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-lg">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList>
              <TabsTrigger value="projects" className="px-6">Projects</TabsTrigger>
              <TabsTrigger value="users" className="px-6">People</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={activeTab === "projects" ? "Search projects by title, skills, or keywords..." : "Search people by name, title, or skills..."}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9 pr-9 h-11"
          />
          {query && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 min-w-[180px]">
          <Select value={currentSort} onValueChange={handleSortChange}>
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Most Recent</SelectItem>
              {activeTab === "projects" ? (
                <>
                  <SelectItem value="budget_high">Budget: High to Low</SelectItem>
                  <SelectItem value="budget_low">Budget: Low to High</SelectItem>
                  <SelectItem value="deadline">Deadline: Soonest</SelectItem>
                </>
              ) : (
                <>
                  <SelectItem value="experience">Experience: High to Low</SelectItem>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                </>
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div>
          Found {totalResults} {activeTab === "projects" ? "projects" : "people"}
        </div>
        {/* Mobile filter trigger could go here */}
      </div>
    </div>
  );
}
