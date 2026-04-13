import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { StockChartComponent } from '../stock-chart/stock-chart.component';
import { StockDetailsTableComponent } from '../stock-details-table/stock-details-table.component';
import { StockWebSocketService } from '../stock-websocket.service';

@Component({
  selector: 'app-stock-dashboard',
  standalone: true,
  imports: [StockChartComponent, StockDetailsTableComponent],
  template: `
    <div class="min-h-screen bg-slate-900 p-6">
      <header class="mb-6">
        <h1 class="text-2xl font-bold text-white tracking-tight">
          Stock Dashboard
        </h1>
        <p class="text-slate-400 text-sm mt-1">Live market data · AAPL</p>
      </header>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Chart panel -->
        <div
          class="lg:col-span-2 bg-slate-800 rounded-2xl p-5 shadow-lg flex flex-col"
        >
          <h2 class="text-slate-300 text-sm font-semibold uppercase tracking-wider mb-4">
            Price Chart
          </h2>
          <div class="flex-1 min-h-[300px]">
            <app-stock-chart />
          </div>
        </div>

        <!-- Details panel -->
        <div class="bg-slate-800 rounded-2xl p-5 shadow-lg">
          <h2 class="text-slate-300 text-sm font-semibold uppercase tracking-wider mb-4">
            Details
          </h2>
          <app-stock-details-table />
        </div>
      </div>
    </div>
  `,
})
export class StockDashboardComponent implements OnInit, OnDestroy {
  private readonly stockWs = inject(StockWebSocketService);

  ngOnInit(): void {
    this.stockWs.connect();
  }

  ngOnDestroy(): void {
    this.stockWs.disconnect();
  }
}
