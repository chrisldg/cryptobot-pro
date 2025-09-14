// lib/binance-trading.ts
// Installation: npm install ccxt crypto-js node-binance-api

// ⚠️ AVERTISSEMENT IMPORTANT ⚠️
// CE CODE PERMET LE TRADING RÉEL AVEC DE L'ARGENT RÉEL
// TESTEZ TOUJOURS EN MODE TESTNET D'ABORD
// IMPLEMENTEZ UNE GESTION DES RISQUES STRICTE
// CONSULTEZ UN CONSEILLER FINANCIER

import crypto from 'crypto';
import ccxt from 'ccxt';

// Configuration Binance
export class BinanceTrading {
  private exchange: any;
  private testMode: boolean;

  constructor(apiKey: string, apiSecret: string, testMode = true) {
    this.testMode = testMode;
    
    // Utiliser le testnet Binance pour les tests
    this.exchange = new ccxt.binance({
      apiKey: apiKey,
      secret: apiSecret,
      enableRateLimit: true,
      options: {
        defaultType: 'spot',
        testnet: testMode,
      },
      urls: testMode ? {
        api: {
          public: 'https://testnet.binance.vision/api/v3',
          private: 'https://testnet.binance.vision/api/v3',
        }
      } : undefined
    });
  }

  // Obtenir le solde du compte
  async getBalance() {
    try {
      const balance = await this.exchange.fetchBalance();
      return {
        free: balance.free,
        used: balance.used,
        total: balance.total
      };
    } catch (error) {
      console.error('Error fetching balance:', error);
      throw error;
    }
  }

  // Obtenir le prix actuel
  async getCurrentPrice(symbol: string) {
    try {
      const ticker = await this.exchange.fetchTicker(symbol);
      return {
        bid: ticker.bid,
        ask: ticker.ask,
        last: ticker.last,
        volume: ticker.baseVolume
      };
    } catch (error) {
      console.error('Error fetching price:', error);
      throw error;
    }
  }

  // Passer un ordre d'achat
  async buyOrder(symbol: string, amount: number, type: 'market' | 'limit' = 'market', price?: number) {
    try {
      // Vérifications de sécurité
      if (!this.testMode && amount > 1000) {
        throw new Error('Montant trop élevé pour la sécurité');
      }

      let order;
      if (type === 'market') {
        order = await this.exchange.createMarketBuyOrder(symbol, amount);
      } else {
        if (!price) throw new Error('Prix requis pour ordre limit');
        order = await this.exchange.createLimitBuyOrder(symbol, amount, price);
      }

      return {
        id: order.id,
        symbol: order.symbol,
        type: order.type,
        side: order.side,
        amount: order.amount,
        price: order.price,
        status: order.status,
        timestamp: order.timestamp
      };
    } catch (error) {
      console.error('Error placing buy order:', error);
      throw error;
    }
  }

  // Passer un ordre de vente
  async sellOrder(symbol: string, amount: number, type: 'market' | 'limit' = 'market', price?: number) {
    try {
      let order;
      if (type === 'market') {
        order = await this.exchange.createMarketSellOrder(symbol, amount);
      } else {
        if (!price) throw new Error('Prix requis pour ordre limit');
        order = await this.exchange.createLimitSellOrder(symbol, amount, price);
      }

      return {
        id: order.id,
        symbol: order.symbol,
        type: order.type,
        side: order.side,
        amount: order.amount,
        price: order.price,
        status: order.status,
        timestamp: order.timestamp
      };
    } catch (error) {
      console.error('Error placing sell order:', error);
      throw error;
    }
  }

  // Annuler un ordre
  async cancelOrder(orderId: string, symbol: string) {
    try {
      return await this.exchange.cancelOrder(orderId, symbol);
    } catch (error) {
      console.error('Error canceling order:', error);
      throw error;
    }
  }

