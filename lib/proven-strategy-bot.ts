// lib/proven-strategy-bot.ts
export class ProvenStrategyBot {
  private strategies = {
    DCA: { weight: 0.3, active: true },
    GRID: { weight: 0.2, active: true },
    MOMENTUM: { weight: 0.25, active: true },
    MEAN_REVERSION: { weight: 0.25, active: true }
  };

  async executeComboStrategy(symbol: string, capital: number) {
    console.log('🏆 Exécution Stratégie Combinée Éprouvée');
    
    const dcaAmount = capital * 0.3;
    if (this.strategies.DCA.active) {
      await this.executeDCA(symbol, dcaAmount);
    }
    
    const gridAmount = capital * 0.2;
    if (this.strategies.GRID.active) {
      await this.executeGrid(symbol, gridAmount);
    }
    
    const momentumAmount = capital * 0.25;
    if (this.strategies.MOMENTUM.active) {
      await this.executeMomentum(symbol, momentumAmount);
    }
    
    const reversionAmount = capital * 0.25;
    if (this.strategies.MEAN_REVERSION.active) {
      await this.executeMeanReversion(symbol, reversionAmount);
    }
  }
  
  private async executeDCA(symbol: string, amount: number) {
    console.log(`💰 DCA: Investir ${amount} USDT en ${symbol}`);
    const dailyAmount = amount / 10;
    return this.placeOrder(symbol, 'BUY', dailyAmount);
  }
  
  private async executeGrid(symbol: string, amount: number) {
    const price = await this.getCurrentPrice(symbol);
    const gridLevels = 5;
    const gridSpacing = 0.02;
    
    for (let i = 1; i <= gridLevels; i++) {
      const buyPrice = price * (1 - gridSpacing * i);
      const sellPrice = price * (1 + gridSpacing * i);
      console.log(`📊 Grid: Buy à ${buyPrice}, Sell à ${sellPrice}`);
    }
  }
  
  private async executeMomentum(symbol: string, amount: number) {
    const indicators = await this.calculateIndicators(symbol);
    
    if (indicators.rsi > 50 && indicators.macd > 0) {
      console.log(`📈 MOMENTUM: Signal d'achat fort`);
      return this.placeOrder(symbol, 'BUY', amount);
    }
  }
  
  private async executeMeanReversion(symbol: string, amount: number) {
    const indicators = await this.calculateIndicators(symbol);
    
    if (indicators.rsi < 30) {
      console.log(`🎯 MEAN REVERSION: Oversold, bon point d'entrée`);
      return this.placeOrder(symbol, 'BUY', amount);
    }
  }
  
  // MÉTHODES MANQUANTES AJOUTÉES
  private async getCurrentPrice(symbol: string): Promise<number> {
    const res = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`);
    const data = await res.json();
    return parseFloat(data.price);
  }
  
  private async getHistoricalPrices(symbol: string): Promise<number[]> {
    const res = await fetch(`https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=1h&limit=100`);
    const data = await res.json();
    return data.map((candle: any) => parseFloat(candle[4])); // Close prices
  }
  
  private async placeOrder(symbol: string, side: string, amount: number) {
    const res = await fetch('/api/binance/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        symbol,
        side,
        type: 'MARKET',
        quoteOrderQty: amount
      })
    });
    return res.json();
  }
  
  private calculateMACD(prices: number[]) {
    const ema12 = this.calculateEMA(prices, 12);
    const ema26 = this.calculateEMA(prices, 26);
    return ema12 - ema26;
  }
  
  private calculateEMA(prices: number[], period: number) {
    const multiplier = 2 / (period + 1);
    let ema = prices[0];
    
    for (let i = 1; i < prices.length; i++) {
      ema = (prices[i] - ema) * multiplier + ema;
    }
    return ema;
  }
  
  private calculateBollingerBands(prices: number[]) {
    const sma = prices.reduce((a, b) => a + b) / prices.length;
    const variance = prices.reduce((sum, price) => sum + Math.pow(price - sma, 2), 0) / prices.length;
    const stdDev = Math.sqrt(variance);
    
    return {
      upper: sma + (stdDev * 2),
      middle: sma,
      lower: sma - (stdDev * 2)
    };
  }
  
  private async calculateIndicators(symbol: string) {
    const prices = await this.getHistoricalPrices(symbol);
    const rsi = this.calculateRSI(prices);
    const macd = this.calculateMACD(prices);
    const bb = this.calculateBollingerBands(prices);
    return { rsi, macd, bb };
  }
  
  private calculateRSI(prices: number[], period: number = 14) {
    let gains = 0, losses = 0;
    
    for (let i = 1; i < Math.min(period, prices.length); i++) {
      const change = prices[i] - prices[i-1];
      if (change > 0) gains += change;
      else losses -= change;
    }
    
    const avgGain = gains / period;
    const avgLoss = losses / period;
    
    if (avgLoss === 0) return 100;
    
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }
}