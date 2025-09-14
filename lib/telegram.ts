export class TelegramBot {
  private token: string;
  private chatId: string;
  
  constructor(token: string, chatId: string) {
    this.token = token;
    this.chatId = chatId;
  }
  
  async sendMessage(text: string) {
    const url = `https://api.telegram.org/bot${this.token}/sendMessage`;
    
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: this.chatId,
        text,
        parse_mode: 'HTML'
      })
    });
  }
  
  async notifyTrade(bot: string, action: string, profit: number) {
    const message = `
🤖 <b>${bot}</b>
📊 Action: ${action}
💰 Profit: ${profit > 0 ? '+' : ''}${profit}€
⏰ ${new Date().toLocaleString()}
    `;
    
    await this.sendMessage(message);
  }
}