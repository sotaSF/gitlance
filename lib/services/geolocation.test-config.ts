/**
 * OPTIONAL: Testing helper for local development
 * 
 * If you want to test location detection on localhost, you can:
 * 1. Uncomment the MOCK_IP line below
 * 2. Use a public IP address (e.g., 8.8.8.8 for US, or your actual public IP)
 * 3. The location will be detected based on that IP instead
 */

// Example IPs for testing different locations:
// const MOCK_IP = "8.8.8.8";           // Google DNS - USA (Mountain View, CA)
export const MOCK_IP = "1.1.1.1";           // Cloudflare DNS - Australia
// const MOCK_IP = "YOUR_PUBLIC_IP";    // Use your actual public IP

// export const MOCK_IP = undefined; // Set to a public IP for local testing

/**
 * Get the test IP for local development
 * Returns undefined in production or if not mocking
 */
export function getTestIP(): string | undefined {
  if (process.env.NODE_ENV === "development" && MOCK_IP) {
    console.log("🧪 Using mock IP for location testing:", MOCK_IP);
    return MOCK_IP;
  }
  return undefined;
}
