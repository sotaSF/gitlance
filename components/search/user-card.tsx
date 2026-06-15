import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { MapPin, Briefcase, Star, CheckCircle2 } from "lucide-react";
import { UserProfile } from "@/app/(dashboard)/search/actions";

interface UserCardProps {
  user: UserProfile;
}

export function UserCard({ user }: UserCardProps) {
  return (
    <Card className="h-full flex flex-col hover:shadow-md transition-shadow duration-200 border-border/60">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex gap-4">
            <Avatar className="h-12 w-12 border border-border">
              <AvatarImage
                src={user.avatar_url || undefined}
                alt={user.display_name || ""}
              />
              <AvatarFallback className="bg-primary/10 text-primary font-medium">
                {user.display_name?.substring(0, 2).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-semibold text-lg leading-none">
                  {user.display_name || "Unknown User"}
                </h3>
                {user.is_user_verified && (
                  <CheckCircle2
                    className="h-4 w-4 text-blue-500"
                    fill="currentColor"
                    stroke="white"
                  />
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                {user.headline || user.primary_role || "No headline"}
              </p>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 pb-4">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-y-2 gap-x-4 text-sm text-muted-foreground">
            {user.location && (
              <div className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                <span>{user.location}</span>
              </div>
            )}
            {user.years_experience !== null && (
              <div className="flex items-center gap-1">
                <Briefcase className="h-3.5 w-3.5" />
                <span>{user.years_experience} years exp.</span>
              </div>
            )}
            {user.rating && (
              <div className="flex items-center gap-1 text-amber-600">
                <Star className="h-3.5 w-3.5 fill-current" />
                <span>{user.rating.toFixed(1)}</span>
                <span className="text-muted-foreground">
                  ({user.review_count})
                </span>
              </div>
            )}
          </div>

          {user.skills && user.skills.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {user.skills.slice(0, 5).map((skill) => (
                <Badge
                  key={skill}
                  variant="secondary"
                  className="text-xs font-normal"
                >
                  {skill}
                </Badge>
              ))}
              {user.skills.length > 5 && (
                <Badge
                  variant="outline"
                  className="text-xs font-normal text-muted-foreground"
                >
                  +{user.skills.length - 5} more
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="pt-0">
        <Link href={`/profile/${user.username || user.id}`} className="w-full">
          <Button variant="outline" className="w-full">
            View Profile
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
