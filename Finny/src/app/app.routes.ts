import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'AAPL',
    pathMatch: 'full',
  },
  {
    path: ':symbol',
    loadComponent: () =>
      import('./stock/stock-dashboard/stock-dashboard.component').then(
        (m) => m.StockDashboardComponent,
      ),
  },
];

