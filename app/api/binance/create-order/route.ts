import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request: Request) {
  // TESTNET UNIQUEMENT pour l'instant
  if (process.env.BINANCE_TESTNET !== 'true') {
    return NextResponse.json({ error: 'Testnet only for safety' }, { status: 403 });
  }

  const body = await request.json();
  const { symbol, side, quantity, type = 'MARKET' } = body;

  // Validation basique
  if (!symbol || !side || !quantity) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  }

  // Limite de sécurité : max 100 USDT par ordre
  if (parseFloat(quantity) * 100000 > 100) { // Estimation prix BTC
    return NextResponse.json({ error: 'Max 100 USDT per order in test mode' }, { status: 400 });
  }

  const baseUrl = 'https://testnet.binance.vision';
  const timestamp = Date.now();
  
  const params = new URLSearchParams({
    symbol: symbol.replace('/', ''),
    side,
    type,
    quantity: parseFloat(quantity).toFixed(8),
    timestamp: timestamp.toString()
  });

  const signature = crypto
    .createHmac('sha256', process.env.BINANCE_SECRET_KEY!)
    .update(params.toString())
    .digest('hex');

  params.append('signature', signature);

  try {
    const response = await fetch(`${baseUrl}/api/v3/order`, {
      method: 'POST',
      headers: {
        'X-MBX-APIKEY': process.env.BINANCE_API_KEY!,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });

    const data = await response.json();
    
    if (!response.ok) {
      return NextResponse.json({ error: data.msg || 'Order failed' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      order: data,
      testnet: true,
      warning: 'This is a TESTNET order - no real money involved'
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}