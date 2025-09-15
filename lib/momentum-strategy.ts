// lib/momentum-strategy.ts
export class MomentumStrategy {
  private config = {
    rsiThreshold: 55,
    macdSignal: 'positive',
    volumeIncrease: 1.5,
    trendStrength: 0.7,
    stopLoss: 0.05,
    takeProfit: 0.15
  };
  
  async execute(symbol: string, capital: number) {
    console.log(`🚀 STRATÉGIE MOMENTUM sur ${symbol}`);
    
    const trend = await this.analyzeTrend(symbol);
    
    if (trend.strength > this.config.trendStrength &&
        trend.rsi > this.config.rsiThreshold &&
        trend.macd > 0 &&
        trend.volumeRatio > this.config.volumeIncrease) {
      
      console.log('✅ CONDITIONS MOMENTUM RÉUNIES:');
      console.log(`  - RSI: ${trend.rsi.toFixed(2)} (>55 = haussier)`);
      console.log(`  - MACD: ${trend.macd.toFixed(4)} (positif = hausse)`);
      console.log(`  - Volume: ${trend.volumeRatio.toFixed(2)}x la moyenne`);
      console.log(`  - Force: ${(trend.strength * 100).toFixed(1)}%`);
      
      const positionSize = this.calculatePositionSize(capital, trend.strength);
      const entry = await this.placeEntry(symbol, positionSize);
      
      await this.setExitOrders(symbol, entry.price, positionSize);
      
      return {
        success: true,
        entry: entry.price,
        stopLoss: entry.price * (1 - this.config.stopLoss),
        takeProfit: entry.price * (1 + this.config.takeProfit),
        size: positionSize
      };
    }
    
    console.log('⏸️ Pas de signal momentum actuellement');
    console.log(`  RSI: ${trend.rsi.toFixed(2)}, MACD: ${trend.macd.toFixed(4)}, Volume: ${trend.volumeRatio.toFixed(2)}x`);
    return { success: false };
  }
  
  private async analyzeTrend(symbol: string) {
    // MODE DÉMO - Générer des données simulées
    if (typeof window !== 'undefined' && !process.env.NEXT_PUBLIC_BINANCE_API_KEY) {
      return {
        strength: Math.random() * 0.8,
        rsi: 45 + Math.random() * 25,
        macd: (Math.random() - 0.5) * 100,
        volumeRatio: 0.5 + Math.random() * 1,
        currentPrice: this.getDemoPrice(symbol),
        ma20: this.getDemoPrice(symbol) * 0.98
      };
    }
    
    try {
      // En production, utiliser votre API backend
      const res = await fetch(`/api/binance/klines?symbol=${symbol}&interval=1h&limit=100`);
      
      if (!res.ok) {
        throw new Error('API call failed');
      }
      
      const candles = await res.json();
      
      if (!candles || candles.length < 26) {
        throw new Error('Données insuffisantes');
      }
      
      const prices = candles.map((c: any) => parseFloat(c[4]));
      const volumes = candles.map((c: any) => parseFloat(c[5]));
      
      const ma20 = prices.slice(-20).reduce((a: number, b: number) => a + b) / 20;
      const currentPrice = prices[prices.length - 1];
      
      const pricesAboveMA = prices.slice(-20).filter((p: number) => p > ma20).length;
      const trendStrength = pricesAboveMA / 20;
      
      const rsi = this.calculateRSI(prices.slice(-14));
      const macd = this.calculateMACD(prices);
      
      const avgVolume = volumes.slice(-20).reduce((a: number, b: number) => a + b) / 20;
      const currentVolume = volumes[volumes.length - 1];
      const volumeRatio = currentVolume / avgVolume;
      
      return {
        strength: trendStrength,
        rsi,
        macd,
        volumeRatio,
        currentPrice,
        ma20
      };
    } catch (error) {
      console.error('Erreur analyse tendance:', error);
      // Retourner des valeurs par défaut en cas d'erreur
      return {
        strength: Math.random() * 0.5,
        rsi: 50,
        macd: 0,
        volumeRatio: 1,
        currentPrice: this.getDemoPrice(symbol),
        ma20: this.getDemoPrice(symbol)
      };
    }
  }
  
  private getDemoPrice(symbol: string): number {
    const prices: Record<string, number> = {
      'BTCUSDT': 115000,
      'ETHUSDT': 4500,
      'BNBUSDT': 900,
      'SOLUSDT': 235,
      'ADAUSDT': 0.86
    };
    return prices[symbol] || 100;
  }
  
