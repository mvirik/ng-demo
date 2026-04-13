import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { StockDetailsTableComponent } from './stock-details-table.component';
import { StockWebSocketService } from '../stock-websocket.service';
import { signal } from '@angular/core';
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

function createMockService(connected = true): Partial<StockWebSocketService> {
  return {
    details: signal(mockDetails).asReadonly(),
    connected: signal(connected).asReadonly(),
  };
}

describe('StockDetailsTableComponent', () => {
  let fixture: ComponentFixture<StockDetailsTableComponent>;
  let component: StockDetailsTableComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StockDetailsTableComponent],
      providers: [
        {
          provide: StockWebSocketService,
          useValue: createMockService(),
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(StockDetailsTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display the stock symbol', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('AAPL');
  });

  it('should display the stock name', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Apple Inc.');
  });

  it('should show positive price change in green', () => {
    const el = fixture.nativeElement as HTMLElement;
    const changeEl = el.querySelector('.text-emerald-400');
    expect(changeEl).toBeTruthy();
  });

  it('should show Live status when connected', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Live');
  });

  it('should show NASDAQ exchange', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('NASDAQ');
  });

  it('should format volume in millions', () => {
    const vol = component['formatVolume'](55_000_000);
    expect(vol).toBe('55.00M');
  });

  it('should format volume in thousands', () => {
    const vol = component['formatVolume'](5_500);
    expect(vol).toBe('5.5K');
  });

  it('should format market cap in trillions', () => {
    const mc = component['formatMarketCap'](2_818_000_000_000);
    expect(mc).toBe('$2.82T');
  });

  it('should format market cap in billions', () => {
    const mc = component['formatMarketCap'](500_000_000_000);
    expect(mc).toBe('$500.00B');
  });

  it('should return correct number of table rows', () => {
    const rows = component.rows(mockDetails);
    expect(rows.length).toBe(7);
  });

  it('should show negative change in red when price drops', async () => {
    const negDetails: StockDetails = { ...mockDetails, priceChange: -3, priceChangePercent: -1.5 };
    await TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [StockDetailsTableComponent],
      providers: [
        { provide: StockWebSocketService, useValue: { details: signal(negDetails).asReadonly(), connected: signal(true).asReadonly() } },
      ],
    }).compileComponents();
    const f = TestBed.createComponent(StockDetailsTableComponent);
    f.detectChanges();
    await f.whenStable();
    const el = f.nativeElement as HTMLElement;
    expect(el.querySelector('.text-red-400')).toBeTruthy();
  });
});
