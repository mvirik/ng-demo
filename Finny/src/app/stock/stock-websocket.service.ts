import { Injectable, OnDestroy, signal, computed } from '@angular/core';
import { StockDetails, StockPrice } from './stock.model';

const INITIAL_PRICE = 182.63;
const SYMBOL = 'AAPL';
const MAX_HISTORY = 60;

function buildInitialHistory(): { history: StockPrice[]; openPrice: number } {
  const history: StockPrice[] = [];
  let price = INITIAL_PRICE;
  const now = Date.now();

  for (let i = MAX_HISTORY - 1; i >= 0; i--) {
    price = Math.max(1, price + (Math.random() - 0.49) * 1.5);
    history.push({ timestamp: now - i * 1500, price });
  }
  return { history, openPrice: history[0]?.price ?? INITIAL_PRICE };
}

function buildDetails(
  currentPrice: number,
  openPrice: number,
): StockDetails {
  const high = Math.max(
    currentPrice,
    openPrice,
    currentPrice * (1 + Math.random() * 0.01),
  );
  const low = Math.min(
    currentPrice,
    openPrice,
    currentPrice * (1 - Math.random() * 0.01),
  );
  const priceChange = currentPrice - openPrice;
  return {
    symbol: SYMBOL,
    name: 'Apple Inc.',
    exchange: 'NASDAQ',
    currency: 'USD',
    currentPrice,
    openPrice,
    highPrice: high,
    lowPrice: low,
    volume: Math.floor(52_000_000 + Math.random() * 5_000_000),
    marketCap: Math.floor(currentPrice * 15_441_000_000),
    priceChange,
    priceChangePercent: (priceChange / openPrice) * 100,
  };
}

@Injectable({ providedIn: 'root' })
export class StockWebSocketService implements OnDestroy {
  private readonly _priceHistory = signal<StockPrice[]>([]);
  private readonly _details = signal<StockDetails>(
    buildDetails(INITIAL_PRICE, INITIAL_PRICE),
  );
  private readonly _connected = signal(false);

  readonly priceHistory = this._priceHistory.asReadonly();
  readonly details = this._details.asReadonly();
  readonly connected = this._connected.asReadonly();

  readonly latestPrice = computed(
    () => this._priceHistory().at(-1)?.price ?? INITIAL_PRICE,
  );

  private mockWs: ReturnType<typeof setInterval> | null = null;
  private openPrice = INITIAL_PRICE;

  constructor() {
    const { history, openPrice } = buildInitialHistory();
    this._priceHistory.set(history);
    this.openPrice = openPrice;
    this._details.set(buildDetails(history.at(-1)?.price ?? INITIAL_PRICE, openPrice));
  }

  connect(): void {
    if (this._connected()) return;
    this._connected.set(true);

    this.mockWs = setInterval(() => {
      const history = this._priceHistory();
      const lastPrice = history.at(-1)?.price ?? INITIAL_PRICE;
      const change = (Math.random() - 0.49) * 1.5;
      const newPrice = Math.max(1, lastPrice + change);
      const tick: StockPrice = { timestamp: Date.now(), price: newPrice };

      const updated = [...history, tick].slice(-MAX_HISTORY);
      this._priceHistory.set(updated);
      this._details.set(buildDetails(newPrice, this.openPrice));
    }, 1500);
  }

  disconnect(): void {
    if (this.mockWs !== null) {
      clearInterval(this.mockWs);
      this.mockWs = null;
    }
    this._connected.set(false);
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}
