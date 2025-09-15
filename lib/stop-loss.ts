// lib/stop-loss.ts - Version complète
export class StopLossMonitor {
  private checkInterval: NodeJS.Timeout | null = null;
  
  constructor(
    private symbol: string,
    private purchasePrice: number,
    private stopLossPercent: number,
    private quantity: number
  ) {}
  
  start() {
    console.log(`🛑 Stop-Loss activé pour ${this.symbol} à -${this.stopLossPercent}%`);
    // Vérifier toutes les minutes
    this.checkInterval = setInterval(async () => {
      await this.checkStopLoss();
    }, 60000);
    
    // Vérification immédiate
    this.checkStopLoss();
  }
  
  async checkStopLoss() {
    const currentPrice = await this.getCurrentPrice();
    const loss = ((this.purchasePrice - currentPrice) / this.purchasePrice) * 100;
    
    console.log(`📊 ${this.symbol}: Prix actuel $${currentPrice}, P&L: ${loss.toFixed(2)}%`);
    
    if (loss >= this.stopLossPercent) {
      console.log(`🚨 Stop-loss déclenché! Vente de ${this.quantity} ${this.symbol} à $${currentPrice}`);
      await this.executeSell();
      this.stop();
    }
  }
  
  async executeSell() {
    try {
      const response = await fetch('/api/binance/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: this.symbol,
          side: 'SELL',
          type: 'MARKET',
          quantity: this.quantity.toFixed(8),
          testMode: true // IMPORTANT: Mode test
        })
      });
      
      const result = await response.json();
      console.log('🔔 Ordre de vente stop-loss:', result);
    } catch (error) {
      console.error('Erreur stop-loss sell:', error);
    }
  }
  
  async getCurrentPrice(): Promise<number> {
    try {
      const res = await fetch(`/api/binance/prices?symbols=${this.symbol}`);
      const data = await res.json();
      
      if (data.prices && data.prices.length > 0) {
        return parseFloat(data.prices[0].price);
      }
      
      // Fallback
      const fallbackRes = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${this.symbol}`);
      const fallbackData = await fallbackRes.json();
      return parseFloat(fallbackData.price);
    } catch (error) {
      console.error('Prix non disponible:', error);
      return this.purchasePrice;
    }
  }
  
  stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      console.log('⏹️ Stop-Loss désactivé');
    }
  }
}