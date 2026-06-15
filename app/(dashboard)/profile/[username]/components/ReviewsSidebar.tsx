"use client";

import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Star, ArrowUpRight, ThumbsUp } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

type Review = {
  id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  created_at: string;
  reviewer: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
  project: {
    id: string;
    title: string;
  } | null;
};

interface ReviewsSidebarProps {
  userId: string;
  initialReviews: Review[];
  reviewCount: number;
}

export function ReviewsSidebar({ userId, initialReviews, reviewCount }: ReviewsSidebarProps) {
  const [allReviews, setAllReviews] = useState<Review[]>(initialReviews);
  const [isLoading, setIsLoading] = useState(false);

  const loadAllReviews = async () => {
    if (allReviews.length >= reviewCount) return; // Already have all reviews
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/profile/${userId}/reviews`);
      if (response.ok) {
        const data = await response.json();
        setAllReviews(data.reviews || []);
      }
    } catch (error) {
      console.error("Failed to load reviews:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const averageRating = allReviews.length > 0
    ? (allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length).toFixed(1)
    : "0.0";

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" onClick={loadAllReviews}>
          View all
          <ArrowUpRight className="ml-1 h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>All Reviews ({reviewCount})</SheetTitle>
          <SheetDescription>
            Average rating: <span className="font-semibold text-foreground">{averageRating}</span> ⭐
          </SheetDescription>
        </SheetHeader>
        
        <Separator className="my-4" />
        
        <ScrollArea className="h-[calc(100vh-140px)] pr-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-sm text-muted-foreground">Loading reviews...</p>
            </div>
          ) : allReviews.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Star className="h-12 w-12 text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">No reviews yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {allReviews.map((review) => (
                <Card key={review.id} className="border-border/60">
                  <CardContent className="py-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={review.reviewer?.avatar_url || undefined} />
                        <AvatarFallback>
                          {review.reviewer?.display_name?.substring(0, 2).toUpperCase() || "RV"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="font-semibold text-sm">
                              {review.reviewer?.display_name || "GitLance User"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(review.created_at).toLocaleDateString("en-US", {
                                month: "long",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 text-amber-500">
                            {Array.from({ length: 5 }).map((_, index) => (
                              <Star
                                key={index}
                                className="h-3.5 w-3.5"
                                fill={index < review.rating ? "currentColor" : "none"}
                                strokeWidth={1.5}
                              />
                            ))}
                          </div>
                        </div>
                        
                        {review.project && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Project: <span className="font-medium">{review.project.title}</span>
                          </p>
                        )}
                        
                        <div className="mt-3 space-y-1.5">
                          {review.title && (
                            <p className="font-semibold text-sm">{review.title}</p>
                          )}
                          {review.comment && (
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {review.comment}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
