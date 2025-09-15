import { NextResponse } from 'next/server';

export async function GET() {
  // Récupérer les trades depuis l'API
  const tradesRes = await fetch(`${process.env.NEXT_PUBLIC_URL}/api/binance/trades`);
  const { trades } = await tradesRes.json();
  
  // Créer le CSV
  const headers = ['Date', 'Paire', 'Type', 'Quantité', 'Prix', 'Total', 'Commission'];
  const rows = trades.map((trade: any) => [
    new Date(trade.time).toISOString(),
    trade.symbol,
    trade.isBuyer ? 'ACHAT' : 'VENTE',
    trade.qty,
    trade.price,
    trade.quoteQty,
    trade.commission
  ]);
  
  const csv = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');
  
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="trades-${Date.now()}.csv"`
    }
  });
}