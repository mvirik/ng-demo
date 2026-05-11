/// <reference types="vite/client" />

/**
 * Production environment configuration.
 *
 * Set VITE_WS_URL at build time to point to the production WebSocket server:
 *
 *   VITE_WS_URL=wss://api.example.com/ws/stocks ng build
 */
export const environment = {
  wsUrl: import.meta.env['VITE_WS_URL'] ?? 'wss://api.example.com/ws/stocks',
} as const;
