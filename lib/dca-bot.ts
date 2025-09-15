// lib/dca-bot.ts
interface TradeLog {
  timestamp: Date;
  symbol: string;
  amount: number;
  quantity: number;
  price: number;
  orderId?: string;
  status: 'success' | 'failed';
  error?: string;
}

interface BotStats {
  totalInvested: number;
  totalQuantityBought: number;
  averagePrice: number;
  tradesExecuted: number;
  failedTrades: number;
  lastTradeTime?: Date;
}

export class DCABot {
  private interval: NodeJS.Timeout | null = null;
  private isRunning = false;
  private trades: TradeLog[] = [];
  private stats: BotStats = {
    totalInvested: 0,
    totalQuantityBought: 0,
    averagePrice: 0,
    tradesExecuted: 0,
    failedTrades: 0
  };
  
  constructor(
    private symbol: string,
    private amount: number,
    private intervalHours: number,
    private maxRetries: number = 3,
    private testMode: boolean = true
  ) {}
  
  async start() {
    if (this.isRunning) {
      console.warn(`DCA Bot already running for ${this.symbol}`);
      return;
    }
    
    this.isRunning = true;
    console.log(`🚀 DCA Bot started: ${this.amount} USDT in ${this.symbol} every ${this.intervalHours}h`);
    
    // Exécuter immédiatement le premier trade
    await this.executeTrade();
    
    // Configurer l'intervalle pour les trades suivants
    const intervalMs = this.intervalHours * 60 * 60 * 1000;
    this.interval = setInterval(async () => {
      if (this.isRunning) {
        await this.executeTrade();
      }
    }, intervalMs);
    
    console.log(`⏰ Next trade scheduled in ${this.intervalHours} hours`);
  }
  
