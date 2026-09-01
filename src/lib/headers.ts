export const SITE_HEADERS = {
  "Permissions-Policy": "camera=(), geolocation=(), microphone=()",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Strict-Transport-Security": "max-age=63072000",
  Vary: "Host",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
} as const;
