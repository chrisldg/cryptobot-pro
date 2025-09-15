// app/api/binance/klines/route.ts
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol') || 'BTCUSDT';
  const interval = searchParams.get('interval') || '1h';
  const limit = searchParams.get('limit') || '100';
  
  try {
    // Utiliser l'API publique de Binance (pas besoin de clé)
    const response = await fetch(
      `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`
    );
    
    const data = await response.json();
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Klines error:', error);
    return NextResponse.json({ error: 'Failed to fetch klines' }, { status: 500 });
  }
}