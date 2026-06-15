"use client";

import { motion } from "motion/react";
import { useEffect, useMemo, useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { User, MapPin, Clock, Briefcase, AtSign, FileText, Globe, Loader2, Upload, X } from "lucide-react";
import MDEditor from "@uiw/react-md-editor";
import { detectUserLocation, uploadProfilePicture } from "@/app/onboarding/actions";
import type { LocationData } from "@/lib/services/geolocation";
import { useToast } from "@/components/ui/use-toast";

interface BasicDetailsStepProps {
  onDataChange: (data: BasicDetailsData) => void;
  initialData?: BasicDetailsData;
}

export interface BasicDetailsData {
  username: string;
  display_name: string;
  pronouns: string;
  headline: string;
  description: string;
  location: string;
  timezone: string;
  country?: string;
  city?: string;
  region?: string;
  country_code?: string;
  avatar_url?: string;
}

export function BasicDetailsStep({
  onDataChange,
  initialData,
}: BasicDetailsStepProps) {
  console.log(`INITAIL DATA ${JSON.stringify(initialData)}`)
  const defaultTZ =
    initialData?.timezone ||
    Intl.DateTimeFormat().resolvedOptions().timeZone ||
    "";

  const [formData, setFormData] = useState<BasicDetailsData>(
    initialData || {
      username: "",
      display_name: "",
      pronouns: "",
      headline: "",
      description: "",
      location: "",
      timezone: defaultTZ,
    }
  );

  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [locationDetected, setLocationDetected] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(initialData?.avatar_url || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Auto-detect location on mount if not already set
  useEffect(() => {
    const detectLocation = async () => {
      // Only detect if location is empty and we haven't detected yet
      if (!formData.location && !locationDetected && !isDetectingLocation) {
        setIsDetectingLocation(true);
        
        const result = await detectUserLocation();
        
        if (result.success && result.location) {
          const loc = result.location;
          const locationString = [loc.city, loc.region, loc.country]
            .filter(Boolean)
            .join(", ");

          const updated = {
            ...formData,
            location: locationString,
            country: loc.country,
            city: loc.city,
            region: loc.region,
            country_code: loc.country_code,
            timezone: loc.timezone || formData.timezone,
          };

          setFormData(updated);
          onDataChange(updated);
          setLocationDetected(true);
        }
        
        setIsDetectingLocation(false);
      }
    };

    detectLocation();
  }, []);

  const handleChange = (field: keyof BasicDetailsData, value: string) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    onDataChange(updated);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Only JPEG, PNG, and WebP images are allowed.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "File size must be less than 5MB.",
        variant: "destructive",
      });
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload file
    setIsUploading(true);
    try {
      const uploadResult = await uploadProfilePicture(file);

      if (uploadResult.success && uploadResult.url) {
        const updated = { ...formData, avatar_url: uploadResult.url };
        setFormData(updated);
        onDataChange(updated);
        
        toast({
          title: "Success",
          description: "Profile picture uploaded successfully.",
        });
      } else {
        toast({
          title: "Error",
          description: uploadResult.error || "Failed to upload profile picture",
          variant: "destructive",
        });
        setAvatarPreview(initialData?.avatar_url || null);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred during upload",
        variant: "destructive",
      });
      setAvatarPreview(initialData?.avatar_url || null);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarPreview(null);
    const updated = { ...formData, avatar_url: undefined };
    setFormData(updated);
    onDataChange(updated);
    
    toast({
      title: "Success",
      description: "Profile picture removed.",
    });
    
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const getInitialsFromName = () => {
    const displayName = formData.display_name || formData.username || "U";
    const names = displayName.split(" ");
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return displayName.substring(0, 2).toUpperCase();
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-8 py-4"
    >
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-foreground">
          Basic information
        </h2>
        <p className="text-sm text-muted-foreground">
          Tell us about yourself so others can get to know you
        </p>
      </div>

      {/* Profile Picture */}
      <div className="pb-8 border-b">
        <div className="flex items-start gap-6">
          <div className="relative flex-shrink-0">
            <div className="h-24 w-24 rounded-full overflow-hidden bg-muted border-2 border-border flex items-center justify-center text-foreground text-2xl font-medium">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Profile picture"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span>{getInitialsFromName()}</span>
              )}
            </div>
            {isUploading && (
              <div className="absolute inset-0 bg-background/80 rounded-full flex items-center justify-center">
                <Loader2 className="h-6 w-6 text-primary animate-spin" />
              </div>
            )}
          </div>

          <div className="flex-1 space-y-3">
            <div>
              <h3 className="text-sm font-medium text-foreground mb-1">Profile photo</h3>
              <p className="text-sm text-muted-foreground">
                A photo helps people recognize you and lets you know when you're signed in
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                className="hidden"
                disabled={isUploading}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="text-sm"
              >
                <Upload className="h-4 w-4 mr-2" />
                {isUploading ? "Uploading..." : avatarPreview ? "Change" : "Upload"}
              </Button>
              {avatarPreview && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveAvatar}
                  disabled={isUploading}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Remove
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              JPG, PNG or WebP. 5MB max.
            </p>
          </div>
        </div>
      </div>

      {/* Form Fields */}
      <div className="space-y-6">
        {/* Username & Display Name */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="username" className="text-sm font-medium">
              Username <span className="text-destructive">*</span>
            </Label>
            <Input
              id="username"
              placeholder="johndoe"
              value={formData.username}
              onChange={(e) =>
                handleChange(
                  "username",
                  e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "")
                )
              }
              required
              className="h-9"
            />
            <p className="text-xs text-muted-foreground">
              Your unique identifier. Only lowercase letters, numbers, and underscores.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="display_name" className="text-sm font-medium">
              Display name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="display_name"
              placeholder="John Doe"
              value={formData.display_name}
              onChange={(e) => handleChange("display_name", e.target.value)}
              required
              className="h-9"
            />
            <p className="text-xs text-muted-foreground">
              Your name as it will appear to others.
            </p>
          </div>
        </div>

        {/* Pronouns */}
        <div className="space-y-2">
          <Label htmlFor="pronouns" className="text-sm font-medium">
            Pronouns <span className="text-destructive">*</span>
          </Label>
          <Input
            id="pronouns"
            placeholder="he/him, she/her, they/them"
            value={formData.pronouns}
            onChange={(e) => handleChange("pronouns", e.target.value)}
            required
            className="h-9 max-w-md"
          />
          <p className="text-xs text-muted-foreground">
            Help others address you correctly.
          </p>
        </div>

        <div className="border-t pt-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">
            Professional information
          </h3>

          {/* Headline */}
          <div className="space-y-2 mb-6">
            <Label htmlFor="headline" className="text-sm font-medium">
              Professional headline <span className="text-destructive">*</span>
            </Label>
            <Input
              id="headline"
              placeholder="Full-Stack Developer | React & Node.js"
              value={formData.headline}
              onChange={(e) => handleChange("headline", e.target.value)}
              required
              className="h-9"
            />
            <p className="text-xs text-muted-foreground">
              A brief tagline about what you do.
            </p>
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Bio <span className="text-destructive">*</span>
            </Label>
            <MDEditor
              value={formData.description}
              id="description"
              preview="edit"
              height={180}
              onChange={(value?: string) =>
                handleChange("description", value || "")
              }
              textareaProps={{
                placeholder:
                  "Tell us about yourself, your experience, and what you're passionate about...",
              }}
            />
            <p className="text-xs text-muted-foreground">
              You can use Markdown to format your bio.
            </p>
          </div>
        </div>

        <div className="border-t pt-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">
            Location & timezone
          </h3>

          {/* Location */}
          <div className="space-y-2 mb-6">
            <Label className="text-sm font-medium">Location</Label>
            
            {isDetectingLocation ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Detecting your location...</span>
              </div>
            ) : formData.location ? (
              <div className="space-y-2">
                <div className="flex items-start gap-2 py-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">
                      {formData.location}
                    </p>
                    {(formData.city || formData.region || formData.country || formData.country_code) && (
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        {formData.city && <span>City: {formData.city}</span>}
                        {formData.region && <span>Region: {formData.region}</span>}
                        {formData.country && <span>Country: {formData.country}</span>}
                        {formData.country_code && <span>Code: {formData.country_code}</span>}
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Detected from your IP address
                </p>
              </div>
            ) : (
              <div className="py-2 text-sm text-muted-foreground">
                <p>Location could not be detected automatically.</p>
                <p className="text-xs mt-1">
                  {process.env.NODE_ENV === "development" 
                    ? "Note: Location detection doesn't work on localhost."
                    : "Location detection requires a public IP address."}
                </p>
              </div>
            )}
          </div>

          {/* Timezone */}
          <div className="space-y-2">
            <Label htmlFor="timezone" className="text-sm font-medium">
              Timezone
            </Label>
            <TimezoneSelect
              id="timezone"
              value={formData.timezone}
              onChange={(tz) => handleChange("timezone", tz)}
              defaultValue={defaultTZ}
            />
            <p className="text-xs text-muted-foreground">
              Used for scheduling and displaying times.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* --- TimezoneSelect component --- */
/* Small, focused client-side searchable timezone selector for onboarding.
   Uses a representative list of IANA zones across regions and allows typing
   to filter. Keeps styling consistent with brand variables. */

function TimezoneSelect({
  id,
  value,
  onChange,
  defaultValue,
}: {
  id?: string;
  value: string;
  onChange: (tz: string) => void;
  defaultValue?: string;
}) {
  const TIMEZONES = useMemo(
    () => [
      "UTC",
      "Europe/London",
      "Europe/Paris",
      "Europe/Berlin",
      "Europe/Moscow",
      "Europe/Madrid",
      "Europe/Rome",
      "Europe/Amsterdam",
      "Europe/Zurich",
      "America/New_York",
      "America/Chicago",
      "America/Denver",
      "America/Los_Angeles",
      "America/Anchorage",
      "America/Phoenix",
      "America/Toronto",
      "America/Vancouver",
      "America/Sao_Paulo",
      "America/Buenos_Aires",
      "Asia/Kolkata",
      "Asia/Shanghai",
      "Asia/Hong_Kong",
      "Asia/Tokyo",
      "Asia/Seoul",
      "Asia/Singapore",
      "Asia/Dubai",
      "Asia/Jakarta",
      "Asia/Karachi",
      "Asia/Bangkok",
      "Asia/Manila",
      "Australia/Sydney",
      "Australia/Melbourne",
      "Australia/Perth",
      "Pacific/Auckland",
      "Africa/Johannesburg",
      "Africa/Cairo",
      "Africa/Nairobi",
      "Etc/GMT+12",
      "Etc/GMT+11",
      "Etc/GMT+10",
      "Etc/GMT-1",
      "Etc/GMT-2",
      "Etc/GMT-3",
    ],
    []
  );

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const filtered = TIMEZONES.filter((tz) =>
    tz.toLowerCase().includes(query.toLowerCase())
  );

  // ensure default selected
  const selected = value || defaultValue || "";

  return (
    <div className="relative">
      <button
        type="button"
        id={id}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((s) => !s)}
        className="w-full rounded-md border px-3 py-2 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]"
      >
        <div className="flex items-center justify-between">
          <div className="min-w-0 truncate text-sm text-[var(--color-foreground)]">
            {selected || "Select your timezone"}
          </div>
          <div className="ml-2 text-xs text-[var(--color-brand-secondary)]">
            ⌘K
          </div>
        </div>
      </button>

      <div
        className={`absolute z-40 mt-2 w-full rounded-md bg-card shadow-lg ring-1 ring-black/5 ${
          open ? "block" : "hidden"
        }`}
        role="dialog"
        aria-modal="false"
      >
        <div className="p-2">
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search timezones (e.g. Europe/London)"
            className="w-full rounded-md border px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]"
          />
        </div>

        <ul
          role="listbox"
          aria-labelledby={id}
          className="max-h-56 overflow-auto px-1 pb-2"
        >
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-sm text-muted-foreground">
              No results
            </li>
          ) : (
            filtered.map((tz) => (
              <li key={tz} className="px-1">
                <button
                  type="button"
                  onClick={() => {
                    onChange(tz);
                    setOpen(false);
                    setQuery("");
                  }}
                  className={`flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-[var(--color-primary)]/5 ${
                    tz === selected
                      ? "bg-[var(--color-primary)]/10 font-medium text-[var(--color-brand)]"
                      : "text-[var(--color-foreground)]"
                  }`}
                >
                  <span className="truncate">{tz}</span>
                  <span className="text-xs text-[var(--color-brand-secondary)]">
                    {formatOffset(tz)}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}

/* Basic offset formatter: tries to get a short offset using Intl. Falls back to empty. */
function formatOffset(tz: string) {
  try {
    const now = new Date();
    const fmt = new Intl.DateTimeFormat("en-US", {
      hour12: false,
      timeZone: tz,
      timeZoneName: "short",
    });
    const parts = fmt.formatToParts(now);
    const tzName = parts.find((p) => p.type === "timeZoneName")?.value;
    return tzName ?? "";
  } catch {
    return "";
  }
}
