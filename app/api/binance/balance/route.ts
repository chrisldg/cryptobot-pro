import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function GET() {
  // Vérifier que c'est bien le testnet
  if (process.env.BINANCE_TESTNET !== 'true') {
    return NextResponse.json({ error: 'Testnet only' }, { status: 403 });
  }

  const apiKey = process.env.BINANCE_API_KEY;
  const apiSecret = process.env.BINANCE_SECRET_KEY;
  const baseUrl = 'https://testnet.binance.vision';

  if (!apiKey || !apiSecret) {
    return NextResponse.json({ error: 'API keys not configured' }, { status: 500 });
  }

  const timestamp = Date.now();
  const queryString = `timestamp=${timestamp}`;
  const signature = crypto
    .createHmac('sha256', apiSecret)
    .update(queryString)
    .digest('hex');

  try {
    const response = await fetch(
      `${baseUrl}/api/v3/account?${queryString}&signature=${signature}`,
      { headers: { 'X-MBX-APIKEY': apiKey } }
    );

    const data = await response.json();
    
    if (!response.ok) {
      return NextResponse.json({ error: data.msg || 'API error' }, { status: 400 });
    }
    
    // Filtrer seulement les balances non-nulles
    const balances = data.balances?.filter((b: any) => 
      parseFloat(b.free) > 0 || parseFloat(b.locked) > 0
    );

    return NextResponse.json({ 
      testnet: true,
      balances: balances || [],
      updateTime: data.updateTime 
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch balance' }, { status: 500 });
  }
}