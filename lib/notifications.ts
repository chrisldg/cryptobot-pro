// lib/notifications.ts
// Système complet de notifications multi-canal

// Installation nécessaire:
// npm install nodemailer discord.js node-telegram-bot-api

import nodemailer from 'nodemailer';
import { Client, GatewayIntentBits, TextChannel } from 'discord.js';
import TelegramBot from 'node-telegram-bot-api';

// ===== CONFIGURATION =====
interface NotificationConfig {
  email?: {
    service: string;
    user: string;
    pass: string;
    to: string[];
  };
  telegram?: {
    botToken: string;
    chatIds: string[];
  };
  discord?: {
    botToken: string;
    channelIds: string[];
  };
}

// ===== GESTIONNAIRE DE NOTIFICATIONS =====
export class NotificationManager {
  private emailTransporter?: nodemailer.Transporter;
  private telegramBot?: any;
  private discordClient?: Client;
  private isInitialized = false;

  constructor(private config: NotificationConfig) {}

  async initialize() {
    // Configurer Email
    if (this.config.email) {
      this.emailTransporter = nodemailer.createTransport({
        service: this.config.email.service,
        auth: {
          user: this.config.email.user,
          pass: this.config.email.pass
        }
      });
    }

    // Configurer Telegram
    if (this.config.telegram) {
      this.telegramBot = new TelegramBot(this.config.telegram.botToken, { polling: false });
    }

    // Configurer Discord
    if (this.config.discord) {
      this.discordClient = new Client({
        intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
      });
      await this.discordClient.login(this.config.discord.botToken);
    }

    this.isInitialized = true;
    console.log('Notification manager initialized');
  }

  // Envoyer notification sur tous les canaux
  async sendNotification(
    title: string,
    message: string,
    type: 'info' | 'success' | 'warning' | 'error' = 'info',
    data?: any
  ) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const promises = [];

    // Envoyer Email
    if (this.emailTransporter && this.config.email) {
      promises.push(this.sendEmail(title, message, type, data));
    }

    // Envoyer Telegram
    if (this.telegramBot && this.config.telegram) {
      promises.push(this.sendTelegram(title, message, type, data));
    }

    // Envoyer Discord
    if (this.discordClient && this.config.discord) {
      promises.push(this.sendDiscord(title, message, type, data));
    }

