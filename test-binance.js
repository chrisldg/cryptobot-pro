// test-binance.js
require('dotenv').config({ path: '.env.local' });  // Ajouter cette ligne au début

const crypto = require('crypto');

const apiKey = process.env.BINANCE_API_KEY;
const apiSecret = process.env.BINANCE_SECRET_KEY;

console.log('API Key présente:', apiKey ? '✅' : '❌');
console.log('Secret Key présente:', apiSecret ? '✅' : '❌');

const baseUrl = 'https://testnet.binance.vision';

async function testConnection() {
  try {
    const response = await fetch(`${baseUrl}/api/v3/ping`);
    console.log('Ping:', response.ok ? '✅ Connecté' : '❌ Échec');
    
    // Test account info (nécessite signature)
    const timestamp = Date.now();
    const queryString = `timestamp=${timestamp}`;
    const signature = crypto
      .createHmac('sha256', apiSecret)
      .update(queryString)
      .digest('hex');
    
    const accountResponse = await fetch(
      `${baseUrl}/api/v3/account?${queryString}&signature=${signature}`,
      { headers: { 'X-MBX-APIKEY': apiKey } }
    );
    
    const data = await accountResponse.json();
    console.log('Account:', data.balances ? '✅ Authentifié' : '❌ Erreur');
  } catch (error) {
    console.error('Erreur:', error);
  }
}

testConnection();