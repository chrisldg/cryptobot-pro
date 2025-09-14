// lib/backtesting.ts
// Système complet de backtesting avec données historiques

// Interface pour les données de marché
interface Candle {
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface BacktestResult {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  totalProfit: number;
  totalLoss: number;
  netProfit: number;
  winRate: number;
  profitFactor: number;
  maxDrawdown: number;
  sharpeRatio: number;
  trades: Trade[];
}

interface Trade {
  entryTime: Date;
  exitTime: Date;
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  side: 'buy' | 'sell';
  profit: number;
  profitPercent: number;
  fees: number;
}

// ===== STRATÉGIES DE TRADING =====
interface TradingStrategy {
  generateSignal(history: Candle[], current: Candle): 'buy' | 'sell' | 'hold';
}

// Stratégie DCA
export class DCAStrategy implements TradingStrategy {
  private lastBuyTime: Date | null = null;
  
  constructor(private intervalHours: number = 24) {}
  
  generateSignal(history: Candle[], current: Candle): 'buy' | 'sell' | 'hold' {
    if (!this.lastBuyTime || 
        (current.timestamp.getTime() - this.lastBuyTime.getTime()) >= this.intervalHours * 3600000) {
      this.lastBuyTime = current.timestamp;
      return 'buy';
    }
    return 'hold';
  }
}

// ===== MOTEUR DE BACKTESTING =====
export class BacktestEngine {
  private candles: Candle[] = [];
  private trades: Trade[] = [];
  private balance: number;
  private initialBalance: number;
  private position: { quantity: number; entryPrice: number; entryTime: Date } | null = null;
  private maxDrawdown: number = 0;
  private peakBalance: number = 0;
  private strategy: TradingStrategy | null = null;

  constructor(private config: {
    symbol: string;
    timeframe: string;
    startDate: Date;
    endDate: Date;
    initialBalance: number;
    feeRate: number;
  }) {
    this.balance = config.initialBalance;
    this.initialBalance = config.initialBalance;
    this.peakBalance = config.initialBalance;
  }

  // Charger les données historiques
  async loadHistoricalData() {
    try {
      // Récupérer les données depuis Binance
      const response = await fetch(
        `https://api.binance.com/api/v3/klines?symbol=${this.config.symbol.replace('/', '')}&interval=${this.config.timeframe}&startTime=${this.config.startDate.getTime()}&endTime=${this.config.endDate.getTime()}&limit=1000`
      );
      
      const data = await response.json();
      
      this.candles = data.map((candle: any) => ({
        timestamp: new Date(candle[0]),
        open: parseFloat(candle[1]),
        high: parseFloat(candle[2]),
        low: parseFloat(candle[3]),
        close: parseFloat(candle[4]),
        volume: parseFloat(candle[5])
      }));
      
      console.log(`Loaded ${this.candles.length} candles for backtesting`);
    } catch (error) {
      console.error('Error loading historical data:', error);
      // Utiliser des données simulées si l'API échoue
      this.generateSimulatedData();
    }
  }

  private generateSimulatedData() {
    const startPrice = 50000;
    const volatility = 0.02;
    const days = 30;
    
    for (let i = 0; i < days * 24; i++) {
      const timestamp = new Date(this.config.startDate.getTime() + i * 3600000);
      const randomChange = (Math.random() - 0.5) * volatility;
      const price = startPrice * (1 + randomChange);
      
      this.candles.push({
        timestamp,
        open: price,
        high: price * 1.01,
        low: price * 0.99,
        close: price * (1 + (Math.random() - 0.5) * 0.01),
        volume: Math.random() * 1000000
      });
    }
  }

