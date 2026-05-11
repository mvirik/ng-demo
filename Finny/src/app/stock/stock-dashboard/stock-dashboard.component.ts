import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  inject,
  input,
} from '@angular/core';
import { StockChartComponent } from '../stock-chart/stock-chart.component';
import { StockDetailsTableComponent } from '../stock-details-table/stock-details-table.component';
import { StockWebSocketService } from '../stock-websocket.service';

@Component({
  selector: 'app-stock-dashboard',
  standalone: true,
  imports: [StockChartComponent, StockDetailsTableComponent],
  templateUrl: './stock-dashboard.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StockDashboardComponent implements OnInit, OnDestroy {
  readonly symbol = input.required<string>();

  private readonly stockWs = inject(StockWebSocketService);

  ngOnInit(): void {
    this.stockWs.connect(this.symbol());
  }

  ngOnDestroy(): void {
    this.stockWs.disconnect();
  }
}