  // Obtenir l'historique des trades
  async getTradeHistory(symbol: string, limit = 50) {
    try {
      const trades = await this.exchange.fetchMyTrades(symbol, undefined, limit);
      return trades.map((trade: any) => ({
        id: trade.id,
        timestamp: trade.timestamp,
        symbol: trade.symbol,
        type: trade.type,
        side: trade.side,
        price: trade.price,
        amount: trade.amount,
        cost: trade.cost,
        fee: trade.fee
      }));
    } catch (error) {
      console.error('Error fetching trade history:', error);
      throw error;
    }
  }
}

// ===== BOT DCA AVEC TRADING RÉEL =====
export class RealDCABot {
  private binance: BinanceTrading;
  private isRunning: boolean = false;
  private intervalId: NodeJS.Timeout | null = null;

  constructor(
    private apiKey: string,
    private apiSecret: string,
    private symbol: string,
    private investmentAmount: number,
    private intervalHours: number,
    private testMode = true
  ) {
    this.binance = new BinanceTrading(apiKey, apiSecret, testMode);
  }

  async start() {
    if (this.isRunning) {
      console.log('Bot already running');
      return;
    }

    this.isRunning = true;
    console.log(`Starting DCA Bot for ${this.symbol}`);
    
    // Exécuter immédiatement
    await this.executeDCA();
    
    // Puis répéter selon l'intervalle
    this.intervalId = setInterval(async () => {
      if (this.isRunning) {
        await this.executeDCA();
      }
    }, this.intervalHours * 60 * 60 * 1000);
  }

  async stop() {
    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    console.log('DCA Bot stopped');
  }

  private async executeDCA() {
    try {
      console.log(`Executing DCA buy for ${this.symbol}`);
      
      // Vérifier le solde
      const balance = await this.binance.getBalance();
      const usdtBalance = balance.free['USDT'] || 0;
      
      if (usdtBalance < this.investmentAmount) {
        console.log('Insufficient balance for DCA');
        return;
      }

      // Obtenir le prix actuel
      const price = await this.binance.getCurrentPrice(this.symbol);
      
      // Calculer la quantité à acheter
      const quantity = this.investmentAmount / price.last;
      
      // Passer l'ordre d'achat
      const order = await this.binance.buyOrder(
        this.symbol,
        quantity,
        'market'
      );
      
      console.log('DCA order executed:', order);
      
      // Sauvegarder dans la base de données
      await this.saveTradeToDatabase(order);
      
    } catch (error) {
      console.error('DCA execution error:', error);
      // Envoyer notification d'erreur
      await this.sendErrorNotification(error);
    }
  }

  private async saveTradeToDatabase(order: any) {
    // TODO: Implémenter la sauvegarde en DB
    console.log('Saving trade to database:', order);
  }

  private async sendErrorNotification(error: any) {
    // TODO: Implémenter les notifications
    console.log('Sending error notification:', error);
  }
}

// ===== BOT GRID AVEC TRADING RÉEL =====
export class RealGridBot {
  private binance: BinanceTrading;
  private gridOrders: any[] = [];
  private isRunning: boolean = false;

  constructor(
    private apiKey: string,
    private apiSecret: string,
    private symbol: string,
    private lowerPrice: number,
    private upperPrice: number,
    private gridLevels: number,
    private investmentAmount: number,
    private testMode = true
  ) {
    this.binance = new BinanceTrading(apiKey, apiSecret, testMode);
  }

  async start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log(`Starting Grid Bot for ${this.symbol}`);
    
    // Calculer les niveaux de grille
    const gridStep = (this.upperPrice - this.lowerPrice) / this.gridLevels;
    const amountPerGrid = this.investmentAmount / this.gridLevels;
    
    // Placer les ordres de grille
    for (let i = 0; i < this.gridLevels; i++) {
      const buyPrice = this.lowerPrice + (gridStep * i);
      const sellPrice = buyPrice + gridStep;
      
      try {
        // Ordre d'achat
        const buyOrder = await this.binance.buyOrder(
          this.symbol,
          amountPerGrid / buyPrice,
          'limit',
          buyPrice
        );
        
        this.gridOrders.push({
          type: 'buy',
          price: buyPrice,
          order: buyOrder
        });
        
        console.log(`Grid buy order placed at ${buyPrice}`);
        
      } catch (error) {
        console.error(`Error placing grid order at ${buyPrice}:`, error);
      }
    }
    
