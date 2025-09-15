// lib/momentum-strategy.ts
export class MomentumStrategy {
  private config = {
    rsiThreshold: 55,        // Acheter quand RSI > 55
    macdSignal: 'positive',   // MACD doit être positif
    volumeIncrease: 1.5,      // Volume 50% supérieur à la moyenne
    trendStrength: 0.7,       // Force de tendance minimale
    stopLoss: 0.05,          // Stop loss à -5%
    takeProfit: 0.15         // Take profit à +15%
  };
  
  async execute(symbol: string, capital: number) {
    console.log(`🚀 STRATÉGIE MOMENTUM sur ${symbol}`);
    
    // 1. Analyser la tendance
    const trend = await this.analyzeTrend(symbol);
    
    // 2. Vérifier les conditions d'entrée
    if (trend.strength > this.config.trendStrength &&
        trend.rsi > this.config.rsiThreshold &&
        trend.macd > 0 &&
        trend.volumeRatio > this.config.volumeIncrease) {
      
      console.log('✅ CONDITIONS MOMENTUM RÉUNIES:');
      console.log(`  - RSI: ${trend.rsi.toFixed(2)} (>55 = haussier)`);
      console.log(`  - MACD: ${trend.macd.toFixed(4)} (positif = hausse)`);
      console.log(`  - Volume: ${trend.volumeRatio.toFixed(2)}x la moyenne`);
      console.log(`  - Force: ${(trend.strength * 100).toFixed(1)}%`);
      
      // 3. Calculer la taille de position
      const positionSize = this.calculatePositionSize(capital, trend.strength);
      
      // 4. Placer l'ordre avec stop-loss et take-profit
      const entry = await this.placeEntry(symbol, positionSize);
      
      // 5. Configurer les sorties automatiques
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
    try {
      // Récupérer les données
      const res = await fetch(`https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=1h&limit=100`);
      const candles = await res.json();
      
      // Vérifier si les données sont valides
      if (!candles || candles.length < 26) {
        throw new Error('Données insuffisantes pour l\'analyse');
      }
      
      // Calculer les indicateurs
      const prices = candles.map((c: any) => parseFloat(c[4]));
      const volumes = candles.map((c: any) => parseFloat(c[5]));
      
      // Moyenne mobile 20 périodes
      const ma20 = prices.slice(-20).reduce((a, b) => a + b) / 20;
      const currentPrice = prices[prices.length - 1];
      
      // Calculer la force de la tendance
      const pricesAboveMA = prices.slice(-20).filter(p => p > ma20).length;
      const trendStrength = pricesAboveMA / 20;
      
      // RSI
      const rsi = this.calculateRSI(prices.slice(-14));
      
      // MACD
      const macd = this.calculateMACD(prices);
      
      // Volume ratio
      const avgVolume = volumes.slice(-20).reduce((a, b) => a + b) / 20;
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
      return {
        strength: 0,
        rsi: 50,
        macd: 0,
        volumeRatio: 1,
        currentPrice: 0,
        ma20: 0
      };
    }
  }
  
  private calculatePositionSize(capital: number, strength: number) {
    // Plus la tendance est forte, plus on investit (entre 5% et 20% du capital)
    const minSize = capital * 0.05;
    const maxSize = capital * 0.20;
    const size = minSize + (maxSize - minSize) * strength;
    
    // Arrondir à 2 décimales
    return Math.round(size * 100) / 100;
  }
  
  private async placeEntry(symbol: string, size: number) {
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
      
      // Calculer le prix moyen d'entrée
      let avgPrice = 0;
      if (order.fills && order.fills.length > 0) {
        const totalQty = order.fills.reduce((sum: number, fill: any) => sum + parseFloat(fill.qty), 0);
        const totalValue = order.fills.reduce((sum: number, fill: any) => 
          sum + (parseFloat(fill.price) * parseFloat(fill.qty)), 0);
        avgPrice = totalValue / totalQty;
      }
      
      // Sauvegarder dans localStorage
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
      return { price: 0 };
    }
  }
  
  private async setExitOrders(symbol: string, entryPrice: number, size: number) {
    if (entryPrice === 0) return;
    
    // Configurer stop-loss
    const stopPrice = entryPrice * (1 - this.config.stopLoss);
    console.log(`🛑 Stop-Loss configuré à ${stopPrice.toFixed(2)} USDT`);
    
    // Configurer take-profit
    const profitPrice = entryPrice * (1 + this.config.takeProfit);
    console.log(`💰 Take-Profit configuré à ${profitPrice.toFixed(2)} USDT`);
    
    // Sauvegarder les ordres de sortie
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
  
  // Méthodes auxiliaires
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
  
  // Méthode pour surveiller en continu
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