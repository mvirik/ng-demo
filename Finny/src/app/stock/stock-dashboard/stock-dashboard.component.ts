import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { StockChartComponent } from '../stock-chart/stock-chart.component';
import { StockDetailsTableComponent } from '../stock-details-table/stock-details-table.component';
import { StockWebSocketService } from '../stock-websocket.service';

@Component({
  selector: 'app-stock-dashboard',
  standalone: true,
  imports: [StockChartComponent, StockDetailsTableComponent],
  templateUrl: './stock-dashboard.component.html',
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
