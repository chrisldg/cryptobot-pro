// lib/trade-logger.ts
import { supabase } from '@/lib/supabase';

interface TradeRecord {
  symbol: string;
  side: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  total: number;
  timestamp: Date;
  botType: string;
  status: 'success' | 'failed';
  orderId?: string;
}

export class TradeLogger {
  private trades: TradeRecord[] = [];
  
  constructor() {
    // Charger automatiquement les trades sauvegardés
    this.loadFromLocalStorage();
  }
  
  async logTrade(trade: TradeRecord) {
    this.trades.push(trade);
    
    try {
      await supabase.from('trades').insert({
        ...trade,
        timestamp: trade.timestamp.toISOString()
      });
    } catch (error) {
      console.error('Failed to save to database:', error);
    }
    
    this.saveToLocalStorage();
  }
  
  private saveToLocalStorage() {
    // Fusionner avec les trades existants
    const existingTrades = JSON.parse(localStorage.getItem('trade_history') || '[]');
    const allTrades = [...existingTrades, ...this.trades];
    localStorage.setItem('trade_history', JSON.stringify(allTrades));
  }
  
  loadFromLocalStorage() {
    const saved = localStorage.getItem('trade_history');
    if (saved) {
      try {
        const parsedTrades = JSON.parse(saved);
        // Convertir les timestamps string en Date
        this.trades = parsedTrades.map((t: any) => ({
          ...t,
          timestamp: new Date(t.timestamp)
        }));
      } catch (error) {
        console.error('Error loading trades:', error);
        this.trades = [];
      }
    }
  }
  
  getStatistics() {
    const stats = {
      totalTrades: this.trades.length,
      successRate: this.trades.length > 0 
        ? (this.trades.filter(t => t.status === 'success').length / this.trades.length) * 100 
        : 0,
      totalInvested: this.trades.reduce((sum, t) => sum + t.total, 0),
      bySymbol: {} as any
    };
    
    const symbols = [...new Set(this.trades.map(t => t.symbol))];
    symbols.forEach(symbol => {
      const symbolTrades = this.trades.filter(t => t.symbol === symbol);
      stats.bySymbol[symbol] = {
        count: symbolTrades.length,
        totalQuantity: symbolTrades.reduce((sum, t) => sum + t.quantity, 0),
        averagePrice: symbolTrades.reduce((sum, t) => sum + t.price, 0) / symbolTrades.length,
        totalInvested: symbolTrades.reduce((sum, t) => sum + t.total, 0)
      };
    });
    
    return stats;
  }
  
  exportToCSV(): string {
    if (this.trades.length === 0) {
      return 'Date,Symbol,Side,Quantity,Price,Total,BotType,Status\nAucun trade enregistré';
    }
    
    const headers = ['Date', 'Symbol', 'Side', 'Quantity', 'Price', 'Total', 'BotType', 'Status'];
    const rows = this.trades.map(t => [
      new Date(t.timestamp).toLocaleString('fr-FR'),
      t.symbol,
      t.side,
      t.quantity.toFixed(8),
      t.price.toFixed(2),
      t.total.toFixed(2),
      t.botType || 'N/A',
      t.status
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    return csv;
  }
  
  downloadCSV() {
    this.loadFromLocalStorage(); // Recharger avant export
    const csv = this.exportToCSV();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trades_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }
  
  // Nouvelle fonction pour export automatique
  autoExportDaily() {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    
    const timeUntilMidnight = midnight.getTime() - now.getTime();
    
    setTimeout(() => {
      this.downloadCSV();
      setInterval(() => this.downloadCSV(), 24 * 60 * 60 * 1000);
    }, timeUntilMidnight);
  }
}