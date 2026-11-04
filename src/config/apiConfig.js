/**
 * Jonak Hotel & Restaurant - Central API Configuration
 * Automatically switches between local development, Render production, and GitHub Pages
 */

const RENDER_PROD_BACKEND = 'https://jonak-hotel.onrender.com';

export const getApiBaseUrl = () => {
  // 1. Explicit Vite environment variable
  if (import.meta.env.VITE_API_BASE_URL) {
    const custom = import.meta.env.VITE_API_BASE_URL.trim();
    if (custom && custom !== '/' && !custom.startsWith('http://localhost') && !custom.startsWith('http://127.0.0.1')) {
      return custom.replace(/\/$/, '');
    }
    // If running in browser and custom is localhost, check if we're on GitHub Pages or custom domain
    if (typeof window !== 'undefined' && (window.location.hostname.includes('github.io') || window.location.hostname.includes('jonakhotelgroup.in'))) {
      return RENDER_PROD_BACKEND;
    }
    return custom.replace(/\/$/, '');
  }

  // 2. Browser runtime host detection
  if (typeof window !== 'undefined') {
    const { hostname, port } = window.location;

    // Running on GitHub Pages, custom domain, Vercel, or Netlify -> Must route to Render backend
    if (
      hostname.includes('github.io') || 
      hostname.includes('jonakhotelgroup.in') || 
      hostname.includes('vercel.app') || 
      hostname.includes('netlify.app')
    ) {
      return RENDER_PROD_BACKEND;
    }

    // Running on local development server
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      if (port === '3000' || port === '5173') {
        return 'http://localhost:5000';
      }
      return '';
    }

    // Running directly on Render or custom domain -> Same-origin relative calls work
    return '';
  }

  return RENDER_PROD_BACKEND;
};

export const API_BASE_URL = getApiBaseUrl();

/**
 * Build absolute API URL for any endpoint
 * @param {string} endpoint - Path such as '/api/state' or 'api/orders'
 * @returns {string} Fully qualified URL or origin-relative path
 */
export const apiUrl = (endpoint) => {
  const cleanPath = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const base = getApiBaseUrl();
  return base ? `${base}${cleanPath}` : cleanPath;
};

/**
 * Get WebSocket URL matching current API host
 */
export const getWsUrl = () => {
  const base = getApiBaseUrl();
  if (!base) {
    if (typeof window === 'undefined') return 'ws://localhost:5000/ws';
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}/ws`;
  }
  const protocol = base.startsWith('https:') ? 'wss:' : 'ws:';
  const cleanHost = base.replace(/^https?:\/\//, '');
  return `${protocol}//${cleanHost}/ws`;
};

/**
 * Build absolute asset URL taking GitHub Pages subpath into account
 * Resolves /images/... to /Jonak-Hotel/images/... on GitHub Pages
 * @param {string} path - Image or static asset path
 * @returns {string} Fully qualified or path-corrected asset URL
 */
export const assetUrl = (path) => {
  if (!path) return '';
  if (
    path.startsWith('http://') || 
    path.startsWith('https://') || 
    path.startsWith('data:') || 
    path.startsWith('blob:')
  ) {
    return path;
  }
  const clean = path.startsWith('/') ? path.slice(1) : path;
  
  if (typeof window !== 'undefined') {
    // If on GitHub Pages (hostname contains github.io OR pathname begins with /Jonak-Hotel)
    const isGhPages = window.location.hostname.includes('github.io') || window.location.pathname.startsWith('/Jonak-Hotel');
    if (isGhPages) {
      return `/Jonak-Hotel/${clean}`;
    }
  }
  return `/${clean}`;
};

export default {
  API_BASE_URL,
  apiUrl,
  assetUrl,
  getWsUrl,
  RENDER_PROD_BACKEND
};

