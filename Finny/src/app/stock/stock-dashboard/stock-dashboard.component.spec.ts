import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StockDashboardComponent } from './stock-dashboard.component';
import { StockWebSocketService } from '../stock-websocket.service';
import { StockChartComponent } from '../stock-chart/stock-chart.component';
import { Component, signal } from '@angular/core';
import { StockDetails } from '../stock.model';

const mockDetails: StockDetails = {
  symbol: 'AAPL',
  name: 'Apple Inc.',
  exchange: 'NASDAQ',
  currency: 'USD',
  currentPrice: 182.5,
  openPrice: 180.0,
  highPrice: 184.0,
  lowPrice: 179.5,
  volume: 55_000_000,
  marketCap: 2_818_000_000_000,
  priceChange: 2.5,
  priceChangePercent: 1.39,
};

@Component({ selector: 'app-stock-chart', standalone: true, template: '' })
class StubStockChartComponent {}

class MockStockWebSocketService {
  private _connected = signal(false);
  private _priceHistory = signal([{ timestamp: Date.now(), price: 182.5 }]);
  private _details = signal(mockDetails);

  readonly connected = this._connected.asReadonly();
  readonly priceHistory = this._priceHistory.asReadonly();
  readonly details = this._details.asReadonly();
  readonly latestPrice = signal(182.5).asReadonly();

  connectCalled = false;
  disconnectCalled = false;

  connect(): void {
    this.connectCalled = true;
    this._connected.set(true);
  }

  disconnect(): void {
    this.disconnectCalled = true;
    this._connected.set(false);
  }
}

describe('StockDashboardComponent', () => {
  let fixture: ComponentFixture<StockDashboardComponent>;
  let component: StockDashboardComponent;
  let mockService: MockStockWebSocketService;

  beforeEach(async () => {
    mockService = new MockStockWebSocketService();

    await TestBed.configureTestingModule({
      imports: [StockDashboardComponent],
      providers: [
        { provide: StockWebSocketService, useValue: mockService },
      ],
    })
      .overrideComponent(StockDashboardComponent, {
        remove: { imports: [StockChartComponent] },
        add: { imports: [StubStockChartComponent] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(StockDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call connect() on init', () => {
    expect(mockService.connectCalled).toBe(true);
  });

  it('should call disconnect() on destroy', () => {
    fixture.destroy();
    expect(mockService.disconnectCalled).toBe(true);
  });

  it('should render the Stock Dashboard heading', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Stock Dashboard');
  });

  it('should render the chart panel', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('app-stock-chart')).toBeTruthy();
  });

  it('should render the details panel', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('app-stock-details-table')).toBeTruthy();
  });
});