  async executeTrade(retryCount = 0): Promise<boolean> {
    try {
      console.log(`📊 Executing DCA trade attempt ${retryCount + 1}/${this.maxRetries}`);
      
      // Récupérer le prix actuel
      const currentPrice = await this.getCurrentPrice();
      if (!currentPrice || currentPrice <= 0) {
        throw new Error('Invalid price received');
      }
      
      // Calculer la quantité selon la crypto
      const rawQuantity = this.amount / currentPrice;
      let finalQuantity: number;

      // Règles spécifiques par crypto
      if (this.symbol === 'BTCUSDT') {
      // BTC : minimum 0.001
      finalQuantity = Math.max(0.001, Math.floor(rawQuantity * 1000) / 1000);
      } else if (this.symbol === 'ETHUSDT') {
      // ETH : minimum 0.01
      finalQuantity = Math.max(0.01, Math.floor(rawQuantity * 100) / 100);
      } else if (this.symbol === 'BNBUSDT') {
      // BNB : minimum 0.01
      finalQuantity = Math.max(0.01, Math.floor(rawQuantity * 100) / 100);
      } else {
      // Autres : arrondir à 2 décimales
      finalQuantity = Math.max(0.01, Math.floor(rawQuantity * 100) / 100);
      }

      // Corriger l'affichage du symbole
      const cryptoSymbol = this.symbol.replace('USDT', '');
      console.log(`💰 Trade details: ${finalQuantity} ${cryptoSymbol} @ $${currentPrice}`);
      
      // Passer l'ordre
      const response = await fetch('/api/binance/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: this.symbol,
          side: 'BUY',
          type: 'MARKET',
          quantity: finalQuantity.toFixed(8),
          testMode: this.testMode
        })
      });
      
      if (!response.ok) {
        throw new Error(`API responded with status ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        console.log(`✅ DCA Trade executed successfully:`, result);
        
        // Mettre à jour les statistiques
        this.updateStats(finalQuantity, currentPrice, true);
        
        // Logger le trade
        await this.logTrade({
          timestamp: new Date(),
          symbol: this.symbol,
          amount: this.amount,
          quantity: finalQuantity, 
          price: currentPrice,
          orderId: result.order?.orderId,
          status: 'success'
        });
        
        return true;
      } else {
        throw new Error(result.error || 'Trade failed');
      }
      
    } catch (error) {
      console.error(`❌ DCA Trade failed:`, error);
      
      // Retry logic
      if (retryCount < this.maxRetries - 1) {
        console.log(`🔄 Retrying in 5 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 5000));
        return this.executeTrade(retryCount + 1);
      }
      
      // Log failed trade
      this.updateStats(0, 0, false);
      await this.logTrade({
        timestamp: new Date(),
        symbol: this.symbol,
        amount: this.amount,
        quantity: 0,
        price: 0,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      return false;
    }
  }
  
  async getCurrentPrice(): Promise<number> {
    try {
      const res = await fetch(`/api/binance/prices?symbols=${this.symbol}`);
      
      if (!res.ok) {
        throw new Error(`Failed to fetch price: ${res.status}`);
      }
      
      const data = await res.json();
      
      if (data.prices && data.prices.length > 0) {
        return parseFloat(data.prices[0].price);
      }
      
      throw new Error('No price data available');
    } catch (error) {
      console.error('Failed to get current price:', error);
      // Fallback: essayer une autre méthode ou API
      return 0;
    }
  }
  
  private updateStats(quantity: number, price: number, success: boolean) {
    if (success && quantity > 0 && price > 0) {
      this.stats.totalInvested += this.amount;
      this.stats.totalQuantityBought += quantity;
      this.stats.tradesExecuted++;
      this.stats.averagePrice = this.stats.totalInvested / this.stats.totalQuantityBought;
      this.stats.lastTradeTime = new Date();
    } else {
      this.stats.failedTrades++;
    }
  }
  
  async logTrade(trade: TradeLog) {
    // Ajouter au tableau local
    this.trades.push(trade);
    
    // Logger dans la console
    console.log('📝 Trade logged:', {
      ...trade,
      stats: this.getStats()
    });
    
    // TODO: Sauvegarder en base de données
    try {
      // await fetch('/api/trades/log', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(trade)
      // });
    } catch (error) {
      console.error('Failed to log trade to database:', error);
    }
  }
  
  getStats(): BotStats {
    return { ...this.stats };
  }
  
  getTrades(): TradeLog[] {
    return [...this.trades];
  }
  
  pause() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
      console.log('⏸️ DCA Bot paused');
    }
  }
  
  resume() {
    if (this.isRunning && !this.interval) {
      const intervalMs = this.intervalHours * 60 * 60 * 1000;
      this.interval = setInterval(async () => {
        await this.executeTrade();
      }, intervalMs);
      console.log('▶️ DCA Bot resumed');
    }
  }
  
  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.isRunning = false;
    
    console.log('🛑 DCA Bot stopped');
    console.log('📊 Final stats:', this.getStats());
  }
  
  // Méthode pour changer l'intervalle à la volée
  updateInterval(newIntervalHours: number) {
    this.intervalHours = newIntervalHours;
    if (this.isRunning) {
      this.pause();
      this.resume();
      console.log(`⏰ Interval updated to ${newIntervalHours} hours`);
    }
  }
  
  // Méthode pour changer le montant
  updateAmount(newAmount: number) {
    this.amount = newAmount;
    console.log(`💵 Investment amount updated to ${newAmount} USDT`);
  }
}

// Export d'une fonction helper pour créer et gérer plusieurs bots
export class DCABotManager {
  private bots: Map<string, DCABot> = new Map();
  
  createBot(id: string, symbol: string, amount: number, intervalHours: number): DCABot {
    if (this.bots.has(id)) {
      console.warn(`Bot with id ${id} already exists`);
      return this.bots.get(id)!;
    }
    
    const bot = new DCABot(symbol, amount, intervalHours);
    this.bots.set(id, bot);
    return bot;
  }
  
  getBot(id: string): DCABot | undefined {
    return this.bots.get(id);
  }
  
  stopAllBots() {
    this.bots.forEach(bot => bot.stop());
    console.log('All bots stopped');
  }
  
  getStats() {
    const stats: any = {};
    this.bots.forEach((bot, id) => {
      stats[id] = bot.getStats();
    });
    return stats;
  }
}