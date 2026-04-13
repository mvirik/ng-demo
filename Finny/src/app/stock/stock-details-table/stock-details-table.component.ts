import { Component, inject } from '@angular/core';
import { DecimalPipe, CurrencyPipe } from '@angular/common';
import { StockWebSocketService } from '../stock-websocket.service';

@Component({
  selector: 'app-stock-details-table',
  standalone: true,
  imports: [DecimalPipe, CurrencyPipe],
  templateUrl: './stock-details-table.component.html',
})
export class StockDetailsTableComponent {
  readonly stockWs = inject(StockWebSocketService);

  rows(d: ReturnType<StockWebSocketService['details']>): {
    label: string;
    value: string;
  }[] {
    return [
      { label: 'Open', value: `$${d.openPrice.toFixed(2)}` },
      { label: 'High', value: `$${d.highPrice.toFixed(2)}` },
      { label: 'Low', value: `$${d.lowPrice.toFixed(2)}` },
      { label: 'Volume', value: this.formatVolume(d.volume) },
      { label: 'Market Cap', value: this.formatMarketCap(d.marketCap) },
      { label: 'Currency', value: d.currency },
      { label: 'Exchange', value: d.exchange },
    ];
  }

  private formatVolume(v: number): string {
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(2)}M`;
    if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
    return v.toString();
  }

  private formatMarketCap(v: number): string {
    if (v >= 1_000_000_000_000)
      return `$${(v / 1_000_000_000_000).toFixed(2)}T`;
    if (v >= 1_000_000_000) return `$${(v / 1_000_000_000).toFixed(2)}B`;
    return `$${v.toFixed(0)}`;
  }
}