    // Monitorer les ordres
    this.monitorGridOrders();
  }

  private async monitorGridOrders() {
    setInterval(async () => {
      if (!this.isRunning) return;
      
      for (const gridOrder of this.gridOrders) {
        try {
          // TODO: Implémenter la vérification d'ordre réelle
          // Pour l'instant, simuler le statut
          const order = {
            id: gridOrder.order.id,
            status: 'closed',
            filled: gridOrder.order.amount,
            remaining: 0,
            price: gridOrder.order.price
          };
          
          if (order.status === 'closed' && gridOrder.type === 'buy') {
            // Si ordre d'achat exécuté, placer ordre de vente
            const sellPrice = gridOrder.price * 1.02; // 2% de profit
            const sellOrder = await this.binance.sellOrder(
              this.symbol,
              order.amount,
              'limit',
              sellPrice
            );
            
            gridOrder.type = 'sell';
            gridOrder.order = sellOrder;
            console.log(`Grid sell order placed at ${sellPrice}`);
          }
          
        } catch (error) {
          console.error('Error monitoring grid order:', error);
        }
      }
    }, 30000); // Vérifier toutes les 30 secondes
  }

  async stop() {
    this.isRunning = false;
    
    // Annuler tous les ordres ouverts
    for (const gridOrder of this.gridOrders) {
      try {
        await this.binance.cancelOrder(gridOrder.order.id, this.symbol);
      } catch (error) {
        console.error('Error canceling order:', error);
      }
    }
    
    console.log('Grid Bot stopped');
  }
}

// ===== GESTIONNAIRE DE RISQUES =====
export class RiskManager {
  private maxDrawdown: number = 0.1; // 10% max drawdown
  private maxPositionSize: number = 0.02; // 2% max par position
  private stopLossPercent: number = 0.05; // 5% stop loss
  
  constructor(private totalCapital: number) {}
  
  // Calculer la taille de position sécurisée
  calculatePositionSize(currentPrice: number): number {
    const maxPosition = this.totalCapital * this.maxPositionSize;
    return maxPosition / currentPrice;
  }
  
  // Vérifier si le drawdown est acceptable
  checkDrawdown(currentValue: number): boolean {
    const drawdown = (this.totalCapital - currentValue) / this.totalCapital;
    return drawdown < this.maxDrawdown;
  }
  
  // Calculer le stop loss
  calculateStopLoss(entryPrice: number): number {
    return entryPrice * (1 - this.stopLossPercent);
  }
  
  // Calculer le take profit
  calculateTakeProfit(entryPrice: number, riskRewardRatio: number = 2): number {
    return entryPrice * (1 + (this.stopLossPercent * riskRewardRatio));
  }
}

// ===== WEBSOCKET POUR PRIX EN TEMPS RÉEL =====
export class BinanceWebSocket {
  private ws: WebSocket | null = null;
  
  connect(symbols: string[], onPrice: (data: any) => void) {
    const streams = symbols.map(s => `${s.toLowerCase()}@ticker`).join('/');
    const url = `wss://stream.binance.com:9443/ws/${streams}`;
    
    this.ws = new WebSocket(url);
    
    this.ws.onopen = () => {
      console.log('WebSocket connected');
    };
    
    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      onPrice({
        symbol: data.s,
        price: parseFloat(data.c),
        change24h: parseFloat(data.P),
        volume24h: parseFloat(data.v),
        high24h: parseFloat(data.h),
        low24h: parseFloat(data.l)
      });
    };
    
    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
      // Reconnexion automatique après 5 secondes
      setTimeout(() => this.connect(symbols, onPrice), 5000);
    };
  }
  
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}