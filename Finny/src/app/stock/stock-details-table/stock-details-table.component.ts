import { Component, inject } from '@angular/core';
import { DecimalPipe, CurrencyPipe } from '@angular/common';
import { StockWebSocketService } from '../stock-websocket.service';

@Component({
  selector: 'app-stock-details-table',
  standalone: true,
  imports: [DecimalPipe, CurrencyPipe],
  template: `
    @let d = stockWs.details();
    <div class="flex flex-col gap-2">
      <div class="flex items-baseline gap-3">
        <span class="text-2xl font-bold text-white">{{ d.symbol }}</span>
        <span class="text-sm text-slate-400">{{ d.name }}</span>
      </div>

      <div class="flex items-baseline gap-2">
        <span class="text-3xl font-semibold text-white">
          {{ d.currentPrice | currency : d.currency }}
        </span>
        <span
          class="text-sm font-medium"
          [class.text-emerald-400]="d.priceChange >= 0"
          [class.text-red-400]="d.priceChange < 0"
        >
          {{ d.priceChange >= 0 ? '+' : '' }}{{ d.priceChange | number : '1.2-2' }}
          ({{ d.priceChangePercent >= 0 ? '+' : ''
          }}{{ d.priceChangePercent | number : '1.2-2' }}%)
        </span>
      </div>

      <div class="mt-4 overflow-hidden rounded-lg border border-slate-700">
        <table class="w-full text-sm">
          <tbody>
            @for (row of rows(d); track row.label) {
              <tr class="border-b border-slate-700 last:border-0">
                <td class="px-4 py-2.5 text-slate-400 font-medium w-1/2">
                  {{ row.label }}
                </td>
                <td class="px-4 py-2.5 text-white text-right">
                  {{ row.value }}
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <div class="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
        <span
          class="inline-block w-2 h-2 rounded-full"
          [class.bg-emerald-400]="stockWs.connected()"
          [class.bg-slate-500]="!stockWs.connected()"
        ></span>
        {{ stockWs.connected() ? 'Live' : 'Disconnected' }} ·
        {{ d.exchange }}
      </div>
    </div>
  `,
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
