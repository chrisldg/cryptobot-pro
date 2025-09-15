// lib/grid-bot.ts
export class GridBot {
  private orders: any[] = [];
  private isRunning = false;
  
  constructor(
    private symbol: string,
    private lowerPrice: number,
    private upperPrice: number,
    private gridCount: number,
    private investment: number
  ) {}
  
  calculateGridLevels() {
    const levels = [];
    const step = (this.upperPrice - this.lowerPrice) / this.gridCount;
    
    for (let i = 0; i <= this.gridCount; i++) {
      levels.push(this.lowerPrice + (step * i));
    }
    
    return levels;
  }
  
  async start() {
    this.isRunning = true;
    const levels = this.calculateGridLevels();
    const amountPerGrid = this.investment / this.gridCount;
    
    console.log(`📊 Grid Bot started with ${this.gridCount} levels from $${this.lowerPrice} to $${this.upperPrice}`);
    
    // Placer les ordres d'achat sous le prix actuel
    const currentPrice = await this.getCurrentPrice();
    
    for (const level of levels) {
      if (level < currentPrice) {
        await this.placeLimitOrder('BUY', level, amountPerGrid / level);
      } else if (level > currentPrice) {
        await this.placeLimitOrder('SELL', level, amountPerGrid / level);
      }
    }
  }
  
  async placeLimitOrder(side: string, price: number, quantity: number) {
    // MODE DÉMO
    if (typeof window !== 'undefined' && !process.env.NEXT_PUBLIC_BINANCE_API_KEY) {
      const demoOrder = {
        orderId: 'DEMO-' + Date.now(),
        side,
        price,
        quantity,
        status: 'PENDING'
      };
      this.orders.push(demoOrder);
      console.log(`✅ [DÉMO] Grid order placed: ${side} ${quantity.toFixed(4)} @ $${price.toFixed(2)}`);
      return;
    }
    
    const response = await fetch('/api/binance/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        symbol: this.symbol,
        side,
        type: 'LIMIT',
        price: price.toFixed(2),
        quantity: quantity.toFixed(8),
        timeInForce: 'GTC'
      })
    });
    
    const result = await response.json();
    if (result.success) {
      this.orders.push(result.order);
      console.log(`✅ Grid order placed: ${side} ${quantity} @ $${price}`);
    }
  }
  
  async getCurrentPrice(): Promise<number> {
    // MODE DÉMO
    if (typeof window !== 'undefined' && !process.env.NEXT_PUBLIC_BINANCE_API_KEY) {
      const demoPrices: Record<string, number> = {
        'ETHUSDT': 3250 + Math.random() * 250,
        'BTCUSDT': 115000 + Math.random() * 1000,
        'BNBUSDT': 900 + Math.random() * 50
      };
      return demoPrices[this.symbol] || 100;
    }
    
    try {
      const res = await fetch(`/api/binance/prices?symbols=${this.symbol}`);
      const data = await res.json();
      return data.prices?.[0]?.price || this.lowerPrice + (this.upperPrice - this.lowerPrice) / 2;
    } catch (error) {
      console.error('Error fetching price:', error);
      return this.lowerPrice + (this.upperPrice - this.lowerPrice) / 2;
    }
  }
  
  stop() {
    this.isRunning = false;
    console.log('Grid bot stopped');
  }
}