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
        // Ordre d'achat
        await this.placeLimitOrder('BUY', level, amountPerGrid / level);
      } else if (level > currentPrice) {
        // Ordre de vente
        await this.placeLimitOrder('SELL', level, amountPerGrid / level);
      }
    }
  }
  
  async placeLimitOrder(side: string, price: number, quantity: number) {
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
    const res = await fetch(`/api/binance/prices?symbols=${this.symbol}`);
    const data = await res.json();
    return data.prices[0].price;
  }
  
  stop() {
    this.isRunning = false;
    // Annuler tous les ordres ouverts
    console.log('Grid bot stopped');
  }
}