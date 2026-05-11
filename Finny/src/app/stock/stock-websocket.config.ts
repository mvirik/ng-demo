import { InjectionToken } from '@angular/core';

/** Factory function that creates a WebSocket instance for a given URL. */
export type WebSocketFactory = (url: string) => WebSocket;

/**
 * Shape of the price-update messages broadcast by the server over the
 * WebSocket connection at /ws/stocks.
 */
export interface PriceUpdate {
  symbol: string;
  price: number;
  timestamp: number;
}

/**
 * Injection token for the WebSocket endpoint URL.
 *
 * **Must be provided** in the application providers (e.g. via `app.config.ts`).
 * The app provides it from `environment.wsUrl`, which reads `VITE_WS_URL`
 * from a `.env` file at build time — see `.env.example`.
 *
 * In tests, override it with a test URL:
 * `{ provide: WS_URL, useValue: 'ws://localhost:5230/ws/stocks' }`
 */
export const WS_URL = new InjectionToken<string>('WS_URL');

/**
 * Injection token for the WebSocket factory.
 * Defaults to creating a native `WebSocket`; swap out in tests with a fake.
 */
export const WS_FACTORY = new InjectionToken<WebSocketFactory>('WS_FACTORY', {
  providedIn: 'root',
  factory: () => (url: string) => new WebSocket(url),
});