    await Promise.allSettled(promises);
  }

  // Envoyer Email
  private async sendEmail(title: string, message: string, type: string, data?: any) {
    if (!this.emailTransporter || !this.config.email) return;

    const emoji = this.getEmoji(type);
    const color = this.getColor(type);

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0;">${emoji} CryptoBot Pro</h1>
        </div>
        <div style="background: #f7f7f7; padding: 20px; border-radius: 0 0 10px 10px;">
          <h2 style="color: ${color};">${title}</h2>
          <p style="color: #333; line-height: 1.6;">${message}</p>
          ${data ? `
            <div style="background: white; padding: 15px; border-radius: 5px; margin-top: 15px;">
              <pre style="color: #666; font-size: 12px;">${JSON.stringify(data, null, 2)}</pre>
            </div>
          ` : ''}
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          <p style="color: #999; font-size: 12px;">
            Cette notification a été envoyée par CryptoBot Pro. 
            <a href="https://cryptobot-pro.vercel.app" style="color: #667eea;">Voir le dashboard</a>
          </p>
        </div>
      </div>
    `;

    try {
      await this.emailTransporter.sendMail({
        from: this.config.email.user,
        to: this.config.email.to.join(', '),
        subject: `${emoji} ${title} - CryptoBot Pro`,
        html: htmlContent
      });
      console.log('Email notification sent');
    } catch (error) {
      console.error('Error sending email:', error);
    }
  }

  // Envoyer Telegram
  private async sendTelegram(title: string, message: string, type: string, data?: any) {
    if (!this.telegramBot || !this.config.telegram) return;

    const emoji = this.getEmoji(type);
    const formattedMessage = `
${emoji} *${title}*

${message}

${data ? '```json\n' + JSON.stringify(data, null, 2) + '\n```' : ''}

_Envoyé par CryptoBot Pro_
    `.trim();

    for (const chatId of this.config.telegram.chatIds) {
      try {
        await this.telegramBot.sendMessage(chatId, formattedMessage, {
          parse_mode: 'Markdown',
          disable_web_page_preview: true
        });
        console.log(`Telegram notification sent to ${chatId}`);
      } catch (error) {
        console.error(`Error sending Telegram to ${chatId}:`, error);
      }
    }
  }

  // Envoyer Discord
  private async sendDiscord(title: string, message: string, type: string, data?: any) {
    if (!this.discordClient || !this.config.discord) return;

    const emoji = this.getEmoji(type);
    const color = this.getDiscordColor(type);

    const embed = {
      title: `${emoji} ${title}`,
      description: message,
      color: color,
      fields: data ? [
        {
          name: 'Détails',
          value: '```json\n' + JSON.stringify(data, null, 2).substring(0, 1000) + '\n```',
          inline: false
        }
      ] : [],
      footer: {
        text: 'CryptoBot Pro',
        icon_url: 'https://cryptobot-pro.vercel.app/logo.png'
      },
      timestamp: new Date().toISOString()
    };

    for (const channelId of this.config.discord.channelIds) {
      try {
        const channel = await this.discordClient.channels.fetch(channelId) as TextChannel;
        await channel.send({ embeds: [embed] });
        console.log(`Discord notification sent to ${channelId}`);
      } catch (error) {
        console.error(`Error sending Discord to ${channelId}:`, error);
      }
    }
  }

  private getEmoji(type: string): string {
    switch (type) {
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      default: return 'ℹ️';
    }
  }

  private getColor(type: string): string {
    switch (type) {
      case 'success': return '#10b981';
      case 'warning': return '#f59e0b';
      case 'error': return '#ef4444';
      default: return '#3b82f6';
    }
  }

  private getDiscordColor(type: string): number {
    switch (type) {
      case 'success': return 0x10b981;
      case 'warning': return 0xf59e0b;
      case 'error': return 0xef4444;
      default: return 0x3b82f6;
    }
  }
}

// ===== NOTIFICATIONS SPÉCIFIQUES AU TRADING =====
export class TradingNotifications {
  constructor(private notificationManager: NotificationManager) {}

  // Nouveau trade exécuté
  async notifyTradeExecuted(trade: {
    bot: string;
    type: 'buy' | 'sell';
    pair: string;
    amount: number;
    price: number;
    total: number;
  }) {
    await this.notificationManager.sendNotification(
      `Trade Exécuté - ${trade.bot}`,
      `${trade.type.toUpperCase()} ${trade.amount} ${trade.pair.split('/')[0]} @ ${trade.price}
Total: ${trade.total} USDT`,
      'success',
      trade
    );
  }

  // Profit réalisé
  async notifyProfit(data: {
    bot: string;
    profit: number;
    profitPercent: number;
    totalProfit: number;
  }) {
    await this.notificationManager.sendNotification(
      `💰 Profit Réalisé!`,
      `Bot: ${data.bot}
Profit: +${data.profit.toFixed(2)} USDT (${data.profitPercent.toFixed(2)}%)
Profit Total: ${data.totalProfit.toFixed(2)} USDT`,
      'success',
      data
    );
  }

  // Alerte de perte
  async notifyLoss(data: {
    bot: string;
    loss: number;
    lossPercent: number;
    action: string;
  }) {
    await this.notificationManager.sendNotification(
      `Alerte Perte`,
      `Bot: ${data.bot}
Perte: -${data.loss.toFixed(2)} USDT (${data.lossPercent.toFixed(2)}%)
Action: ${data.action}`,
      'warning',
      data
    );
  }

  // Erreur bot
  async notifyBotError(bot: string, error: string) {
    await this.notificationManager.sendNotification(
      `Erreur Bot - ${bot}`,
      `Une erreur s'est produite: ${error}`,
      'error',
      { bot, error, timestamp: new Date() }
    );
  }

  // Statut quotidien
  async notifyDailyReport(report: {
    totalProfit: number;
    totalTrades: number;
    winRate: number;
    activeBots: number;
    topBot: string;
  }) {
    await this.notificationManager.sendNotification(
      `📊 Rapport Quotidien`,
      `Profit du jour: ${report.totalProfit.toFixed(2)} USDT
Trades exécutés: ${report.totalTrades}
Taux de réussite: ${report.winRate.toFixed(2)}%
Bots actifs: ${report.activeBots}
Meilleur bot: ${report.topBot}`,
      'info',
      report
    );
  }

  // Alerte de marché
  async notifyMarketAlert(alert: {
    type: 'volatility' | 'crash' | 'pump';
    pair: string;
    change: number;
    recommendation: string;
  }) {
    const emoji = alert.type === 'crash' ? '📉' : alert.type === 'pump' ? '📈' : '⚡';
    
    await this.notificationManager.sendNotification(
      `${emoji} Alerte Marché - ${alert.pair}`,
      `Type: ${alert.type.toUpperCase()}
Changement: ${alert.change.toFixed(2)}%
Recommandation: ${alert.recommendation}`,
      alert.type === 'crash' ? 'error' : 'warning',
      alert
    );
  }
}

