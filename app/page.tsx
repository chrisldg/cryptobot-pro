'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  TrendingUp, TrendingDown, DollarSign, Activity, BarChart3,
  Settings, Play, Pause, AlertCircle, Zap,
  ChevronRight, Menu, X, Moon, Sun,
  Wallet, Bot, ArrowUpRight,
  Plus, Home as HomeIcon
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar,
  PieChart as RechartsPieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { supabase } from '@/lib/supabase';
import { TradeLogger } from '@/lib/trade-logger'; // AJOUTEZ CETTE LIGNE


declare global {
  interface Window {
    stopLossMonitors?: any[];
  }
}


interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

interface BotConfig {
  name: string;
  type: string;
  pair: string;
  investment: number;
  config: Record<string, any>;
}

interface Bot {
  id: number;
  name: string;
  type: string;
  status: string;
  pair: string;
  profit: number;
  profitPercent: number;
  investment: number;
  runtime: string;
  trades: number;
  config: Record<string, any>;
}

interface CryptoData {
  price: number;
  change: number;
  volume: string;
}

export default function CryptoBotPro() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [activeSection, setActiveSection] = useState('dashboard');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showCreateBot, setShowCreateBot] = useState(false);
  
  // État des données en temps réel
  const [cryptoPrices, setCryptoPrices] = useState<Record<string, CryptoData>>({
    BTC: { price: 64782.45, change: 2.34, volume: '24.5B' },
    ETH: { price: 3245.78, change: -1.12, volume: '12.3B' },
    BNB: { price: 512.34, change: 3.45, volume: '1.8B' },
    SOL: { price: 142.67, change: 5.23, volume: '3.2B' },
    ADA: { price: 0.456, change: -0.89, volume: '543M' }
  });

  const [portfolioValue, setPortfolioValue] = useState(125432.67);
  const [dailyProfit, setDailyProfit] = useState(1234.56);
  const activeBotsCount = 3;


  // État pour l'historique des trades
  const [tradeHistory, setTradeHistory] = useState<any[]>([]);
  const [loadingTrades, setLoadingTrades] = useState(false);

  // AJOUTEZ ICI - États pour filtres et pagination
  const [tradeFilter, setTradeFilter] = useState({
    pair: 'ALL',
    dateFrom: '',
    dateTo: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const tradesPerPage = 10;

  // AJOUTEZ ICI - Filtrer les trades
  const filteredTrades = useMemo(() => {
    return tradeHistory.filter(trade => {
      if (tradeFilter.pair !== 'ALL' && trade.symbol !== tradeFilter.pair) return false;
      if (tradeFilter.dateFrom && new Date(trade.time) < new Date(tradeFilter.dateFrom)) return false;
      if (tradeFilter.dateTo && new Date(trade.time) > new Date(tradeFilter.dateTo)) return false;
      return true;
    });
  }, [tradeHistory, tradeFilter]);

  // AJOUTEZ ICI - Pagination
  const paginatedTrades = useMemo(() => {
    const start = (currentPage - 1) * tradesPerPage;
    return filteredTrades.slice(start, start + tradesPerPage);
  }, [filteredTrades, currentPage]);

  // AJOUTEZ ICI - Calcul P&L
  const totalPL = useMemo(() => {
    return filteredTrades.reduce((sum, trade) => {
      const currentPrice = cryptoPrices.BTC?.price || 0;
      const pl = trade.isBuyer 
        ? (currentPrice - trade.price) * trade.qty
        : (trade.price - currentPrice) * trade.qty;
      return sum + pl;
    }, 0);
  }, [filteredTrades, cryptoPrices]);

  // Ajoutez cette ligne ici maintenant
  const totalTrades = tradeHistory.length || 0;

  // Fonction pour charger les trades
  const loadTradeHistory = useCallback(async () => {
    setLoadingTrades(true);
    try {
      const res = await fetch('/api/binance/trades');
      const data = await res.json();
      if (data.success) {
        setTradeHistory(data.trades);
      }
    } catch (error) {
      console.error('Error loading trades:', error);
    } finally {
      setLoadingTrades(false);
    }
  }, []);

  // Charger les trades au montage
  useEffect(() => {
    if (isAuthenticated) {
      loadTradeHistory();
    }
  }, [isAuthenticated, loadTradeHistory]);

  // Données des bots
  const [bots, setBots] = useState<Bot[]>([
    {
      id: 1,
      name: 'DCA Bitcoin Pro',
      type: 'DCA',
      status: 'active',
      pair: 'BTC/USDT',
      profit: 234.56,
      profitPercent: 12.34,
      investment: 1000,
      runtime: '5 jours',
      trades: 45,
      config: {
        amount: 100,
        interval: '4h',
        targetProfit: 20,
        stopLoss: 10
      }
    },
    {
      id: 2,
      name: 'Grid ETH Master',
      type: 'GRID',
      status: 'active',
      pair: 'ETH/USDT',
      profit: 456.78,
      profitPercent: 8.92,
      investment: 2000,
      runtime: '12 jours',
      trades: 132,
      config: {
        grids: 20,
        lowerPrice: 3000,
        upperPrice: 3500,
        investment: 2000
      }
    },
    {
      id: 3,
      name: 'Arbitrage Multi',
      type: 'ARBITRAGE',
      status: 'paused',
      pair: 'MULTI',
      profit: 123.45,
      profitPercent: 5.67,
      investment: 1500,
      runtime: '3 jours',
      trades: 78,
      config: {
        exchanges: ['Binance', 'Coinbase'],
        minProfit: 0.5,
        maxAmount: 1000
      }
    }
  ]);

  // Configuration pour nouveau bot
  const [newBotConfig, setNewBotConfig] = useState<BotConfig>({
    name: '',
    type: 'DCA',
    pair: 'BTC/USDT',
    investment: 1000,
    config: {}
  });

  // Simulation des mises à jour en temps réel
  useEffect(() => {
    const interval = setInterval(() => {
      setCryptoPrices(prev => ({
        ...prev,
        BTC: {
          ...prev.BTC,
          price: prev.BTC.price + (Math.random() - 0.5) * 100,
          change: (Math.random() - 0.5) * 5
        },
        ETH: {
          ...prev.ETH,
          price: prev.ETH.price + (Math.random() - 0.5) * 20,
          change: (Math.random() - 0.5) * 5
        }
      }));
      
      setPortfolioValue(prev => prev + (Math.random() - 0.45) * 100);
      setDailyProfit(prev => prev + (Math.random() - 0.3) * 10);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Données pour les graphiques
  const chartData = useMemo(() => {
    const hours = Array.from({length: 24}, (_, i) => ({
      time: `${i}:00`,
      value: 120000 + Math.random() * 10000,
      profit: Math.random() * 500
    }));
    return hours;
  }, []);

  const pieData = [
    { name: 'Bitcoin', value: 45, color: '#F7931A' },
    { name: 'Ethereum', value: 30, color: '#627EEA' },
    { name: 'BNB', value: 15, color: '#F3BA2F' },
    { name: 'Autres', value: 10, color: '#8884d8' }
  ];

  // Gestion de l'authentification
  const handleLogin = useCallback(async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) {
    alert('Erreur: ' + error.message);
  } else {
    setIsAuthenticated(true);
    // Charger les données réelles de l'utilisateur
    loadUserData(data.user.id);
  }
}, [email, password]);

  const loadUserData = async (userId: string) => {
  // Charger le portfolio
  const { data: portfolio } = await supabase
    .from('portfolios')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  if (portfolio) {
    setPortfolioValue(portfolio.total_value || 125432.67);
    setDailyProfit(portfolio.daily_profit || 1234.56);
  }
  
  // Charger les bots
  const { data: userBots } = await supabase
    .from('bots')
    .select('*')
    .eq('user_id', userId);
  
  if (userBots && userBots.length > 0) {
    setBots(userBots);
  }
};

const handleLogout = async () => {
  await supabase.auth.signOut();
  setIsAuthenticated(false);
  window.location.href = '/';
};

  const handleDemoAccess = useCallback(() => {
    setIsAuthenticated(true);
  }, []);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  }, [handleLogin]);

  // Gestion des bots
  const toggleBotStatus = useCallback((botId: number) => {
    setBots(prev => prev.map(bot => 
      bot.id === botId 
        ? { ...bot, status: bot.status === 'active' ? 'paused' : 'active' }
        : bot
    ));
  }, []);

  const createNewBot = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      const { data, error } = await supabase
        .from('bots')
        .insert({
          user_id: user.id,
          name: newBotConfig.name,
          type: newBotConfig.type,
          pair: newBotConfig.pair,
          investment: newBotConfig.investment,
          status: 'active',
          profit: 0,
          profit_percent: 0,
          trades: 0,
          config: newBotConfig.config
        })
        .select()
        .single();
      
      if (data) {
        setBots(prev => [...prev, data]);
      }
    }
    
    setShowCreateBot(false);
    setNewBotConfig({
      name: '',
      type: 'DCA',
      pair: 'BTC/USDT',
      investment: 1000,
      config: {}
    });
  }, [newBotConfig]);

  // Composant Card réutilisable
  const Card: React.FC<CardProps> = ({ children, className = '', onClick }) => (
    <div 
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 ${className} ${onClick ? 'cursor-pointer hover:shadow-xl transition-shadow' : ''}`}
      onClick={onClick}
    >
      {children}
    </div>
  );

  // Page de connexion
  if (!isAuthenticated) {
    return (
      <div className={`min-h-screen ${isDarkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
        <div className="flex items-center justify-center min-h-screen p-4">
          <Card className="w-full max-w-md">
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <Bot className="w-16 h-16 text-purple-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                CryptoBot Pro
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Plateforme de Trading Automatisé
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="demo@cryptobot.com"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                  autoComplete="email"
                  id="email-input"
                  key="email-input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Mot de passe
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="demo123"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                  autoComplete="current-password"
                  id="password-input"
                  key="password-input"
                />
              </div>

              <button
                onClick={handleLogin}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
              >
                Se connecter
              </button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">ou</span>
                </div>
              </div>

              <button
                onClick={handleDemoAccess}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Zap className="w-5 h-5" />
                Accès Démo Gratuit
              </button>
            </div>

            <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
              <p>Pas encore de compte? <a href="/signup" className="text-purple-600 hover:underline">S&apos;inscrire</a></p>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Dashboard principal  
  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      {/* Sidebar */}
      <div className={`fixed left-0 top-0 h-full w-64 bg-white dark:bg-gray-800 shadow-xl transform transition-transform z-50 ${showMobileMenu ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Bot className="w-10 h-10 text-purple-600" />
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">CryptoBot Pro</h1>
            </div>
            <button
              onClick={() => setShowMobileMenu(false)}
              className="lg:hidden text-gray-600 dark:text-gray-400"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <nav className="space-y-2">
            <button
              onClick={() => setActiveSection('dashboard')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeSection === 'dashboard' 
                  ? 'bg-purple-600 text-white' 
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <HomeIcon className="w-5 h-5" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setActiveSection('bots')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeSection === 'bots' 
                  ? 'bg-purple-600 text-white' 
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <Bot className="w-5 h-5" />
              <span>Trading Bots</span>
            </button>

            <button
              onClick={() => setActiveSection('portfolio')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeSection === 'portfolio' 
                  ? 'bg-purple-600 text-white' 
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <Wallet className="w-5 h-5" />
              <span>Portfolio</span>
            </button>

            <button
              onClick={() => setActiveSection('analytics')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeSection === 'analytics' 
                  ? 'bg-purple-600 text-white' 
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <BarChart3 className="w-5 h-5" />
              <span>Analytics</span>
            </button>

            <button
              onClick={() => setActiveSection('settings')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeSection === 'settings' 
                  ? 'bg-purple-600 text-white' 
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <Settings className="w-5 h-5" />
              <span>Paramètres</span>
            </button>
          </nav>

          <div className="absolute bottom-6 left-6 right-6">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              <span>{isDarkMode ? 'Mode Clair' : 'Mode Sombre'}</span>
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors mt-2"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </div>

          
      <div className="lg:ml-64 min-h-screen">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 flex items-center justify-between">
            <button
              onClick={() => setShowMobileMenu(true)}
              className="lg:hidden text-gray-600 dark:text-gray-400"
            >
              <Menu className="w-6 h-6" />
            </button>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {activeSection === 'dashboard' && 'Dashboard'}
              {activeSection === 'bots' && 'Trading Bots'}
              {activeSection === 'portfolio' && 'Portfolio'}
              {activeSection === 'analytics' && 'Analytics'}
              {activeSection === 'settings' && 'Paramètres'}
            </h2>

            <div className="flex items-center gap-4">
              <button className="relative p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                <AlertCircle className="w-6 h-6" />
                <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                  U
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="p-6">
          {/* AJOUTEZ ICI LE BANDEAU */}
          <div className="bg-yellow-600 text-white p-2 text-center mb-4 rounded-lg">
            ⚠️ MODE DÉMO - Aucun trading réel - Pour test uniquement
          </div>    

          {activeSection === 'dashboard' && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Portfolio Total</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        ${portfolioValue.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <p className="text-sm text-green-600 flex items-center gap-1 mt-1">
                        <TrendingUp className="w-4 h-4" />
                        +12.34%
                      </p>
                    </div>
                    <Wallet className="w-10 h-10 text-purple-600" />
                  </div>
                </Card>

                <Card>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Profit du Jour</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        ${dailyProfit.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <p className="text-sm text-green-600 flex items-center gap-1 mt-1">
                        <ArrowUpRight className="w-4 h-4" />
                        +8.56%
                      </p>
                    </div>
                    <DollarSign className="w-10 h-10 text-green-600" />
                  </div>
                </Card>

                <Card>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Bots Actifs</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{activeBotsCount}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Sur 5 bots total
                      </p>
                    </div>
                    <Bot className="w-10 h-10 text-blue-600" />
                  </div>
                </Card>

                <Card>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Trades Total</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalTrades}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        +234 cette semaine
                      </p>
                    </div>
                    <Activity className="w-10 h-10 text-orange-600" />
                  </div>
                </Card>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Performance du Portfolio
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="time" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF',
                          border: 'none',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#8B5CF6" 
                        fill="url(#colorGradient)" 
                      />
                      <defs>
                        <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                    </AreaChart>
                  </ResponsiveContainer>
                </Card>

                <Card>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Répartition du Portfolio
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({name, percent}) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </Card>
              </div>

              {/* Live Prices */}
              <Card>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Prix en Temps Réel
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {Object.entries(cryptoPrices).map(([symbol, data]) => (
                    <div key={symbol} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-gray-900 dark:text-white">{symbol}</span>
                        <span className={`text-sm flex items-center gap-1 ${data.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {data.change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {Math.abs(data.change).toFixed(2)}%
                        </span>
                      </div>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">
                        ${data.price.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        Vol: ${data.volume}
                      </p>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Historique des Trades */}
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Historique des Trades Récents
                  </h3>
                  <button
                    onClick={loadTradeHistory}
                    className="text-purple-600 hover:text-purple-700 text-sm"
                  >
                    {loadingTrades ? 'Chargement...' : 'Actualiser'}
                  </button>
                </div>
                
                {tradeHistory.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b dark:border-gray-700">
                          <th className="text-left py-2 text-gray-600 dark:text-gray-400">Date</th>
                          <th className="text-left py-2 text-gray-600 dark:text-gray-400">Paire</th>
                          <th className="text-left py-2 text-gray-600 dark:text-gray-400">Type</th>
                          <th className="text-right py-2 text-gray-600 dark:text-gray-400">Quantité</th>
                          <th className="text-right py-2 text-gray-600 dark:text-gray-400">Prix</th>
                          <th className="text-right py-2 text-gray-600 dark:text-gray-400">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedTrades.map((trade, index) => (
                          <tr key={trade.id || index} className="border-b dark:border-gray-700">
                            <td className="py-2 text-gray-900 dark:text-white">
                              {new Date(trade.time).toLocaleDateString('fr-FR')}
                            </td>
                            <td className="py-2 text-gray-900 dark:text-white">{trade.symbol}</td>
                            <td className="py-2">
                              <span className={`px-2 py-1 rounded text-xs ${
                                trade.isBuyer 
                                  ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300' 
                                  : 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300'
                              }`}>
                                {trade.isBuyer ? 'ACHAT' : 'VENTE'}
                              </span>
                            </td>
                            <td className="py-2 text-right text-gray-900 dark:text-white">
                              {trade.qty.toFixed(8)}
                            </td>
                            <td className="py-2 text-right text-gray-900 dark:text-white">
                              ${trade.price.toFixed(2)}
                            </td>
                            <td className="py-2 text-right font-medium text-gray-900 dark:text-white">
                              ${trade.quoteQty.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* AJOUTEZ ICI - Contrôles de pagination */}
                    <div className="flex justify-between items-center mt-4">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Total P&L: <span className={totalPL >= 0 ? 'text-green-600' : 'text-red-600'}>
                          ${totalPL.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                          className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 disabled:opacity-50"
                        >
                          Précédent
                        </button>
                        <span className="px-3 py-1">
                          Page {currentPage} / {Math.ceil(filteredTrades.length / tradesPerPage)}
                        </span>
                        <button
                          onClick={() => setCurrentPage(p => p + 1)}
                          disabled={currentPage >= Math.ceil(filteredTrades.length / tradesPerPage)}
                          className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 disabled:opacity-50"
                        >
                          Suivant
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    {loadingTrades ? 'Chargement des trades...' : 'Aucun trade récent'}
                  </div>
                )}
              </Card>

              {/* Section Monitoring des Bots */}
              <Card>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Monitoring Bots Actifs
                  </h3>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        const logger = new TradeLogger();
                        logger.loadFromLocalStorage();
                        logger.downloadCSV();
                      }}
                      className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
                    >
                      📥 Export CSV
                    </button>
                    
                    <button 
                      onClick={() => {
                        const trades = JSON.parse(localStorage.getItem('trade_history') || '[]');
                        const stats = {
                          totalTrades: trades.length,
                          totalInvested: trades.reduce((sum: number, t: any) => sum + (t.total || 0), 0),
                          bySymbol: {} as any
                        };
                        
                        trades.forEach((t: any) => {
                          if (!stats.bySymbol[t.symbol]) {
                            stats.bySymbol[t.symbol] = { count: 0, total: 0, quantity: 0 };
                          }
                          stats.bySymbol[t.symbol].count++;
                          stats.bySymbol[t.symbol].total += t.total || 0;
                          stats.bySymbol[t.symbol].quantity += t.quantity || 0;
                        });
                        
                        console.table(stats.bySymbol);
                        alert(`📊 Statistiques:\n\nTrades: ${stats.totalTrades}\nInvesti: ${stats.totalInvested.toFixed(2)} USDT\n\nDétails par crypto dans la console (F12).`);
                      }}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded text-sm"
                    >
                      📊 Voir Statistiques
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Bot DCA Bitcoin</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Status: <span className="text-green-500">Actif</span>
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Trades: 5</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Investi: $600</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">BTC: 0.005</p>
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Bot Grid ETH</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Status: <span className="text-yellow-500">En attente</span>
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Grilles: 10</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Range: $3000-$3500</p>
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Stop-Loss Auto</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Status: <span className="text-gray-500">Inactif</span>
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Seuil: -5%</p>
                  </div>
                </div>
              </Card>

            </div>
          )}  {/* Fermeture du dashboard */}

          {activeSection === 'bots' && (
            <div className="space-y-6">
              {/* Header Actions */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 dark:text-gray-400">
                    Gérez vos bots de trading automatisés
                  </p>
                </div>

                {/* REMPLACEZ le bouton seul par une div avec plusieurs boutons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowCreateBot(true)}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                    Créer Bot
                  </button>
                  
                  {/* BOUTON TEST DCA existant */}
                  <button 
                    onClick={async () => {
                      if (!confirm('Créer un ordre TEST de 0.001 BTC (~100 USDT) ?')) return;
            
                      const res = await fetch('/api/binance/create-order', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          symbol: 'BTCUSDT',
                          side: 'BUY',
                          quantity: 0.001,
                          type: 'MARKET'
                        })
                      });
                      
                      const data = await res.json();
                      console.log('Order result:', data);
                      alert(data.success ? '✅ Ordre TEST créé!' : `❌ Erreur: ${data.error}`);
                    }}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
                  >
                    <Zap className="w-5 h-5" />
                    Test Ordre DCA (0.001 BTC)
                  </button>

                  {/* BOUTON Bot DCA Automatique */}
                  <button
                    onClick={async () => {
                      const { DCABot, DCABotManager } = await import('@/lib/dca-bot');
                      
                      // Créer un manager pour gérer plusieurs bots
                      const manager = new DCABotManager();
                      
                      // Bot Bitcoin - toutes les 24h
                      const btcBot = manager.createBot('btc-dca', 'BTCUSDT', 120, 24);
                      btcBot.start();
                      
                      // Bot Ethereum - toutes les 24h  
                      const ethBot = manager.createBot('eth-dca', 'ETHUSDT', 50, 24);
                      ethBot.start();
                      
                      // Bot BNB - toutes les 12h
                      const bnbBot = manager.createBot('bnb-dca', 'BNBUSDT', 30, 12);
                      bnbBot.start();
                      
                      // Afficher les stats après 30 secondes
                      setTimeout(() => {
                        console.log('All bots stats:', manager.getStats());
                      }, 30000);
                      
                      alert('3 Bots DCA démarrés:\n- BTC: 120 USDT/24h\n- ETH: 50 USDT/24h\n- BNB: 30 USDT/12h');
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
                  >
                    <Bot className="w-5 h-5" />
                    Démarrer Bot DCA Auto
                  </button>

                  {/* NOUVEAU - Bouton Grid Bot */}
                  <button
                    onClick={async () => {
                      const { GridBot } = await import('@/lib/grid-bot');
                      const gridBot = new GridBot('ETHUSDT', 3000, 3500, 10, 1000);
                      await gridBot.start();
                      alert('Grid Bot ETH démarré: 10 grilles entre $3000-$3500');
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
                  >
                    📊 Démarrer Grid Bot
                  </button>

                  {/* NOUVEAU - Bot Analyse Avancée */}
                  <button
                    onClick={async () => {
                      try {
                        const { AdvancedAnalysisBot } = await import('@/lib/advanced-analysis-bot');

                        // Liste étendue des cryptos majeures
                        const symbols = [
                          'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT',
                          'ADAUSDT', 'DOGEUSDT', 'AVAXUSDT', 'MATICUSDT', 'LINKUSDT'
                        ];

                        const bot = new AdvancedAnalysisBot(0.05, symbols);
                        
                        console.log('⏳ Initialisation du bot d\'analyse...');
                        await bot.initialize();
                        
                        console.log('🔍 Analyse de', symbols.length, 'cryptos en cours...');
                        const signals = await bot.execute();
                        
                        console.log('📊 Backtesting...');
                        await bot.backtest('DCA', 30);
                        
                        // Créer un résumé pour l'utilisateur
                        const bestSignal = signals
                          .filter(s => s.suggestedAction !== 'HOLD')
                          .sort((a, b) => (b.confidence * b.strength) - (a.confidence * a.strength))[0];
                        
                        if (bestSignal) {
                          alert(`✨ Analyse terminée!\n\nMeilleure opportunité: ${bestSignal.symbol}\nAction: ${bestSignal.suggestedAction}\nConfiance: ${(bestSignal.confidence * 100).toFixed(0)}%\nRisque: ${bestSignal.riskLevel}\n\n⚠️ RAPPEL: Aucune garantie de profit!\n\nVoir la console pour détails complets.`);
                        } else {
                          alert('📊 Analyse terminée\n\nAucune opportunité claire détectée.\nRester en dehors du marché.\n\nVoir la console pour détails.');
                        }
                        
                      } catch (error) {
                        console.error('Erreur bot analyse:', error);
                        alert('❌ Erreur lors de l\'analyse. Vérifiez la console.');
                      }
                    }}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
                  >
                    🤖 Bot Analyse Avancée
                  </button>


                  {/* AJOUTEZ ICI LE NOUVEAU BOUTON - ligne ~1040 */}
                  <button
                    onClick={async () => {
                      const { CandlestickBot } = await import('@/lib/candlestick-bot');
                      const bot = new CandlestickBot();
                      
                      const pairs = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'ADAUSDT'];
                      
                      const results = [];
                      for (const pair of pairs) {
                        console.log(`\n🕯️ Analyse ${pair}...`);
                        const result = await bot.analyzeCandles(pair);
                        results.push(result);
                        await new Promise(resolve => setTimeout(resolve, 1000));
                      }
                      
                      const buySignals = results.filter(r => r?.action === 'BUY');
                      const sellSignals = results.filter(r => r?.action === 'SELL');
                      
                      alert(`📊 Analyse Bougies Japonaises terminée!\n\n` +
                            `🟢 Signaux ACHAT: ${buySignals.length}\n` +
                            `🔴 Signaux VENTE: ${sellSignals.length}\n` +
                            `⏸️ HOLD: ${results.length - buySignals.length - sellSignals.length}\n\n` +
                            `Voir console pour détails complets`);
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
                  >
                    🕯️ Bot Bougies Japonaises
                  </button>

                  {/* AJOUTEZ ICI LE NOUVEAU BOUTON MOMENTUM - ligne ~1060 */}
                  <button
                    onClick={async () => {
                      const { MomentumStrategy } = await import('@/lib/momentum-strategy');
                      const momentum = new MomentumStrategy();
                      
                      const capital = 1000; // USDT
                      const symbols = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT'];
                      
                      for (const symbol of symbols) {
                        console.log(`\n📊 Analyse Momentum ${symbol}...`);
                        const result = await momentum.execute(symbol, capital);
                        
                        if (result.success) {
                          alert(`✅ SIGNAL MOMENTUM sur ${symbol}!\n\n` +
                                `Entrée: ${result.entry} USDT\n` +
                                `Stop-Loss: ${result.stopLoss} USDT\n` +
                                `Take-Profit: ${result.takeProfit} USDT\n` +
                                `Taille: ${result.size} USDT`);
                        }
                      }
                      
                      momentum.monitor(symbols, capital, 300000);
                    }}
                    className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
                  >
                    🚀 Stratégie Momentum (25-35% annuel)
                  </button>
          
                </div>
              </div>


              {/* Bots Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {bots.map(bot => (
                  <Card key={bot.id} className="relative">
                    <div className="absolute top-4 right-4">
                      <button
                        onClick={() => toggleBotStatus(bot.id)}
                        className={`p-2 rounded-lg ${
                          bot.status === 'active' 
                            ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        } transition-colors`}
                      >
                        {bot.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </button>
                    </div>

                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Bot className="w-5 h-5 text-purple-600" />
                        <h3 className="font-semibold text-gray-900 dark:text-white">{bot.name}</h3>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300 rounded">
                          {bot.type}
                        </span>
                        <span className={`px-2 py-1 rounded ${
                          bot.status === 'active' 
                            ? 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300' 
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                        }`}>
                          {bot.status === 'active' ? 'Actif' : 'En pause'}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Paire</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{bot.pair}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Investissement</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">${bot.investment}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Profit</span>
                        <span className={`text-sm font-medium ${bot.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ${bot.profit} ({bot.profitPercent}%)
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Trades</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{bot.trades}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Durée</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{bot.runtime}</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <button className="w-full text-purple-600 hover:text-purple-700 text-sm font-medium flex items-center justify-center gap-1">
                        Voir détails
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {activeSection === 'portfolio' && (
            <div className="space-y-6">
              <Card>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                  Aperçu du Portfolio
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Valeur Totale</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      ${portfolioValue.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Profit Total</p>
                    <p className="text-2xl font-bold text-green-600">
                      +$12,456.78
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">ROI</p>
                    <p className="text-2xl font-bold text-purple-600">
                      +24.5%
                    </p>
                  </div>
                </div>

                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="time" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF',
                        border: 'none',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#8B5CF6" 
                      fill="url(#portfolioGradient)" 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="profit" 
                      stroke="#10B981" 
                      fill="url(#profitGradient)" 
                    />
                    <defs>
                      <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.1}/>
                      </linearGradient>
                      <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                  </AreaChart>
                </ResponsiveContainer>
              </Card>
            </div>
          )}

          {activeSection === 'analytics' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Performance par Bot
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={bots}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="name" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF',
                          border: 'none',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <Bar dataKey="profit" fill="#8B5CF6" />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>

                <Card>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Statistiques Globales
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400">Taux de Succès</span>
                      <span className="text-xl font-bold text-green-600">87.3%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400">Profit Moyen/Trade</span>
                      <span className="text-xl font-bold text-gray-900 dark:text-white">$12.45</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400">Drawdown Max</span>
                      <span className="text-xl font-bold text-red-600">-8.2%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400">Sharpe Ratio</span>
                      <span className="text-xl font-bold text-purple-600">1.82</span>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {activeSection === 'settings' && (
            <div className="space-y-6">
              <Card>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                  Paramètres du Compte
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Clé API Binance
                    </label>
                    <input
                      type="password"
                      placeholder="••••••••••••••••"
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Secret API Binance
                    </label>
                    <input
                      type="password"
                      placeholder="••••••••••••••••"
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <button className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition-colors">
                    Sauvegarder
                  </button>

                  {/* AJOUTEZ ICI LE NOUVEAU BOUTON */}
                  <button 
                    onClick={async () => {
                      const res = await fetch('/api/binance/balance');
                      const data = await res.json();
                      console.log('Binance Testnet Balance:', data);

                      if (data.balances && data.balances.length > 0) {
                        const formattedBalances = data.balances
                          .map((b: any) => `${b.asset}: ${parseFloat(b.free).toFixed(2)}`)
                          .join('\n');
                        alert(`✅ Connexion Testnet Réussie!\n\nVos Balances:\n${formattedBalances}`);
                      } else if (data.error) {
                        alert(`❌ Erreur: ${data.error}`);
                      } else {
                        alert('Aucune balance trouvée');
                      }
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg ml-2"
                  >
                    Tester Connexion Binance (TESTNET)
                  </button>

                  {/* AJOUTEZ ICI LE NOUVEAU BOUTON */}

                  <button 
                    onClick={async () => {
                      const res = await fetch('/api/binance/prices');
                      const data = await res.json();
                      console.log('Prix et balances:', data);
                      if (data.portfolioValue) {
                        alert(`Portfolio Value: $${data.portfolioValue}`);
                      }
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg ml-2"
                  >
                    Voir Prix & Portfolio
                  </button>

                  {/* AJOUTEZ ICI LE NOUVEAU BOUTON STOP-LOSS GLOBAL */}
                  <button
                    onClick={async () => {
                      // Vérifier si des stop-loss sont déjà actifs
                      const existingStopLosses = localStorage.getItem('active_stop_losses');
                      if (existingStopLosses) {
                        if (!confirm('Des Stop-Loss sont déjà actifs. Les remplacer ?')) {
                          return;
                        }
                      }
                      
                      const { StopLossMonitor } = await import('@/lib/stop-loss');
                      
                      const stopLossConfigs = [
                        { symbol: 'BTCUSDT', price: 115000, percent: 5, quantity: 0.001 },
                        { symbol: 'ETHUSDT', price: 4500, percent: 5, quantity: 0.01 },
                        { symbol: 'BNBUSDT', price: 900, percent: 5, quantity: 0.03 },
                        { symbol: 'SOLUSDT', price: 235, percent: 8, quantity: 0.1 },
                        { symbol: 'ADAUSDT', price: 0.86, percent: 8, quantity: 100 }
                      ];
                      
                      // Arrêter les anciens moniteurs si existants
                      if ((window as any).stopLossMonitors) {
                        (window as any).stopLossMonitors.forEach((m: any) => m.stop());
                      }
                      
                      // Créer les nouveaux moniteurs
                      window.stopLossMonitors = stopLossConfigs.map(config => {
                        const monitor = new StopLossMonitor(
                          config.symbol,
                          config.price,
                          config.percent,
                          config.quantity
                        );
                        monitor.start();
                        return monitor;
                      });
                      
                      localStorage.setItem('active_stop_losses', JSON.stringify(stopLossConfigs));
                      
                      alert(`✅ Stop-Loss activés (anciens arrêtés):\n\n${stopLossConfigs.map(c => 
                        `${c.symbol}: -${c.percent}% à $${c.price}`
                      ).join('\n')}\n\n⚠️ Surveillance active 24/7`);
                    }}
                    className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg transition-colors"
                  >
                    🛑 Activer Stop-Loss GLOBAL (Toutes Cryptos)
                  </button>

                </div>
              </Card>
            </div>
          )}
        </main>
      </div>

      {/* Modal Création Bot */}
      {showCreateBot && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Créer un Nouveau Bot
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nom du Bot
                </label>
                <input
                  type="text"
                  value={newBotConfig.name}
                  onChange={(e) => setNewBotConfig({...newBotConfig, name: e.target.value})}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Type de Bot
                </label>
                <select
                  value={newBotConfig.type}
                  onChange={(e) => setNewBotConfig({...newBotConfig, type: e.target.value})}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="DCA">DCA</option>
                  <option value="GRID">Grid</option>
                  <option value="ARBITRAGE">Arbitrage</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Paire de Trading
                </label>
                <select
                  value={newBotConfig.pair}
                  onChange={(e) => setNewBotConfig({...newBotConfig, pair: e.target.value})}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="BTC/USDT">BTC/USDT</option>
                  <option value="ETH/USDT">ETH/USDT</option>
                  <option value="BNB/USDT">BNB/USDT</option>
                  <option value="SOL/USDT">SOL/USDT</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Investissement ($)
                </label>
                <input
                  type="number"
                  value={newBotConfig.investment}
                  onChange={(e) => setNewBotConfig({...newBotConfig, investment: parseInt(e.target.value)})}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div className="flex gap-4">
                <button
                  onClick={createNewBot}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  Créer Bot
                </button>
                <button
                  onClick={() => setShowCreateBot(false)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-700 text-gray-900 dark:text-white px-6 py-2 rounded-lg transition-colors"
                >
                  Annuler
                </button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}