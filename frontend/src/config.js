// Automatically picks up your live Render URL on Vercel, or falls back to localhost locally
export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
).replace(/\/$/, ''); // Strips any accidental trailing slash