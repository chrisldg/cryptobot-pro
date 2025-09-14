export class BinanceAPI {
  private apiKey: string;
  private apiSecret: string;
  private testnet: boolean;
  
  constructor(apiKey: string, apiSecret: string, testnet = true) {
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
    this.testnet = testnet;
  }
  
  get baseURL() {
    return this.testnet 
      ? 'https://testnet.binance.vision'
      : 'https://api.binance.com';
  }
  
  async getAccountInfo() {
    // Implémenter la signature HMAC SHA256
    const timestamp = Date.now();
    const queryString = `timestamp=${timestamp}`;
    // Signature à implémenter avec crypto
    
    const response = await fetch(`${this.baseURL}/api/v3/account?${queryString}`, {
      headers: {
        'X-MBX-APIKEY': this.apiKey
      }
    });
    
    return response.json();
  }
  
  async createOrder(symbol: string, side: 'BUY' | 'SELL', quantity: number) {
    // IMPORTANT: Toujours utiliser le TESTNET d'abord
    console.log('⚠️ MODE TEST - Pas d\'ordre réel placé');
    return {
      orderId: 'TEST-' + Date.now(),
      symbol,
      side,
      quantity,
      status: 'TEST'
    };
  }
}