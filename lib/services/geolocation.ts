/**
 * Geolocation service using ipapi.co for IP-based location detection
 * Free tier: 1,000 requests/day, no API key required
 */

export interface LocationData {
  city: string;
  region: string;
  country: string;
  country_code: string;
  timezone: string;
  latitude: number;
  longitude: number;
}

/**
 * Check if IP is reserved/private (localhost, private networks)
 */
function isReservedIP(ip?: string): boolean {
  if (!ip) return true;
  
  // Check for localhost
  if (ip === "127.0.0.1" || ip === "::1" || ip === "localhost") {
    return true;
  }
  
  // Check for private IP ranges
  const privateRanges = [
    /^10\./,                    // 10.0.0.0/8
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // 172.16.0.0/12
    /^192\.168\./,              // 192.168.0.0/16
    /^169\.254\./,              // 169.254.0.0/16 (link-local)
    /^fc00:/,                   // IPv6 private
    /^fe80:/,                   // IPv6 link-local
  ];
  
  return privateRanges.some((range) => range.test(ip));
}

/**
 * Fetches location data based on IP address
 * @param ip - Optional IP address, if not provided, service will use requester's IP
 * @returns LocationData or null if failed
 */
export async function getLocationFromIP(
  ip?: string
): Promise<LocationData | null> {
  try {
    // Skip API call for reserved/private IPs (e.g., localhost during development)
    if (isReservedIP(ip)) {
      console.log("Skipping location detection for reserved IP:", ip || "auto-detect");
      return null;
    }
    // ipapi.co provides free IP geolocation
    // If no IP provided, it uses the requester's IP automatically
    const url = ip
      ? `https://ipapi.co/${ip}/json/`
      : `https://ipapi.co/json/`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "gitlance-app",
      },
      // Cache for 1 hour since location doesn't change frequently
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      console.error("Failed to fetch location:", response.statusText);
      return null;
    }

    const data = await response.json();

    // Check if we got an error response
    if (data.error) {
      console.error("Location API error:", data.reason);
      return null;
    }

    return {
      city: data.city || "",
      region: data.region || "",
      country: data.country_name || "",
      country_code: data.country_code || "",
      timezone: data.timezone || "",
      latitude: data.latitude || 0,
      longitude: data.longitude || 0,
    };
  } catch (error) {
    console.error("Error fetching location:", error);
    return null;
  }
}

/**
 * Formats location data into a readable string
 */
export function formatLocation(location: LocationData): string {
  const parts = [location.city, location.region, location.country].filter(
    Boolean
  );
  return parts.join(", ");
}
