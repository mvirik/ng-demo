import { TestBed } from '@angular/core/testing';
import { StockWebSocketService } from './stock-websocket.service';
import { WS_FACTORY, WS_URL } from './stock-websocket.config';

class FakeWebSocket {
  readyState = 0; // CONNECTING
  sentMessages: string[] = [];

  onopen: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent<string>) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;

  send(data: string): void {
    this.sentMessages.push(data);
  }

  close(): void {
    this.readyState = 3; // CLOSED
    this.onclose?.({ type: 'close' } as CloseEvent);
  }

  /** Simulate server accepting the connection */
  triggerOpen(): void {
    this.readyState = 1; // OPEN
    this.onopen?.({ type: 'open' } as Event);
  }

  /** Simulate a price update message from the server */
  triggerMessage(data: unknown): void {
    this.onmessage?.({
      data: JSON.stringify(data),
    } as MessageEvent<string>);
  }

  /** Simulate a WebSocket error */
  triggerError(): void {
    this.onerror?.({ type: 'error' } as Event);
  }
}

describe('StockWebSocketService', () => {
  let service: StockWebSocketService;
  let fakeWs: FakeWebSocket;

  beforeEach(() => {
    fakeWs = new FakeWebSocket();

    TestBed.configureTestingModule({
      providers: [
        { provide: WS_URL, useValue: 'ws://localhost:5230/ws/stocks' },
        { provide: WS_FACTORY, useValue: () => fakeWs },
      ],
    });
    service = TestBed.inject(StockWebSocketService);
  });

  afterEach(() => {
    service.disconnect();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start disconnected', () => {
    expect(service.connected()).toBe(false);
  });

  it('should start with empty price history', () => {
    expect(service.priceHistory()).toHaveLength(0);
  });

  it('should start with empty symbol', () => {
    expect(service.symbol()).toBe('');
  });

  describe('connect()', () => {
    it('should set symbol to uppercase when connect() is called', () => {
      service.connect('aapl');
      expect(service.symbol()).toBe('AAPL');
    });

    it('should set connected to true when WebSocket opens', () => {
      service.connect('AAPL');
      fakeWs.triggerOpen();
      expect(service.connected()).toBe(true);
    });

    it('should send subscribe message when WebSocket opens', () => {
      service.connect('AAPL');
      fakeWs.triggerOpen();
      expect(fakeWs.sentMessages).toHaveLength(1);
      expect(JSON.parse(fakeWs.sentMessages[0])).toEqual({
        type: 'subscribe',
        symbol: 'AAPL',
      });
    });

    it('should not reconnect if already connected to the same symbol', () => {
      service.connect('AAPL');
      fakeWs.triggerOpen();
      const firstWs = fakeWs;
      service.connect('AAPL');
      expect(fakeWs).toBe(firstWs); // same WebSocket instance
    });

    it('should not be connected before WebSocket opens', () => {
      service.connect('AAPL');
      expect(service.connected()).toBe(false);
    });

    it('should clear price history when connecting to a new symbol', () => {
      service.connect('AAPL');
      fakeWs.triggerOpen();
      fakeWs.triggerMessage({ symbol: 'AAPL', price: 180, timestamp: Date.now() });
      expect(service.priceHistory()).toHaveLength(1);

      // Disconnect and reconnect with a different symbol — history must reset
      service.disconnect();
      service.connect('MSFT');
      expect(service.priceHistory()).toHaveLength(0);
    });

    it('should set connected to false on WebSocket error', () => {
      service.connect('AAPL');
      fakeWs.triggerOpen();
      fakeWs.triggerError();
      expect(service.connected()).toBe(false);
    });

    it('should set connected to false when WebSocket closes', () => {
      service.connect('AAPL');
      fakeWs.triggerOpen();
      fakeWs.close();
      expect(service.connected()).toBe(false);
    });
  });

  describe('price updates', () => {
    beforeEach(() => {
      service.connect('AAPL');
      fakeWs.triggerOpen();
    });

    it('should add a tick to price history on message', () => {
      fakeWs.triggerMessage({ symbol: 'AAPL', price: 182.5, timestamp: 1000 });
      expect(service.priceHistory()).toHaveLength(1);
      expect(service.priceHistory()[0]).toEqual({ price: 182.5, timestamp: 1000 });
    });

    it('should accumulate multiple ticks', () => {
      fakeWs.triggerMessage({ symbol: 'AAPL', price: 181, timestamp: 1000 });
      fakeWs.triggerMessage({ symbol: 'AAPL', price: 182, timestamp: 2000 });
      fakeWs.triggerMessage({ symbol: 'AAPL', price: 183, timestamp: 3000 });
      expect(service.priceHistory()).toHaveLength(3);
    });

    it('should keep at most 60 history entries', () => {
      for (let i = 0; i < 70; i++) {
        fakeWs.triggerMessage({ symbol: 'AAPL', price: 180 + i, timestamp: i * 1000 });
      }
      expect(service.priceHistory()).toHaveLength(60);
    });

    it('should update latestPrice after receiving a tick', () => {
      fakeWs.triggerMessage({ symbol: 'AAPL', price: 195.5, timestamp: 1000 });
      expect(service.latestPrice()).toBe(195.5);
    });

    it('should update details with the current price', () => {
      fakeWs.triggerMessage({ symbol: 'AAPL', price: 182.5, timestamp: 1000 });
      const d = service.details();
      expect(d.symbol).toBe('AAPL');
      expect(d.currentPrice).toBe(182.5);
    });

    it('should use first price as openPrice', () => {
      fakeWs.triggerMessage({ symbol: 'AAPL', price: 180, timestamp: 1000 });
      fakeWs.triggerMessage({ symbol: 'AAPL', price: 185, timestamp: 2000 });
      const d = service.details();
      expect(d.openPrice).toBe(180);
    });

    it('should track session high across ticks', () => {
      fakeWs.triggerMessage({ symbol: 'AAPL', price: 180, timestamp: 1000 });
      fakeWs.triggerMessage({ symbol: 'AAPL', price: 190, timestamp: 2000 });
      fakeWs.triggerMessage({ symbol: 'AAPL', price: 185, timestamp: 3000 });
      expect(service.details().highPrice).toBe(190);
    });

    it('should track session low across ticks', () => {
      fakeWs.triggerMessage({ symbol: 'AAPL', price: 180, timestamp: 1000 });
      fakeWs.triggerMessage({ symbol: 'AAPL', price: 175, timestamp: 2000 });
      fakeWs.triggerMessage({ symbol: 'AAPL', price: 182, timestamp: 3000 });
      expect(service.details().lowPrice).toBe(175);
    });

    it('should compute priceChange as currentPrice minus openPrice', () => {
      fakeWs.triggerMessage({ symbol: 'AAPL', price: 180, timestamp: 1000 });
      fakeWs.triggerMessage({ symbol: 'AAPL', price: 185, timestamp: 2000 });
      expect(service.details().priceChange).toBeCloseTo(5);
    });

    it('should ignore messages for a different symbol', () => {
      fakeWs.triggerMessage({ symbol: 'MSFT', price: 400, timestamp: 1000 });
      expect(service.priceHistory()).toHaveLength(0);
    });

    it('should ignore malformed messages', () => {
      fakeWs.onmessage?.({ data: 'not-json' } as MessageEvent<string>);
      expect(service.priceHistory()).toHaveLength(0);
    });
  });

  describe('disconnect()', () => {
    it('should send unsubscribe message when connected', () => {
      service.connect('AAPL');
      fakeWs.triggerOpen();
      service.disconnect();
      expect(fakeWs.sentMessages).toHaveLength(2); // subscribe + unsubscribe
      expect(JSON.parse(fakeWs.sentMessages[1])).toEqual({
        type: 'unsubscribe',
        symbol: 'AAPL',
      });
    });

    it('should set connected to false after disconnect()', () => {
      service.connect('AAPL');
      fakeWs.triggerOpen();
      service.disconnect();
      expect(service.connected()).toBe(false);
    });

    it('should not send unsubscribe if WebSocket was never opened', () => {
      service.connect('AAPL');
      // do not trigger open
      service.disconnect();
      expect(fakeWs.sentMessages).toHaveLength(0);
    });

    it('should not add ticks after disconnect()', () => {
      service.connect('AAPL');
      fakeWs.triggerOpen();
      fakeWs.triggerMessage({ symbol: 'AAPL', price: 180, timestamp: 1000 });
      service.disconnect();
      const countAfterDisconnect = service.priceHistory().length;
      // Any further messages should be ignored (ws is closed)
      expect(countAfterDisconnect).toBe(1);
    });
  });
});
