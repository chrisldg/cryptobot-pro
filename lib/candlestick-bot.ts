// lib/candlestick-bot.ts
export class CandlestickBot {
  private patterns = {
    HAMMER: 'bullish',
    INVERTED_HAMMER: 'bullish',
    DOJI: 'neutral',
    ENGULFING_BULLISH: 'bullish',
    ENGULFING_BEARISH: 'bearish',
    SHOOTING_STAR: 'bearish',
    HANGING_MAN: 'bearish',
    MORNING_STAR: 'bullish',
    EVENING_STAR: 'bearish'
  };

  private lastPattern: any = null; // AJOUTEZ cette propriété

  async analyzeCandles(symbol: string) {
    // Récupérer les 50 dernières bougies
    const candles = await this.fetchCandles(symbol, '1h', 50);
    
    // Analyser les 3 dernières bougies
    const recent = candles.slice(-3);
    const pattern = this.detectPattern(recent);
    
    console.log(`🕯️ Pattern détecté sur ${symbol}: ${pattern.name}`);
    console.log(`📊 Signal: ${pattern.signal}`);
    console.log(`💪 Force: ${pattern.strength}%`);
    
    return this.executeStrategy(pattern, symbol);
  }

  private detectPattern(candles: any[]) {
    const [prev, current, next] = candles;
    
    // Calculs de base
    const body = Math.abs(current.close - current.open);
    const upperWick = current.high - Math.max(current.open, current.close);
    const lowerWick = Math.min(current.open, current.close) - current.low;
    const totalRange = current.high - current.low;
    
    // DOJI - Corps très petit
    if (body / totalRange < 0.1) {
      return {
        name: 'DOJI',
        signal: 'INDÉCISION - Attendre confirmation',
        strength: 50,
        action: 'HOLD'
      };
    }
    
    // HAMMER - Mèche basse longue, corps en haut
    if (lowerWick > body * 2 && upperWick < body * 0.5) {
      return {
        name: 'HAMMER (Marteau)',
        signal: 'RETOURNEMENT HAUSSIER probable',
        strength: 75,
        action: 'BUY'
      };
    }
    
    // SHOOTING STAR - Mèche haute longue, corps en bas
    if (upperWick > body * 2 && lowerWick < body * 0.5) {
      return {
        name: 'SHOOTING STAR (Étoile filante)',
        signal: 'RETOURNEMENT BAISSIER probable',
        strength: 75,
        action: 'SELL'
      };
    }
    
    // ENGULFING BULLISH
    if (current.close > current.open && 
        prev.close < prev.open &&
        current.open < prev.close &&
        current.close > prev.open) {
      return {
        name: 'ENGULFING BULLISH (Avalement haussier)',
        signal: 'FORT signal HAUSSIER',
        strength: 85,
        action: 'BUY'
      };
    }
    
    // ENGULFING BEARISH
    if (current.close < current.open && 
        prev.close > prev.open &&
        current.open > prev.close &&
        current.close < prev.open) {
      return {
        name: 'ENGULFING BEARISH (Avalement baissier)',
        signal: 'FORT signal BAISSIER',
        strength: 85,
        action: 'SELL'
      };
    }
    
    return {
      name: 'AUCUN PATTERN',
      signal: 'Continuer à observer',
      strength: 0,
      action: 'HOLD'
    };
  }

  private async executeStrategy(pattern: any, symbol: string) {
    const amount = 50; // USDT par trade
    
    switch(pattern.action) {
      case 'BUY':
        if (pattern.strength > 70) {
          console.log(`✅ ACHAT ${symbol} - Pattern: ${pattern.name}`);
          return this.placeBuyOrder(symbol, amount);
        }
        break;
        
      case 'SELL':
        if (pattern.strength > 70) {
          console.log(`🔴 VENTE positions ${symbol}`);
          return this.closeLongPositions(symbol);
        }
        break;
        
      default:
        console.log(`⏸️ HOLD - Attendre meilleur signal`);
    }
  }

  private async fetchCandles(symbol: string, interval: string, limit: number) {
    const response = await fetch(
      `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`
    );
    
    const data = await response.json();
    return data.map((candle: any) => ({
      time: candle[0],
      open: parseFloat(candle[1]),
      high: parseFloat(candle[2]),
      low: parseFloat(candle[3]),
      close: parseFloat(candle[4]),
      volume: parseFloat(candle[5])
    }));
  }

  // AJOUTEZ TOUTES CES MÉTHODES ICI (après fetchCandles) :
  
  private async placeBuyOrder(symbol: string, amount: number) {
    const res = await fetch('/api/binance/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        symbol,
        side: 'BUY',
        type: 'MARKET',
        quoteOrderQty: amount
      })
    });
    
    const data = await res.json();
    if (data.success) {
      const trades = JSON.parse(localStorage.getItem('candlestick_trades') || '[]');
      trades.push({
        timestamp: new Date(),
        symbol,
        action: 'BUY',
        amount,
        pattern: this.lastPattern
      });
      localStorage.setItem('candlestick_trades', JSON.stringify(trades));
    }
    return data;
  }
  
  private async closeLongPositions(symbol: string) {
    const trades = JSON.parse(localStorage.getItem('trade_history') || '[]');
    const openPositions = trades.filter((t: any) => 
      t.symbol === symbol && t.side === 'BUY'
    );
    
    if (openPositions.length > 0) {
      const totalQuantity = openPositions.reduce((sum: number, t: any) => 
        sum + t.quantity, 0
      );
      
      return await fetch('/api/binance/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol,
          side: 'SELL',
          type: 'MARKET',
          quantity: totalQuantity
        })
      });
    }
  }
  
  private detectAdvancedPatterns(candles: any[]) {
    const patterns = [];
    
    if (candles.length >= 3) {
      const last3 = candles.slice(-3);
      if (last3.every((c: any) => c.close > c.open) &&
          last3[1].close > last3[0].close &&
          last3[2].close > last3[1].close) {
        patterns.push({
          name: 'THREE WHITE SOLDIERS',
          signal: 'Très HAUSSIER - Momentum fort',
          strength: 90,
          action: 'BUY'
        });
      }
    }
    
    if (candles.length >= 3) {
      const last3 = candles.slice(-3);
      if (last3.every((c: any) => c.close < c.open) &&
          last3[1].close < last3[0].close &&
          last3[2].close < last3[1].close) {
        patterns.push({
          name: 'THREE BLACK CROWS',
          signal: 'Très BAISSIER - Forte pression vendeuse',
          strength: 90,
          action: 'SELL'
        });
      }
    }
    
    return patterns;
  }
  
  async startMonitoring(symbols: string[], interval: number = 60000) {
    console.log('🕯️ Surveillance des patterns démarrée...');
    
    setInterval(async () => {
      for (const symbol of symbols) {
        const pattern = await this.analyzeCandles(symbol);
        
        if (pattern && pattern.strength > 80) {
          console.log(`⚠️ ALERTE ${symbol}: ${pattern.name}`);
          
          if (window.Notification && Notification.permission === 'granted') {
            new Notification(`Signal ${symbol}`, {
              body: `${pattern.name} - ${pattern.signal}`,
              icon: pattern.action === 'BUY' ? '🟢' : '🔴'
            });
          }
        }
      }
    }, interval);
  }
}