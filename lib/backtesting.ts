// lib/backtesting.ts
// Système complet de backtesting avec données historiques

import { parse } from 'csv-parse';
import { createObjectCsvWriter } from 'csv-writer';

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

// ===== MOTEUR DE BACKTESTING =====
export class BacktestingEngine {
  private candles: Candle[] = [];
  private trades: Trade[] = [];
  private balance: number;
  private initialBalance: number;
  private position: { quantity: number; entryPrice: number; entryTime: Date } | null = null;
  private maxDrawdown: number = 0;
  private peakBalance: number = 0;

  constructor(
    private strategy: TradingStrategy,
    private startBalance: number = 10000,
    private feePercent: number = 0.001 // 0.1% fee
  ) {
    this.balance = startBalance;
    this.initialBalance = startBalance;
    this.peakBalance = startBalance;
  }

  // Charger les données historiques
  async loadHistoricalData(symbol: string, timeframe: string, startDate: Date, endDate: Date) {
    try {
      // Récupérer les données depuis Binance
      const response = await fetch(
        `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${timeframe}&startTime=${startDate.getTime()}&endTime=${endDate.getTime()}&limit=1000`
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
      throw error;
    }
  }

  // Exécuter le backtest
  async runBacktest(): Promise<BacktestResult> {
    console.log('Starting backtest...');
    
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
    const quantity = (this.balance * 0.95) / candle.close; // Utiliser 95% du capital
    const fee = quantity * candle.close * this.feePercent;
    
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
    const fee = exitValue * this.feePercent;
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
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const stdDev = Math.sqrt(
      returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length
    );
    const sharpeRatio = stdDev > 0 ? (avgReturn / stdDev) * Math.sqrt(252) : 0; // Annualisé
    
    return {
      totalTrades: this.trades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      totalProfit: totalProfit,
      totalLoss: totalLoss,
      netProfit: this.balance - this.initialBalance,
      winRate: (winningTrades.length / this.trades.length) * 100,
      profitFactor: totalLoss > 0 ? totalProfit / totalLoss : totalProfit,
      maxDrawdown: this.maxDrawdown * 100,
      sharpeRatio: sharpeRatio,
      trades: this.trades
    };
  }

  // Exporter les résultats en CSV
  async exportToCSV(filename: string, results: BacktestResult) {
    const csvWriter = createObjectCsvWriter({
      path: filename,
      header: [
        { id: 'entryTime', title: 'Entry Time' },
        { id: 'exitTime', title: 'Exit Time' },
        { id: 'entryPrice', title: 'Entry Price' },
        { id: 'exitPrice', title: 'Exit Price' },
        { id: 'quantity', title: 'Quantity' },
        { id: 'side', title: 'Side' },
        { id: 'profit', title: 'Profit' },
        { id: 'profitPercent', title: 'Profit %' },
        { id: 'fees', title: 'Fees' }
      ]
    });
    
    await csvWriter.writeRecords(results.trades);
    console.log(`Results exported to ${filename}`);
  }
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

// Stratégie Grid
export class GridStrategy implements TradingStrategy {
  constructor(
    private gridLevels: number = 10,
    private gridSpacing: number = 0.01 // 1% entre les grilles
  ) {}
  
  generateSignal(history: Candle[], current: Candle): 'buy' | 'sell' | 'hold' {
    if (history.length < 20) return 'hold';
    
    const sma20 = history.slice(-20).reduce((sum, c) => sum + c.close, 0) / 20;
    const deviation = (current.close - sma20) / sma20;
    
    if (deviation < -this.gridSpacing * 2) {
      return 'buy';
    } else if (deviation > this.gridSpacing * 2) {
      return 'sell';
    }
    
    return 'hold';
  }
}

// Stratégie basée sur les indicateurs techniques
export class TechnicalStrategy implements TradingStrategy {
  generateSignal(history: Candle[], current: Candle): 'buy' | 'sell' | 'hold' {
    if (history.length < 50) return 'hold';
    
    // Calculer RSI
    const rsi = this.calculateRSI(history.slice(-14).map(c => c.close));
    
    // Calculer MACD
    const macd = this.calculateMACD(history.map(c => c.close));
    
    // Calculer Bollinger Bands
    const bb = this.calculateBollingerBands(history.slice(-20).map(c => c.close));
    
    // Générer signal
    if (rsi < 30 && current.close < bb.lower && macd.histogram > 0) {
      return 'buy';
    } else if (rsi > 70 && current.close > bb.upper && macd.histogram < 0) {
      return 'sell';
    }
    
    return 'hold';
  }
  
  private calculateRSI(prices: number[], period: number = 14): number {
    let gains = 0;
    let losses = 0;
    
    for (let i = 1; i < prices.length; i++) {
      const diff = prices[i] - prices[i - 1];
      if (diff > 0) gains += diff;
      else losses -= diff;
    }
    
    const avgGain = gains / period;
    const avgLoss = losses / period;
    const rs = avgGain / avgLoss;
    
    return 100 - (100 / (1 + rs));
  }
  
  private calculateMACD(prices: number[]) {
    const ema12 = this.calculateEMA(prices, 12);
    const ema26 = this.calculateEMA(prices, 26);
    const macdLine = ema12 - ema26;
    const signal = this.calculateEMA([macdLine], 9);
    
    return {
      macd: macdLine,
      signal: signal,
      histogram: macdLine - signal
    };
  }
  
  private calculateEMA(prices: number[], period: number): number {
    const k = 2 / (period + 1);
    let ema = prices[0];
    
    for (let i = 1; i < prices.length; i++) {
      ema = prices[i] * k + ema * (1 - k);
    }
    
    return ema;
  }
  
  private calculateBollingerBands(prices: number[], period: number = 20, stdDev: number = 2) {
    const sma = prices.reduce((a, b) => a + b, 0) / prices.length;
    const variance = prices.reduce((sum, price) => sum + Math.pow(price - sma, 2), 0) / prices.length;
    const std = Math.sqrt(variance);
    
    return {
      upper: sma + (std * stdDev),
      middle: sma,
      lower: sma - (std * stdDev)
    };
  }
}

// ===== OPTIMISATION PAR IA =====
export class AIOptimizer {
  async optimizeStrategy(
    strategy: TradingStrategy,
    historicalData: Candle[],
    parameters: any[]
  ): Promise<any> {
    const results: any[] = [];
    
    // Tester différentes combinaisons de paramètres
    for (const params of parameters) {
      const engine = new BacktestingEngine(strategy, 10000);
      engine['candles'] = historicalData;
      const result = await engine.runBacktest();
      
      results.push({
        parameters: params,
        result: result,
        score: this.calculateScore(result)
      });
    }
    
    // Retourner les meilleurs paramètres
    results.sort((a, b) => b.score - a.score);
    return results[0].parameters;
  }
  
  private calculateScore(result: BacktestResult): number {
    // Score composite basé sur plusieurs métriques
    const profitScore = result.netProfit / 10000;
    const winRateScore = result.winRate / 100;
    const drawdownScore = 1 - (result.maxDrawdown / 100);
    const sharpeScore = Math.max(0, result.sharpeRatio / 3);
    
    return (profitScore * 0.3) + (winRateScore * 0.2) + 
           (drawdownScore * 0.3) + (sharpeScore * 0.2);
  }
}

// ===== COMPOSANT REACT POUR BACKTESTING UI =====
export const BacktestingComponent = () => {
  const [results, setResults] = useState<BacktestResult | null>(null);
  const [loading, setLoading] = useState(false);
  
  const runBacktest = async () => {
    setLoading(true);
    
    try {
      const strategy = new TechnicalStrategy();
      const engine = new BacktestingEngine(strategy, 10000);
      
      await engine.loadHistoricalData(
        'BTCUSDT',
        '1h',
        new Date('2024-01-01'),
        new Date()
      );
      
      const result = await engine.runBacktest();
      setResults(result);
      
      // Exporter en CSV
      await engine.exportToCSV('backtest_results.csv', result);
      
    } catch (error) {
      console.error('Backtest error:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="p-6 bg-gray-800 rounded-xl">
      <h2 className="text-2xl font-bold mb-4">Backtesting</h2>
      
      <button
        onClick={runBacktest}
        disabled={loading}
        className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg mb-6"
      >
        {loading ? 'Running...' : 'Run Backtest'}
      </button>
      
      {results && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-700 p-4 rounded-lg">
            <div className="text-sm text-gray-400">Total Trades</div>
            <div className="text-2xl font-bold">{results.totalTrades}</div>
          </div>
          
          <div className="bg-gray-700 p-4 rounded-lg">
            <div className="text-sm text-gray-400">Win Rate</div>
            <div className="text-2xl font-bold text-green-500">
              {results.winRate.toFixed(2)}%
            </div>
          </div>
          
          <div className="bg-gray-700 p-4 rounded-lg">
            <div className="text-sm text-gray-400">Net Profit</div>
            <div className="text-2xl font-bold text-green-500">
              ${results.netProfit.toFixed(2)}
            </div>
          </div>
          
          <div className="bg-gray-700 p-4 rounded-lg">
            <div className="text-sm text-gray-400">Max Drawdown</div>
            <div className="text-2xl font-bold text-red-500">
              {results.maxDrawdown.toFixed(2)}%
            </div>
          </div>
          
          <div className="bg-gray-700 p-4 rounded-lg">
            <div className="text-sm text-gray-400">Profit Factor</div>
            <div className="text-2xl font-bold">
              {results.profitFactor.toFixed(2)}
            </div>
          </div>
          
          <div className="bg-gray-700 p-4 rounded-lg">
            <div className="text-sm text-gray-400">Sharpe Ratio</div>
            <div className="text-2xl font-bold">
              {results.sharpeRatio.toFixed(2)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};