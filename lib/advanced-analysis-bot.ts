// lib/advanced-analysis-bot.ts
import * as tf from '@tensorflow/tfjs';

interface MarketSignal {
  symbol: string;
  strength: number; // 0-100
  confidence: number; // 0-1
  riskLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  suggestedAction: 'BUY' | 'SELL' | 'HOLD';
  reasoning: string[];
}

export class AdvancedAnalysisBot {
  private historicalData: Map<string, any[]> = new Map();
  private indicators: Map<string, number> = new Map();
  private mlModel: tf.LayersModel | null = null;
  private initialized: boolean = false; // AJOUT - Déclaration de la propriété
  
  constructor(
    private riskTolerance: number = 0.05, // Max 5% par trade
    private symbols: string[] = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT']
  ) {}

  async initialize() {

    // Vérification du mode démo
    if (typeof window !== 'undefined' && !process.env.NEXT_PUBLIC_BINANCE_API_KEY) {
        console.log('🎮 Bot Analyse en MODE DÉMO - Résultats simulés');
        this.initialized = true;
        return;
    }
    
    try {    
     console.log('⚠️ AVERTISSEMENT: Ce bot ne garantit PAS de profits');
     console.log('📉 Les pertes sont possibles et même probables');
    
     // Charger les données historiques
     for (const symbol of this.symbols) {
      await this.loadHistoricalData(symbol);
     }
    
     // Initialiser le modèle ML (simplifié)
     this.initializeMLModel();
     this.initialized = true;
    }catch (error) {
     console.error('Erreur initialisation:', error);
     this.initialized = true; // Continue en mode démo

    }
  }


  private async loadHistoricalData(symbol: string) {
    try {
      // Charger 90 jours d'historique
      const response = await fetch(`/api/binance/klines?symbol=${symbol}&interval=1h&limit=2160`);
      const data = await response.json();
      this.historicalData.set(symbol, data);
    } catch (error) {
      console.error(`Erreur chargement données ${symbol}:`, error);
    }
  }

  // Analyse technique classique
  calculateTechnicalIndicators(symbol: string): Record<string, number> {
    const data = this.historicalData.get(symbol) || [];
    if (data.length < 50) return {};

    const closes = data.map(d => parseFloat(d[4]));
    
    return {
      rsi: this.calculateRSI(closes, 14),
      macd: this.calculateMACD(closes),
      bb: this.calculateBollingerBands(closes, 20),
      ema50: this.calculateEMA(closes, 50),
      ema200: this.calculateEMA(closes, 200),
      volume: this.analyzeVolume(data),
      volatility: this.calculateVolatility(closes)
    };
  }

  // RSI - Relative Strength Index
  private calculateRSI(prices: number[], period: number = 14): number {
    if (prices.length < period) return 50;
    
    let gains = 0;
    let losses = 0;
    
    for (let i = 1; i <= period; i++) {
      const difference = prices[i] - prices[i - 1];
      if (difference > 0) gains += difference;
      else losses -= difference;
    }
    
    const avgGain = gains / period;
    const avgLoss = losses / period;
    const rs = avgGain / (avgLoss || 0.0001);
    
    return 100 - (100 / (1 + rs));
  }

  // MACD
  private calculateMACD(prices: number[]): number {
    const ema12 = this.calculateEMA(prices, 12);
    const ema26 = this.calculateEMA(prices, 26);
    return ema12 - ema26;
  }

  // EMA - Exponential Moving Average
  private calculateEMA(prices: number[], period: number): number {
    if (prices.length < period) return prices[prices.length - 1];
    
    const multiplier = 2 / (period + 1);
    let ema = prices.slice(0, period).reduce((a, b) => a + b) / period;
    
    for (let i = period; i < prices.length; i++) {
      ema = (prices[i] - ema) * multiplier + ema;
    }
    
    return ema;
  }

  // Bollinger Bands
  private calculateBollingerBands(prices: number[], period: number = 20): number {
    const sma = prices.slice(-period).reduce((a, b) => a + b) / period;
    const variance = prices.slice(-period).reduce((sum, price) => 
      sum + Math.pow(price - sma, 2), 0) / period;
    const stdDev = Math.sqrt(variance);
    
    const currentPrice = prices[prices.length - 1];
    const upperBand = sma + (stdDev * 2);
    const lowerBand = sma - (stdDev * 2);
    
    // Position relative dans les bandes (0-100)
    return ((currentPrice - lowerBand) / (upperBand - lowerBand)) * 100;
  }

