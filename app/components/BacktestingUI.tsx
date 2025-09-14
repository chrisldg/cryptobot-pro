'use client';

import React, { useState } from 'react';
import { BacktestEngine } from '@/lib/backtesting';

interface BacktestResult {
  totalTrades: number;
  winRate: number;
  netProfit: number;
  maxDrawdown: number;
  profitFactor: number;
  sharpeRatio: number;
}

export const BacktestingComponent = () => {
  const [results, setResults] = useState<BacktestResult | null>(null);
  const [loading, setLoading] = useState(false);
  
  const runBacktest = async () => {
    setLoading(true);
    try {
      const engine = new BacktestEngine({
        symbol: 'BTC/USDT',
        timeframe: '1h',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        initialBalance: 10000,
        feeRate: 0.001
      });
      
      // Charger les données historiques
      await engine.loadHistoricalData();
      
      // Définir la stratégie DCA
      const strategy = {
        type: 'DCA',
        params: {
          amount: 100,
          interval: 24, // heures
          conditions: {
            maxPrice: 70000,
            minPrice: 30000
          }
        }
      };
      
      // Exécuter le backtest
      const result = await engine.runBacktest(strategy);
      setResults(result as BacktestResult);
      
      // Exporter en CSV (optionnel)
      // await engine.exportToCSV('backtest_results.csv', result);
      
    } catch (error) {
      console.error('Backtest error:', error);
      alert('Erreur lors du backtest. Vérifiez la console.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="p-6 bg-gray-800 rounded-xl">
      <h2 className="text-2xl font-bold mb-4 text-white">Backtesting</h2>
      
      <button
        onClick={runBacktest}
        disabled={loading}
        className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg mb-6 text-white disabled:opacity-50"
      >
        {loading ? 'Running...' : 'Run Backtest'}
      </button>
      
      {results && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-700 p-4 rounded-lg">
            <div className="text-sm text-gray-400">Total Trades</div>
            <div className="text-2xl font-bold text-white">{results.totalTrades}</div>
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
            <div className="text-2xl font-bold text-white">
              {results.profitFactor.toFixed(2)}
            </div>
          </div>
          
          <div className="bg-gray-700 p-4 rounded-lg">
            <div className="text-sm text-gray-400">Sharpe Ratio</div>
            <div className="text-2xl font-bold text-white">
              {results.sharpeRatio.toFixed(2)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};