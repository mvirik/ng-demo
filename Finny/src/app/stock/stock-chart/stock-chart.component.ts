import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  effect,
  inject,
} from '@angular/core';
import { Chart } from 'chart.js/auto';
import { StockWebSocketService } from '../stock-websocket.service';

@Component({
  selector: 'app-stock-chart',
  standalone: true,
  templateUrl: './stock-chart.component.html',
})
export class StockChartComponent implements OnInit, OnDestroy {
  @ViewChild('chartCanvas', { static: true })
  canvasRef!: ElementRef<HTMLCanvasElement>;

  private readonly stockWs = inject(StockWebSocketService);
  private chart: Chart | null = null;

  constructor() {
    effect(() => {
      const history = this.stockWs.priceHistory();
      if (!this.chart) return;

      const labels = history.map((p) =>
        new Date(p.timestamp).toLocaleTimeString(),
      );
      const prices = history.map((p) => p.price);

      this.chart.data.labels = labels;
      (this.chart.data.datasets[0] as { data: number[] }).data = prices;
      this.chart.update('none');
    });
  }

  ngOnInit(): void {
    this.initChart();
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
    this.chart = null;
  }

  private initChart(): void {
    const history = this.stockWs.priceHistory();
    const labels = history.map((p) =>
      new Date(p.timestamp).toLocaleTimeString(),
    );
    const prices = history.map((p) => p.price);

    this.chart = new Chart(this.canvasRef.nativeElement, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'AAPL',
            data: prices,
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59,130,246,0.12)',
            borderWidth: 2,
            pointRadius: 0,
            fill: true,
            tension: 0.3,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => `$${(ctx.parsed.y as number).toFixed(2)}`,
            },
          },
        },
        scales: {
          x: {
            ticks: {
              maxTicksLimit: 8,
              color: '#94a3b8',
              font: { size: 11 },
            },
            grid: { color: 'rgba(148,163,184,0.1)' },
          },
          y: {
            ticks: {
              color: '#94a3b8',
              font: { size: 11 },
              callback: (v) => `$${(v as number).toFixed(2)}`,
            },
            grid: { color: 'rgba(148,163,184,0.1)' },
          },
        },
      },
    });
  }
}