  // Analyse du volume
  private analyzeVolume(data: any[]): number {
    const volumes = data.map(d => parseFloat(d[5]));
    const avgVolume = volumes.slice(-20).reduce((a, b) => a + b) / 20;
    const currentVolume = volumes[volumes.length - 1];
    
    return currentVolume / avgVolume; // Ratio volume actuel vs moyenne
  }

  // Volatilité
  private calculateVolatility(prices: number[]): number {
    const returns = [];
    for (let i = 1; i < prices.length; i++) {
      returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
    }
    
    const mean = returns.reduce((a, b) => a + b) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
    
    return Math.sqrt(variance) * Math.sqrt(365) * 100; // Volatilité annualisée en %
  }

  // Pattern Recognition
  detectPatterns(symbol: string): string[] {
    const patterns: string[] = [];
    const data = this.historicalData.get(symbol) || [];
    
    if (data.length < 30) return patterns;
    
    const closes = data.slice(-30).map(d => parseFloat(d[4]));
    
    // Double Bottom
    if (this.isDoubleBottom(closes)) {
      patterns.push('DOUBLE_BOTTOM - Signal haussier potentiel');
    }
    
    // Head and Shoulders
    if (this.isHeadAndShoulders(closes)) {
      patterns.push('HEAD_SHOULDERS - Signal baissier potentiel');
    }
    
    // Breakout
    if (this.isBreakout(closes)) {
      patterns.push('BREAKOUT - Cassure de résistance');
    }
    
    return patterns;
  }

  private isDoubleBottom(prices: number[]): boolean {
    // Logique simplifiée de détection
    const min1 = Math.min(...prices.slice(0, 10));
    const min2 = Math.min(...prices.slice(20, 30));
    const middle = Math.max(...prices.slice(10, 20));
    
    return Math.abs(min1 - min2) < min1 * 0.02 && middle > min1 * 1.05;
  }

  private isHeadAndShoulders(prices: number[]): boolean {
    // Détection simplifiée
    const peak1 = Math.max(...prices.slice(5, 10));
    const peak2 = Math.max(...prices.slice(15, 20)); // Head
    const peak3 = Math.max(...prices.slice(25, 30));
    
    return peak2 > peak1 * 1.03 && peak2 > peak3 * 1.03 && 
           Math.abs(peak1 - peak3) < peak1 * 0.02;
  }

  private isBreakout(prices: number[]): boolean {
    const resistance = Math.max(...prices.slice(0, 25));
    const current = prices[prices.length - 1];
    return current > resistance * 1.02;
  }

  // Analyse de corrélation
  async analyzeCorrelations(): Promise<Map<string, number>> {
    const correlations = new Map<string, number>();
    
    // Analyser les corrélations avec BTC
    const btcData = this.historicalData.get('BTCUSDT') || [];
    
    for (const symbol of this.symbols) {
      if (symbol === 'BTCUSDT') continue;
      
      const symbolData = this.historicalData.get(symbol) || [];
      const correlation = this.calculateCorrelation(btcData, symbolData);
      correlations.set(symbol, correlation);
    }
    
    return correlations;
  }

  private calculateCorrelation(data1: any[], data2: any[]): number {
    const prices1 = data1.map(d => parseFloat(d[4]));
    const prices2 = data2.map(d => parseFloat(d[4]));
    
    const n = Math.min(prices1.length, prices2.length);
    if (n < 2) return 0;
    
    const mean1 = prices1.reduce((a, b) => a + b) / n;
    const mean2 = prices2.reduce((a, b) => a + b) / n;
    
    let cov = 0, var1 = 0, var2 = 0;
    
    for (let i = 0; i < n; i++) {
      cov += (prices1[i] - mean1) * (prices2[i] - mean2);
      var1 += Math.pow(prices1[i] - mean1, 2);
      var2 += Math.pow(prices2[i] - mean2, 2);
    }
    
    return cov / (Math.sqrt(var1) * Math.sqrt(var2));
  }

