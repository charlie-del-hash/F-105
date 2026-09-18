/** Desk clocks. Label → IANA zone. Add a city here and it appears in the clocks panel picker. */
export const zones: Record<string, string> = {
  London: "Europe/London",
  "New York": "America/New_York",
  Houston: "America/Chicago",
  Zurich: "Europe/Zurich",
  Oslo: "Europe/Oslo",
  Athens: "Europe/Athens",
  Dubai: "Asia/Dubai",
  Mumbai: "Asia/Kolkata",
  Singapore: "Asia/Singapore",
  "Hong Kong": "Asia/Hong_Kong",
  Shanghai: "Asia/Shanghai",
  Tokyo: "Asia/Tokyo",
  Seoul: "Asia/Seoul",
  Sydney: "Australia/Sydney",
  UTC: "UTC",
};
export const zoneNames = Object.keys(zones);