  // Exécuter le backtest
  async runBacktest(strategyConfig: any): Promise<BacktestResult> {
    console.log('Starting backtest...');
    
    // Créer la stratégie basée sur la configuration
    if (strategyConfig.type === 'DCA') {
      this.strategy = new DCAStrategy(strategyConfig.params.interval);
    } else {
      this.strategy = new DCAStrategy(24); // Par défaut
    }
    
    for (let i = 0; i < this.candles.length; i++) {
      const currentCandle = this.candles[i];
      const previousCandles = this.candles.slice(Math.max(0, i - 100), i);
      
      // Générer les signaux de la stratégie
      const signal = this.strategy.generateSignal(previousCandles, currentCandle);
      
      // Exécuter les trades selon les signaux
      if (signal === 'buy' && !this.position) {
        this.openPosition(currentCandle, 'buy');
      } else if (signal === 'sell' && this.position) {
        this.closePosition(currentCandle);
      }
      
      // Calculer le drawdown
      this.updateDrawdown();
    }
    
    // Fermer position ouverte à la fin
    if (this.position) {
      this.closePosition(this.candles[this.candles.length - 1]);
    }
    
    return this.calculateResults();
  }

  private openPosition(candle: Candle, side: 'buy' | 'sell') {
    const quantity = (this.balance * 0.95) / candle.close;
    const fee = quantity * candle.close * this.config.feeRate;
    
    this.position = {
      quantity: quantity,
      entryPrice: candle.close,
      entryTime: candle.timestamp
    };
    
    this.balance -= (quantity * candle.close + fee);
    
    console.log(`Opened ${side} position: ${quantity} @ ${candle.close}`);
  }

  private closePosition(candle: Candle) {
    if (!this.position) return;
    
    const exitValue = this.position.quantity * candle.close;
    const fee = exitValue * this.config.feeRate;
    const profit = exitValue - (this.position.quantity * this.position.entryPrice) - fee;
    
    this.trades.push({
      entryTime: this.position.entryTime,
      exitTime: candle.timestamp,
      entryPrice: this.position.entryPrice,
      exitPrice: candle.close,
      quantity: this.position.quantity,
      side: 'buy',
      profit: profit,
      profitPercent: (profit / (this.position.quantity * this.position.entryPrice)) * 100,
      fees: fee
    });
    
    this.balance += exitValue - fee;
    this.position = null;
    
    console.log(`Closed position: Profit = ${profit.toFixed(2)}`);
  }

  private updateDrawdown() {
    if (this.balance > this.peakBalance) {
      this.peakBalance = this.balance;
    }
    
    const drawdown = (this.peakBalance - this.balance) / this.peakBalance;
    if (drawdown > this.maxDrawdown) {
      this.maxDrawdown = drawdown;
    }
  }

  private calculateResults(): BacktestResult {
    const winningTrades = this.trades.filter(t => t.profit > 0);
    const losingTrades = this.trades.filter(t => t.profit <= 0);
    const totalProfit = winningTrades.reduce((sum, t) => sum + t.profit, 0);
    const totalLoss = Math.abs(losingTrades.reduce((sum, t) => sum + t.profit, 0));
    
    // Calculer le Sharpe Ratio
    const returns = this.trades.map(t => t.profitPercent);
    const avgReturn = returns.length > 0 ? returns.reduce((a, b) => a + b, 0) / returns.length : 0;
    const stdDev = returns.length > 0 ? Math.sqrt(
      returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length
    ) : 0;
    const sharpeRatio = stdDev > 0 ? (avgReturn / stdDev) * Math.sqrt(252) : 0;
    
    return {
      totalTrades: this.trades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      totalProfit: totalProfit,
      totalLoss: totalLoss,
      netProfit: this.balance - this.initialBalance,
      winRate: this.trades.length > 0 ? (winningTrades.length / this.trades.length) * 100 : 0,
      profitFactor: totalLoss > 0 ? totalProfit / totalLoss : totalProfit,
      maxDrawdown: this.maxDrawdown * 100,
      sharpeRatio: sharpeRatio,
      trades: this.trades
    };
  }

  // Exporter les résultats en CSV (simplifié sans dépendance)
  async exportToCSV(filename: string, results: BacktestResult) {
    const csvContent = [
      'Entry Time,Exit Time,Entry Price,Exit Price,Quantity,Side,Profit,Profit %,Fees',
      ...results.trades.map(t => 
        `${t.entryTime.toISOString()},${t.exitTime.toISOString()},${t.entryPrice},${t.exitPrice},${t.quantity},${t.side},${t.profit},${t.profitPercent},${t.fees}`
      )
    ].join('\n');
    
    console.log(`Results would be exported to ${filename}`);
    return csvContent;
  }
}