  // ML Model simplifié
  private initializeMLModel() {
    // Modèle LSTM simplifié pour la prédiction de tendance
    this.mlModel = tf.sequential({
      layers: [
        tf.layers.lstm({ units: 50, returnSequences: true, inputShape: [10, 5] }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.lstm({ units: 50, returnSequences: false }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({ units: 1, activation: 'sigmoid' })
      ]
    });
    
    this.mlModel.compile({
      optimizer: 'adam',
      loss: 'binaryCrossentropy',
      metrics: ['accuracy']
    });
  }

  // Analyse globale
  async analyzeMarket(symbol: string): Promise<MarketSignal> {
    const indicators = this.calculateTechnicalIndicators(symbol);
    const patterns = this.detectPatterns(symbol);
    const reasoning: string[] = [];
    
    let bullishSignals = 0;
    let bearishSignals = 0;
    
    // Analyse RSI
    if (indicators.rsi < 30) {
      bullishSignals++;
      reasoning.push('RSI survendu (<30) - Signal d\'achat potentiel');
    } else if (indicators.rsi > 70) {
      bearishSignals++;
      reasoning.push('RSI suracheté (>70) - Signal de vente potentiel');
    }
    
    // Analyse MACD
    if (indicators.macd > 0) {
      bullishSignals++;
      reasoning.push('MACD positif - Tendance haussière');
    } else {
      bearishSignals++;
      reasoning.push('MACD négatif - Tendance baissière');
    }
    
    // Analyse Bollinger
    if (indicators.bb < 20) {
      bullishSignals++;
      reasoning.push('Prix près de la bande inférieure - Rebond possible');
    } else if (indicators.bb > 80) {
      bearishSignals++;
      reasoning.push('Prix près de la bande supérieure - Correction possible');
    }
    
    // Volume
    if (indicators.volume > 1.5) {
      reasoning.push('Volume élevé - Mouvement significatif');
    }
    
    // Patterns
    patterns.forEach(p => reasoning.push(p));
    
    // Décision finale
    const totalSignals = bullishSignals + bearishSignals;
    const strength = totalSignals > 0 ? 
      (Math.max(bullishSignals, bearishSignals) / totalSignals) * 100 : 50;
    
    const confidence = Math.min(totalSignals / 5, 1); // Max 5 signaux pour confiance max
    
    let suggestedAction: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
    if (bullishSignals > bearishSignals && confidence > 0.6) {
      suggestedAction = 'BUY';
    } else if (bearishSignals > bullishSignals && confidence > 0.6) {
      suggestedAction = 'SELL';
    }
    
    // Niveau de risque basé sur la volatilité
    let riskLevel: 'HIGH' | 'MEDIUM' | 'LOW' = 'MEDIUM';
    if (indicators.volatility > 100) riskLevel = 'HIGH';
    else if (indicators.volatility < 30) riskLevel = 'LOW';
    
    return {
      symbol,
      strength,
      confidence,
      riskLevel,
      suggestedAction,
      reasoning
    };
  }

  // Exécution principale
  async execute() {

    // Mode démo si pas initialisé
    if (!this.initialized || typeof window !== 'undefined' && !process.env.NEXT_PUBLIC_BINANCE_API_KEY) {
        console.log('📊 Analyse en mode démo');
        return this.generateDemoSignals();
    }

    console.log('🔍 Analyse des marchés en cours...');
    console.log('⚠️ RAPPEL: Les cryptos sont TRÈS risquées');
    
    const signals: MarketSignal[] = [];
    
    for (const symbol of this.symbols) {
      const signal = await this.analyzeMarket(symbol);
      signals.push(signal);
      
      console.log(`\n📊 ${symbol}:`);
      console.log(`  Action suggérée: ${signal.suggestedAction}`);
      console.log(`  Force: ${signal.strength.toFixed(1)}%`);
      console.log(`  Confiance: ${(signal.confidence * 100).toFixed(1)}%`);
      console.log(`  Risque: ${signal.riskLevel}`);
      console.log(`  Raisons:`);
      signal.reasoning.forEach(r => console.log(`    - ${r}`));
    }
    
    // Sélectionner la meilleure opportunité
    const bestSignal = signals
      .filter(s => s.suggestedAction !== 'HOLD')
      .sort((a, b) => (b.confidence * b.strength) - (a.confidence * a.strength))[0];
    
    if (bestSignal && bestSignal.confidence > 0.7) {
      console.log(`\n✨ Meilleure opportunité: ${bestSignal.symbol}`);
      console.log('⚠️ MAIS rappelez-vous: AUCUNE garantie de profit!');
      
      // Calculer la taille de position basée sur le risque
      const positionSize = this.calculatePositionSize(bestSignal);
      console.log(`💰 Taille de position suggérée: ${positionSize}% du capital`);
    } else {
      console.log('\n⏸️ Aucune opportunité claire - Rester en dehors du marché');
    }
    
    return signals;
  }

  // NOUVELLE MÉTHODE - Génération de signaux démo
  private generateDemoSignals(): MarketSignal[] {
    return this.symbols.map(symbol => ({
      symbol,
      strength: 50 + Math.random() * 50,
      confidence: 0.2 + Math.random() * 0.3,
      riskLevel: 'LOW' as const,
      suggestedAction: 'HOLD' as const,
      reasoning: ['Mode démo - Analyse simulée', 'Données de marché simulées']
    }));
  }

  private calculatePositionSize(signal: MarketSignal): number {
    // Kelly Criterion simplifié
    const winProbability = signal.confidence;
    const winLossRatio = 2; // Objectif 2:1 reward/risk
    
    const kellyPercent = (winProbability * winLossRatio - (1 - winProbability)) / winLossRatio;
    
    // Limiter à max 5% par trade pour la sécurité
    return Math.min(Math.max(kellyPercent * 100, 0), 5);
  }

  // Backtesting
  async backtest(strategy: string, period: number = 30): Promise<void> {
    console.log(`\n📈 Backtesting sur ${period} jours...`);
    
    let capital = 10000;
    let trades = 0;
    let wins = 0;
    let losses = 0;
    
    // Simulation simplifiée
    for (let i = 0; i < period; i++) {
      const randomOutcome = Math.random();
      
      if (randomOutcome > 0.55) { // 45% de chance de gagner (réaliste)
        const gain = capital * 0.02; // Gain de 2%
        capital += gain;
        wins++;
      } else {
        const loss = capital * 0.01; // Perte de 1%
        capital -= loss;
        losses++;
      }
      trades++;
    }
    
    console.log(`Résultats du backtest:`);
    console.log(`  Capital initial: $10,000`);
    console.log(`  Capital final: $${capital.toFixed(2)}`);
    console.log(`  Performance: ${((capital - 10000) / 10000 * 100).toFixed(2)}%`);
    console.log(`  Trades gagnants: ${wins}/${trades} (${(wins/trades*100).toFixed(1)}%)`);
    console.log(`  ⚠️ Ces résultats sont SIMULÉS et ne garantissent RIEN`);
  }
}

// Gestionnaire de risque OBLIGATOIRE
export class RiskManager {
  constructor(
    private maxLossPerTrade: number = 0.02, // Max 2% perte par trade
    private maxDailyLoss: number = 0.06,    // Max 6% perte par jour
    private maxDrawdown: number = 0.20       // Max 20% drawdown
  ) {}
  
  validateTrade(signal: MarketSignal, portfolio: number): boolean {
    // Ne jamais trader avec plus de 5% du portfolio
    if (signal.riskLevel === 'HIGH') {
      console.log('⛔ Trade refusé - Risque trop élevé');
      return false;
    }
    
    // Ne pas trader si confiance < 60%
    if (signal.confidence < 0.6) {
      console.log('⛔ Trade refusé - Confiance insuffisante');
      return false;
    }
    
    return true;
  }
  
  calculateStopLoss(entryPrice: number, riskLevel: string): number {
    switch(riskLevel) {
      case 'HIGH': return entryPrice * 0.97;  // -3%
      case 'MEDIUM': return entryPrice * 0.98; // -2%
      case 'LOW': return entryPrice * 0.99;    // -1%
      default: return entryPrice * 0.98;
    }
  }
  
  calculateTakeProfit(entryPrice: number, riskLevel: string): number {
    // Ratio risque/récompense minimum 1:2
    switch(riskLevel) {
      case 'HIGH': return entryPrice * 1.06;   // +6%
      case 'MEDIUM': return entryPrice * 1.04;  // +4%
      case 'LOW': return entryPrice * 1.02;     // +2%
      default: return entryPrice * 1.04;
    }
  }
}