// ===== WEBHOOK POUR RECEVOIR DES COMMANDES =====
export class CommandWebhook {
  private commands: Map<string, (args: string[]) => Promise<any>> = new Map();

  constructor(private notificationManager: NotificationManager) {
    this.registerDefaultCommands();
  }

  private registerDefaultCommands() {
    // Commande status
    this.registerCommand('status', async () => {
      // Récupérer le statut depuis la DB
      return {
        bots: 3,
        profit: 1234.56,
        status: 'Running'
      };
    });

    // Commande stop
    this.registerCommand('stop', async (args) => {
      const botName = args[0];
      // Arrêter le bot
      return `Bot ${botName} arrêté`;
    });

    // Commande start
    this.registerCommand('start', async (args) => {
      const botName = args[0];
      // Démarrer le bot
      return `Bot ${botName} démarré`;
    });
  }

  registerCommand(name: string, handler: (args: string[]) => Promise<any>) {
    this.commands.set(name, handler);
  }

  async handleCommand(command: string, args: string[]) {
    const handler = this.commands.get(command);
    
    if (!handler) {
      return `Commande inconnue: ${command}`;
    }

    try {
      const result = await handler(args);
      await this.notificationManager.sendNotification(
        `Commande Exécutée: ${command}`,
        JSON.stringify(result),
        'success'
      );
      return result;
    } catch (error: any) {
      await this.notificationManager.sendNotification(
        `Erreur Commande: ${command}`,
        error.message,
        'error'
      );
      throw error;
    }
  }
}

// ===== EXEMPLE D'UTILISATION =====
export const setupNotifications = async () => {
  const config: NotificationConfig = {
    email: {
      service: 'gmail',
      user: process.env.EMAIL_USER!,
      pass: process.env.EMAIL_PASS!,
      to: ['user@example.com']
    },
    telegram: {
      botToken: process.env.TELEGRAM_BOT_TOKEN!,
      chatIds: [process.env.TELEGRAM_CHAT_ID!]
    },
    discord: {
      botToken: process.env.DISCORD_BOT_TOKEN!,
      channelIds: [process.env.DISCORD_CHANNEL_ID!]
    }
  };

  const notificationManager = new NotificationManager(config);
  await notificationManager.initialize();

  const tradingNotifications = new TradingNotifications(notificationManager);
  
  // Exemple d'envoi de notification
  await tradingNotifications.notifyTradeExecuted({
    bot: 'DCA Bitcoin Pro',
    type: 'buy',
    pair: 'BTC/USDT',
    amount: 0.001,
    price: 65000,
    total: 65
  });

  return { notificationManager, tradingNotifications };
};