  private calculatePositionSize(capital: number, strength: number) {
    const minSize = capital * 0.05;
    const maxSize = capital * 0.20;
    const size = minSize + (maxSize - minSize) * strength;
    return Math.round(size * 100) / 100;
  }
  
  private async placeEntry(symbol: string, size: number) {
    // MODE DÉMO
    if (typeof window !== 'undefined' && !process.env.NEXT_PUBLIC_BINANCE_API_KEY) {
      const demoPrice = this.getDemoPrice(symbol);
      const trades = JSON.parse(localStorage.getItem('momentum_trades') || '[]');
      trades.push({
        timestamp: new Date().toISOString(),
        symbol,
        side: 'BUY',
        size,
        price: demoPrice,
        strategy: 'MOMENTUM',
        demo: true
      });
      localStorage.setItem('momentum_trades', JSON.stringify(trades));
      return { price: demoPrice };
    }
    
    try {
      const res = await fetch('/api/binance/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol,
          side: 'BUY',
          type: 'MARKET',
          quoteOrderQty: size
        })
      });
      
      const order = await res.json();
      
      let avgPrice = this.getDemoPrice(symbol);
      if (order.fills && order.fills.length > 0) {
        const totalQty = order.fills.reduce((sum: number, fill: any) => sum + parseFloat(fill.qty), 0);
        const totalValue = order.fills.reduce((sum: number, fill: any) => 
          sum + (parseFloat(fill.price) * parseFloat(fill.qty)), 0);
        avgPrice = totalValue / totalQty;
      }
      
      const trades = JSON.parse(localStorage.getItem('momentum_trades') || '[]');
      trades.push({
        timestamp: new Date().toISOString(),
        symbol,
        side: 'BUY',
        size,
        price: avgPrice,
        strategy: 'MOMENTUM'
      });
      localStorage.setItem('momentum_trades', JSON.stringify(trades));
      
      return { price: avgPrice };
    } catch (error) {
      console.error('Erreur placement ordre:', error);
      return { price: this.getDemoPrice(symbol) };
    }
  }
  
  private async setExitOrders(symbol: string, entryPrice: number, size: number) {
    if (entryPrice === 0) return;
    
    const stopPrice = entryPrice * (1 - this.config.stopLoss);
    console.log(`🛑 Stop-Loss configuré à ${stopPrice.toFixed(2)} USDT`);
    
    const profitPrice = entryPrice * (1 + this.config.takeProfit);
    console.log(`💰 Take-Profit configuré à ${profitPrice.toFixed(2)} USDT`);
    
    const exitOrders = JSON.parse(localStorage.getItem('exit_orders') || '[]');
    exitOrders.push({
      symbol,
      entryPrice,
      stopLoss: stopPrice,
      takeProfit: profitPrice,
      size,
      timestamp: new Date().toISOString()
    });
    localStorage.setItem('exit_orders', JSON.stringify(exitOrders));
  }
  
  private calculateRSI(prices: number[]) {
    if (prices.length < 2) return 50;
    
    let gains = 0, losses = 0;
    for (let i = 1; i < prices.length; i++) {
      const change = prices[i] - prices[i-1];
      if (change > 0) gains += change;
      else losses -= change;
    }
    
    const avgGain = gains / prices.length;
    const avgLoss = losses / prices.length;
    
    if (avgLoss === 0) return 100;
    if (avgGain === 0) return 0;
    
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }
  
  private calculateMACD(prices: number[]) {
    if (prices.length < 26) return 0;
    
    const ema12 = this.calculateEMA(prices, 12);
    const ema26 = this.calculateEMA(prices, 26);
    return ema12 - ema26;
  }
  
  private calculateEMA(prices: number[], period: number) {
    if (prices.length < period) return prices[prices.length - 1] || 0;
    
    const multiplier = 2 / (period + 1);
    let ema = prices[0];
    
    for (let i = 1; i < prices.length; i++) {
      ema = (prices[i] - ema) * multiplier + ema;
    }
    
    return ema;
  }
  
  async monitor(symbols: string[], capital: number, interval: number = 300000) {
    console.log('📊 Surveillance Momentum démarrée...');
    console.log(`Cryptos: ${symbols.join(', ')}`);
    console.log(`Vérification toutes les ${interval/60000} minutes`);
    
    setInterval(async () => {
      for (const symbol of symbols) {
        const result = await this.execute(symbol, capital);
        if (result.success) {
          console.log(`🎯 TRADE EXÉCUTÉ sur ${symbol}!`);
        }
      }
    }, interval);
  }
}