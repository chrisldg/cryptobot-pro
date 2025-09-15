import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request: Request) {
  if (process.env.BINANCE_TESTNET !== 'true') {
    return NextResponse.json({ 
      success: false,
      error: 'Testnet only' 
    }, { status: 403 });
  }

  const body = await request.json();
  const { symbol, side, quantity, type = 'MARKET' } = body;

  console.log('📦 Order request:', { symbol, side, quantity, type });

  const baseUrl = 'https://testnet.binance.vision';
  const timestamp = Date.now();
  
  const params: any = {
    symbol: symbol.replace('/', ''),
    side,
    type,
    quantity: parseFloat(quantity).toFixed(8),
    timestamp
  };

  const queryString = new URLSearchParams(params).toString();
  const signature = crypto
    .createHmac('sha256', process.env.BINANCE_SECRET_KEY!)
    .update(queryString)
    .digest('hex');

  try {
    const response = await fetch(`${baseUrl}/api/v3/order`, {
      method: 'POST',
      headers: {
        'X-MBX-APIKEY': process.env.BINANCE_API_KEY!,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: `${queryString}&signature=${signature}`
    });

    const data = await response.json();
    
    console.log('🔵 Binance response:', {
      status: response.status,
      ok: response.ok,
      data
    });

    // IMPORTANT: Toujours retourner success: true si response.ok
    if (response.ok) {
      return NextResponse.json({
        success: true,
        order: data,
        testnet: true,
        message: 'Order created successfully'
      });
    } else {
      // Log l'erreur spécifique de Binance
      console.error('❌ Binance error:', data);
      return NextResponse.json({
        success: false,
        error: data.msg || data.code || 'Order failed',
        details: data,
        testnet: true
      });
    }
  } catch (error) {
    console.error('🔴 Create order exception:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to create order',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}