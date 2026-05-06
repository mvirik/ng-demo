import { computed, inject, Injectable, InjectionToken, OnDestroy, signal } from '@angular/core';
import { StockDetails, StockPrice } from './stock.model';

export type WebSocketFactory = (url: string) => WebSocket;

export const WS_URL = new InjectionToken<string>('WS_URL', {
  providedIn: 'root',
  factory: () => 'ws://localhost:5230/ws/stocks',
});

export const WS_FACTORY = new InjectionToken<WebSocketFactory>('WS_FACTORY', {
  providedIn: 'root',
  factory: () => (url: string) => new WebSocket(url),
});

const MAX_HISTORY = 60;

interface PriceUpdate {
  symbol: string;
  price: number;
  timestamp: number;
}

function buildDetails(
  symbol: string,
  currentPrice: number,
  openPrice: number,
  highPrice: number,
  lowPrice: number,
): StockDetails {
  const priceChange = currentPrice - openPrice;
  return {
    symbol,
    name: symbol,
    exchange: 'LIVE',
    currency: 'USD',
    currentPrice,
    openPrice,
    highPrice,
    lowPrice,
    volume: 0,
    marketCap: 0,
    priceChange,
    priceChangePercent: openPrice > 0 ? (priceChange / openPrice) * 100 : 0,
  };
}

@Injectable({ providedIn: 'root' })
export class StockWebSocketService implements OnDestroy {
  private readonly wsUrl = inject(WS_URL);
  private readonly wsFactory = inject(WS_FACTORY);

  private readonly _symbol = signal<string>('');
  private readonly _priceHistory = signal<StockPrice[]>([]);
  private readonly _details = signal<StockDetails>({
    symbol: '',
    name: '',
    exchange: '',
    currency: 'USD',
    currentPrice: 0,
    openPrice: 0,
    highPrice: 0,
    lowPrice: 0,
    volume: 0,
    marketCap: 0,
    priceChange: 0,
    priceChangePercent: 0,
  });
  private readonly _connected = signal(false);

  readonly symbol = this._symbol.asReadonly();
  readonly priceHistory = this._priceHistory.asReadonly();
  readonly details = this._details.asReadonly();
  readonly connected = this._connected.asReadonly();

  readonly latestPrice = computed(() => this._priceHistory().at(-1)?.price ?? 0);

  private ws: WebSocket | null = null;
  private wsOpen = false;
  private openPrice = 0;
  private sessionHigh = 0;
  private sessionLow = Number.MAX_VALUE;

  connect(symbol: string): void {
    const upperSymbol = symbol.toUpperCase();
    if (this._connected() && this._symbol() === upperSymbol) return;

    this.disconnect();

    this._symbol.set(upperSymbol);
    this._priceHistory.set([]);
    this._details.set(buildDetails(upperSymbol, 0, 0, 0, 0));
    this.openPrice = 0;
    this.sessionHigh = 0;
    this.sessionLow = Number.MAX_VALUE;

    const ws = this.wsFactory(this.wsUrl);
    this.ws = ws;

    ws.onopen = () => {
      this.wsOpen = true;
      this._connected.set(true);
      ws.send(JSON.stringify({ type: 'subscribe', symbol: upperSymbol }));
    };

    ws.onmessage = (event: MessageEvent<string>) => {
      try {
        const update = JSON.parse(event.data) as PriceUpdate;
        if (update.symbol?.toUpperCase() !== upperSymbol) return;

        const price = update.price;
        if (this.openPrice === 0) {
          this.openPrice = price;
          this.sessionHigh = price;
          this.sessionLow = price;
        } else {
          this.sessionHigh = Math.max(this.sessionHigh, price);
          this.sessionLow = Math.min(this.sessionLow, price);
        }

        const tick: StockPrice = { timestamp: update.timestamp, price };
        const history = [...this._priceHistory(), tick].slice(-MAX_HISTORY);
        this._priceHistory.set(history);
        this._details.set(
          buildDetails(upperSymbol, price, this.openPrice, this.sessionHigh, this.sessionLow),
        );
      } catch {
        // ignore malformed messages
      }
    };

    ws.onerror = () => {
      this._connected.set(false);
    };

    ws.onclose = () => {
      this.wsOpen = false;
      this._connected.set(false);
      this.ws = null;
    };
  }

  disconnect(): void {
    if (this.ws) {
      const symbol = this._symbol();
      if (this.wsOpen) {
        this.ws.send(JSON.stringify({ type: 'unsubscribe', symbol }));
      }
      this.ws.close();
      this.ws = null;
      this.wsOpen = false;
    }
    this._connected.set(false);
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}
