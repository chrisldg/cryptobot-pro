'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  TrendingUp, TrendingDown, DollarSign, Activity, BarChart3, 
  Settings, Play, Pause, AlertCircle, Zap, 
  ChevronRight, Menu, X, Moon, Sun, 
  Wallet, Bot, ArrowUpRight,
  Plus, Home
} from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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
  const totalTrades = 1847;

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
  const handleLogin = useCallback(() => {
    if (email === 'demo@cryptobot.com' && password === 'demo123') {
      setIsAuthenticated(true);
    } else if (email && password) {
      setIsAuthenticated(true);
    }
  }, [email, password]);

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

  const createNewBot = useCallback(() => {
    const newBot: Bot = {
      id: bots.length + 1,
      ...newBotConfig,
      status: 'active',
      profit: 0,
      profitPercent: 0,
      runtime: '0 jours',
      trades: 0
    };
    setBots(prev => [...prev, newBot]);
    setShowCreateBot(false);
    setNewBotConfig({
      name: '',
      type: 'DCA',
      pair: 'BTC/USDT',
      investment: 1000,
      config: {}
    });
  }, [bots, newBotConfig]);

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
              <p>Pas encore de compte? <a href="#" className="text-purple-600 hover:underline">S&apos;inscrire</a></p>
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
              <Home className="w-5 h-5" />
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
          </div>
        </div>
      </div>

      {/* Main Content */}
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
            </div>
          )}

          {activeSection === 'bots' && (
            <div className="space-y-6">
              {/* Header Actions */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 dark:text-gray-400">
                    Gérez vos bots de trading automatisés
                  </p>
                </div>
                <button
                  onClick={() => setShowCreateBot(true)}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Créer Bot
                </button>
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