import { TestBed } from '@angular/core/testing';
import { StockWebSocketService } from './stock-websocket.service';

describe('StockWebSocketService', () => {
  let service: StockWebSocketService;

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({});
    service = TestBed.inject(StockWebSocketService);
  });

  afterEach(() => {
    service.disconnect();
    vi.useRealTimers();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialise with 60 price history entries', () => {
    expect(service.priceHistory().length).toBe(60);
  });

  it('should start disconnected', () => {
    expect(service.connected()).toBe(false);
  });

  it('should set connected to true after connect()', () => {
    service.connect();
    expect(service.connected()).toBe(true);
  });

  it('should not add duplicate connections when connect() is called twice', () => {
    service.connect();
    service.connect();
    expect(service.connected()).toBe(true);
  });

  it('should add a new price tick every 1500 ms', () => {
    service.connect();
    const before = service.priceHistory().length;
    vi.advanceTimersByTime(1500);
    TestBed.flushEffects();
    expect(service.priceHistory().length).toBe(Math.min(before + 1, 60));
  });

  it('should keep history at most 60 entries', () => {
    service.connect();
    vi.advanceTimersByTime(1500 * 100);
    TestBed.flushEffects();
    expect(service.priceHistory().length).toBeLessThanOrEqual(60);
  });

  it('should set connected to false after disconnect()', () => {
    service.connect();
    service.disconnect();
    expect(service.connected()).toBe(false);
  });

  it('should stop emitting ticks after disconnect()', () => {
    service.connect();
    vi.advanceTimersByTime(1500);
    TestBed.flushEffects();
    const countAfterOneTick = service.priceHistory().length;
    service.disconnect();
    vi.advanceTimersByTime(3000);
    TestBed.flushEffects();
    expect(service.priceHistory().length).toBe(countAfterOneTick);
  });

  it('should expose a latestPrice computed signal', () => {
    const price = service.latestPrice();
    expect(price).toBeGreaterThan(0);
  });

  it('should populate stock details', () => {
    const d = service.details();
    expect(d.symbol).toBe('AAPL');
    expect(d.name).toBe('Apple Inc.');
    expect(d.exchange).toBe('NASDAQ');
    expect(d.currentPrice).toBeGreaterThan(0);
  });

  it('should update latestPrice after a tick', () => {
    service.connect();
    vi.advanceTimersByTime(1500);
    TestBed.flushEffects();
    const after = service.latestPrice();
    expect(typeof after).toBe('number');
    expect(after).toBeGreaterThan(0);
    const historyLast = service.priceHistory().at(-1)?.price;
    expect(after).toBe(historyLast);
  });
});
