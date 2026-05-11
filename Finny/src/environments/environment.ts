/// <reference types="vite/client" />

/**
 * Development environment configuration.
 *
 * Set VITE_WS_URL in a `.env` or `.env.local` file at the project root
 * to override the WebSocket endpoint without changing source code, e.g.:
 *
 *   VITE_WS_URL=ws://my-dev-server:5230/ws/stocks
 *
 * See `.env.example` for all supported variables.
 */
export const environment = {
  wsUrl: import.meta.env['VITE_WS_URL'] ?? 'ws://localhost:5230/ws/stocks',
} as const;
