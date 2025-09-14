import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol') || 'BTCUSDT';
  
  const baseUrl = process.env.BINANCE_TESTNET === 'true' 
    ? 'https://testnet.binance.vision'
    : 'https://api.binance.com';

  const timestamp = Date.now();
  const queryString = `symbol=${symbol}&timestamp=${timestamp}&limit=50`;
  const signature = crypto
    .createHmac('sha256', process.env.BINANCE_SECRET_KEY!)
    .update(queryString)
    .digest('hex');

  try {
    const response = await fetch(
      `${baseUrl}/api/v3/myTrades?${queryString}&signature=${signature}`,
      { headers: { 'X-MBX-APIKEY': process.env.BINANCE_API_KEY! } }
    );

    const trades = await response.json();
    
    // Formatter les trades
    const formattedTrades = Array.isArray(trades) ? trades.map((trade: any) => ({
      id: trade.id,
      orderId: trade.orderId,
      symbol: trade.symbol,
      price: parseFloat(trade.price),
      qty: parseFloat(trade.qty),
      quoteQty: parseFloat(trade.quoteQty),
      commission: parseFloat(trade.commission),
      time: new Date(trade.time),
      isBuyer: trade.isBuyer,
      isMaker: trade.isMaker
    })) : [];

    return NextResponse.json({
      success: true,
      trades: formattedTrades,
      count: formattedTrades.length
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch trades' }, { status: 500 });
  }
}