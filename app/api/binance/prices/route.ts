import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbols = searchParams.get('symbols') || 'BTCUSDT,ETHUSDT,BNBUSDT,SOLUSDT,ADAUSDT';
  
  // Utiliser l'API publique de Binance (pas besoin d'auth pour les prix)
  const baseUrl = process.env.BINANCE_TESTNET === 'true' 
    ? 'https://testnet.binance.vision'
    : 'https://api.binance.com';

  try {
    // Récupérer les prix actuels
    const pricePromises = symbols.split(',').map(async (symbol) => {
      const res = await fetch(`${baseUrl}/api/v3/ticker/24hr?symbol=${symbol}`);
      if (!res.ok) {
        console.error(`Failed to fetch price for ${symbol}`);
        return null;
      }
      return res.json();
    });

    const priceData = await Promise.all(pricePromises);
    
    // Filtrer les résultats null et formater
    const prices = priceData
      .filter(data => data !== null)
      .map(data => ({
        symbol: data.symbol,
        price: parseFloat(data.lastPrice),
        priceChange: parseFloat(data.priceChange),
        priceChangePercent: parseFloat(data.priceChangePercent),
        high24h: parseFloat(data.highPrice),
        low24h: parseFloat(data.lowPrice),
        volume24h: parseFloat(data.volume),
        quoteVolume24h: parseFloat(data.quoteVolume)
      }));

    // Récupérer aussi les balances si l'utilisateur est connecté
    let balances = null;
    if (process.env.BINANCE_API_KEY && process.env.BINANCE_SECRET_KEY) {
      try {
        const crypto = await import('crypto');
        const timestamp = Date.now();
        const queryString = `timestamp=${timestamp}`;
        const signature = crypto
          .createHmac('sha256', process.env.BINANCE_SECRET_KEY)
          .update(queryString)
          .digest('hex');

        const accountRes = await fetch(
          `${baseUrl}/api/v3/account?${queryString}&signature=${signature}`,
          { headers: { 'X-MBX-APIKEY': process.env.BINANCE_API_KEY } }
        );

        if (accountRes.ok) {
          const accountData = await accountRes.json();
          balances = accountData.balances
            ?.filter((b: any) => parseFloat(b.free) > 0 || parseFloat(b.locked) > 0)
            .map((b: any) => ({
              asset: b.asset,
              free: parseFloat(b.free),
              locked: parseFloat(b.locked),
              total: parseFloat(b.free) + parseFloat(b.locked)
            }));
        }
      } catch (error) {
        console.error('Failed to fetch balances:', error);
      }
    }

    // Calculer la valeur totale du portfolio si on a les balances
    let portfolioValue = 0;
    if (balances) {
      balances.forEach((balance: any) => {
        const priceInfo = prices.find(p => p.symbol === `${balance.asset}USDT`);
        if (priceInfo) {
          portfolioValue += balance.total * priceInfo.price;
        } else if (balance.asset === 'USDT') {
          portfolioValue += balance.total;
        }
      });
    }

    return NextResponse.json({
      success: true,
      testnet: process.env.BINANCE_TESTNET === 'true',
      prices,
      balances,
      portfolioValue: portfolioValue.toFixed(2),
      timestamp: Date.now()
    });

  } catch (error) {
    console.error('Error fetching prices:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch prices',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Route POST pour récupérer les prix de symboles spécifiques
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { symbols } = body;
    
    if (!symbols || !Array.isArray(symbols)) {
      return NextResponse.json(
        { error: 'Invalid symbols array' },
        { status: 400 }
      );
    }

    const baseUrl = process.env.BINANCE_TESTNET === 'true' 
      ? 'https://testnet.binance.vision'
      : 'https://api.binance.com';

    const pricePromises = symbols.map(async (symbol: string) => {
      const res = await fetch(`${baseUrl}/api/v3/ticker/price?symbol=${symbol}`);
      if (!res.ok) return null;
      const data = await res.json();
      return {
        symbol: data.symbol,
        price: parseFloat(data.price)
      };
    });

    const prices = (await Promise.all(pricePromises)).filter(p => p !== null);

    return NextResponse.json({
      success: true,
      prices,
      timestamp: Date.now()
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch prices' },
      { status: 500 }
    );
  }
}