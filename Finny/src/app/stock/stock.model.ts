export interface StockPrice {
  timestamp: number;
  price: number;
}

export interface StockDetails {
  symbol: string;
  name: string;
  exchange: string;
  currency: string;
  currentPrice: number;
  openPrice: number;
  highPrice: number;
  lowPrice: number;
  volume: number;
  marketCap: number;
  priceChange: number;
  priceChangePercent: number;
}
